import type { picture } from "../type/picture.type.js";
import { DataItem } from "../transaction/dataItem.js";
import { readFile, checkPathExists } from "../util/index.js";

/**
 * @class
 * CopybookParser lets you parse a COBOL copybook into an array of {@link DataItem}'s that can be then be used further.
 * 
 * Together with the {@link Transaction} and {@link TransactionPackage} class, it can be used to load transaction data from a file, parse it into
 * {@link DataItem} objects, alter the value and store the (modified) transaction
 */
export class CopybookParser {
    private copybookPath: string
    private parsedCopybook: DataItem[];

    constructor(copybookPath: string) {
        if (copybookPath === '') {
            throw new Error(`Please provide a copybook path`);
        }

        checkPathExists(copybookPath);
        this.copybookPath = copybookPath;
        this.parsedCopybook = [];
    }

    /**
     * Parse the copybook file and return an array of top-level DataItem objects.
     *
     * Behavior:
     * - Validates that `this.copybookPath` is set and exists (throws `Error` if not).
     * - Reads the copybook file as text and splits it into lines using CRLF or LF.
     * - Normalizes tabs to spaces and trims each line; skips blank lines and full-line
     *   comments that start with `*`.
     * - Removes trailing periods from lines before parsing.
     * - Extracts a line header consisting of a numeric level, an identifier/name and
     *   the remainder of the line. From the remainder it recognizes the clauses
     *   `PIC` (string/number/packed), `OCCURS`, `REDEFINES`, and `VALUE`.
     * - Builds a tree of `DataItem` objects using numeric levels to determine
     *   parent/child relationships.
     *
     * Returns:
     * - `DataItem[]` — an array of root-level copybook items (groups and fields).
     *
     * Throws:
     * - `Error` when the copybook path is not set or the file is empty.
     *
     */

    /**
     * Parses a copybook for which the path is set in either the `constructor` or {@link CopybookParser.updateCopybookPath | updateCopybookPath(path)} 
     * and returns an array of {@link DataItem}'s representing the copybook
     * 
     * @remarks
     * - Lines in copybook will be split based on `CRLF` or `LF`
     * - Tabs will be replaced with spaces, all lines will be trimmed
     * - Skips blank lines or comment lines starting with `*`
     * 
     * @remarks
     * If the copybook contains an `OCCURS` clause, the processed dataItem will be replaced by `n` dataItems. They will be identified by the {@link DataItem.name} property
     * like `NAME-n`
     * 
     * @throws Throws an error when copybook path is not set or doesn't exist, or in certain cases when unable to parse the current copybook line
     * @returns Array of {@link DataItem} representing the copybook 
     */
    parse(): DataItem[] {
        this.parsedCopybook = []; // reset previous parse result
        const data = readFile(this.copybookPath);
        if (data === '') {
            throw new Error(`Loaded copybook file is empty`);
        }

        const lines = data
            .split(/\r?\n/)
            .map(l => l.replace(/\t/g, ' ').trim())
            .filter(l => l.length > 0 && !/^\s*\*/.test(l));
        
        const dataItems: DataItem[] = [];
        const stack: { level: number, item: DataItem}[] = [];

        for (let l of lines) {
            // Remove trailing period and inline comments
            let line = l.replace(/\./g, '').trim();
            if (line === '') continue;

            const header = line.match(/^\s*(\d{1,2})\s+([A-Z0-9-]+)\s*(.*)$/i);
            
            if (!header) continue;

            // Construct basic info
            const level = Number(header[1]);
            const name = header[2];
            
            if (!name) { throw new Error(`Failed to parse name from line: ${line}`);}

            const remainingPart = header[3] || ''; // empty for group fields

            // Handle PIC clause
            const picMatch = remainingPart.match(/PIC\s+([^\s]+)/i)
            let picture: picture = 'group';
            let signed = false;
            let length = 0;

            if (picMatch) {
                const picToken = picMatch[1]!.toUpperCase(); // Used to determine PIC clause
                signed = /S/.test(picToken);

                if (/X/.test(picToken)) {
                    // Alphanumeric picture
                    picture = 'string';
                    const m = picToken.match(/X\((\d+)\)/i)
                    if (m) {
                        length = Number(m[1]);
                    } else {
                        const countX = (picToken.match(/X/g) || []).length;
                        length = countX || 1;
                    }
                } else {
                    // Check if packed field
                    if(/COMP-3/i.test(remainingPart) || /COMP-3/i.test(picToken)) {
                        picture = 'packed';
                    } else {
                        picture = 'number';
                    }

                    let len = 0;
                    let regex = /9\((\d+)\)/g;
                    let m: RegExpExecArray | null;
                    while ((m = regex.exec(picToken)) !== null) {
                        len += Number(m[1]);
                    }

                    const temp = picToken.replace(/9\((\d+)\)/g, '');
                    len += (temp.match(/9/g) || []).length;
                    length = len || 1;

                    // Determine implied decimal digits (V specifier)
                    let decimals = 0;
                    const vParen = picToken.match(/V9\((\d+)\)/i);
                    if (vParen) {
                        decimals = Number(vParen[1]);
                    } else {
                        const vMatches = picToken.match(/V(9+)/i);
                        if (vMatches) decimals = vMatches[1]!.length;
                    }

                    // store decimals on a per-item basis via temporary var
                    (picMatch as any).__decimals = decimals;
                }
            } else {
                picture = 'group';
                length = 0;
            }

            // Handle OCCURS clause
            const occursMatch = remainingPart.match(/OCCURS\s+(\d+)/i);
            const occurs = occursMatch ? Number(occursMatch[1]) : undefined;

            // Handle REDEFINES clause
            const redefinesMatch = remainingPart.match(/REDEFINES\s+([A-Z0-9-]+.*)/i);
            const redefinesName = redefinesMatch ? redefinesMatch[1] : undefined;

            // Handle VALUE clause
            const valueMatch = remainingPart.match(/VALUE\s+('([^']*)'|ZERO|[A-Z0-9-]+)/i);
            let value: any = undefined;
            if (valueMatch) {
                if (valueMatch[2] !== undefined) value = valueMatch[2];
                else if(/^ZERO$/i.test(valueMatch[1]!)) value = 0
                else value = valueMatch[1];
            }

            const decimalsForItem = (picMatch && (picMatch as any).__decimals) ? (picMatch as any).__decimals : 0;
            const dataItem: DataItem = new DataItem(level, name, picture, length, signed, occurs, undefined, undefined, value, decimalsForItem);
            if (value !== undefined) dataItem.value = value;

            if (redefinesName) {                
                const target = this.findItemByName(redefinesName, dataItems);
                if (target) {
                    dataItem.redefines = target
                } else {
                    dataItem.redefines = { level: 0, name: redefinesName, picture: 'group', length: 0, signed: false }
                }
            }

            // Build hierarchy
            while (stack.length && stack[stack.length - 1]!.level >= level) stack.pop();
            if (stack.length === 0) {
                dataItems.push(dataItem);
            } else {
                const parent = stack[stack.length - 1]!.item;
                parent.children = parent.children || [];
                parent.children.push(dataItem);
            }
            
            stack.push({ level: level, item: dataItem });
        }

        this.parsedCopybook = this.handleOccurs(dataItems);
        return dataItems;
    }

    /**
     * Updates copybook path
     * 
     * @remark This will erased any previously parsed copybook data
     * @param copybookPath
     */
    updateCopybookPath(copybookPath: string): void {
        if (copybookPath === '') {
            throw new Error(`Please provide a copybook path`);
        } else {
            checkPathExists(copybookPath);
            this.copybookPath = copybookPath;
            this.parsedCopybook = [];
        }
    }

    /**
     * Gets parsed copybook
     * 
     * @remark
     * Return value will be empty if the {@link CopybookParser.parse | parse()} function has not yet been executed
     * @returns List of {@link DataItem}'s representing the previously parsed copybook 
     */
    getParsedCopybook(): DataItem[] {
        return this.parsedCopybook;
    }

    /**
     * Convert the parsed copybook to a JSON string
     * 
     * @remark
     * Return value will be an empty JSON array if the {@link CopybookParser.parse | parse()} function has not yet been executed
     * @returns string JSON object representing the copybook as string
     */
    toJson(): string {
        return JSON.stringify(this.parsedCopybook);
    }

    /**
     * Finds item by name
     * @param name name of the dataItem
     * @param items Array of {@link DataItem} containing already parsed dataItems
     * @returns item by name or `undefined` if not found
     */
    private findItemByName(name: string, items: DataItem[]): DataItem | undefined {
        for (const item of items) {
            if (item.name === name) return item;
            if (item.children) {
                const found = this.findItemByName(name, item.children as DataItem[])
                if (found) return found;
            }
        }
    }

    
    /**
     * Expands DataItems with OCCURS clause
     * 
     * Recursively processes a list of DataItems, expanding any item with an OCCURS value
     * into multiple cloned instances with suffixed names (e.g., "field-1", "field-2").
     * 
     * @param items - Array of DataItems to process, potentially containing OCCURS clauses
     * @returns Array of expanded DataItems with all OCCURS clauses resolved into individual items
     */
    private handleOccurs(items: DataItem[]): DataItem[] {
        const expand = (item: DataItem): DataItem[] => {
            // If no OCCURS, just recurse into children
            if (!item.occurs || item.occurs <= 1) {
                if (item.children) {
                    item.children = this.handleOccurs(item.children as DataItem[]);
                }
                return [item];
            }

            const expandedItems: DataItem[] = [];

            for (let i = 1; i <= item.occurs; i++) {
                // Shallow clone base properties
                const clone = new DataItem(
                    item.level,
                    `${item.name}-${i}`,
                    item.picture,
                    item.length,
                    item.signed,
                    item.occurs,
                    undefined,
                    undefined,
                    item.value,
                    item.decimals
                );

                clone.redefines = item.redefines;

                // Deep clone children
                if (item.children) {
                    clone.children = this.handleOccurs(
                        item.children.map(child => this.cloneItem(child as DataItem))
                    );
                }

                expandedItems.push(clone);
            }

            return expandedItems;
        };

        const result: DataItem[] = [];
        for (const item of items) {
            result.push(...expand(item));
        }
        return result;
    }

    /**
     * Clones dataItem into a new instance to separate references for further use
     * @param item {@link DataItem} to be cloned
     * @returns item Cloned {@link DataItem}
     */
    private cloneItem(item: DataItem): DataItem {
        const clone = new DataItem(
            item.level,
            item.name,
            item.picture,
            item.length,
            item.signed,
            item.occurs,
            undefined,
            undefined,
            item.value,
            item.decimals
        );

        clone.redefines = item.redefines;

        if (item.children) {
            clone.children = item.children.map(child => this.cloneItem(child as DataItem));
        }

        return clone;
    }
}