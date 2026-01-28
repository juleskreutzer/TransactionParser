import type { picture } from "../type/picture.type.js";
import { DataItem } from "../transaction/dataItem.js";
import { readFile, checkPathExists } from "../util/index.js";
import type { ICopybookItem } from "../interface/copybookItem.interface.js";
import type { usageType } from "../type/usage.type.js";
import type { IDataPosition } from "../interface/dataPosition.interface.js";

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
    private totalByteLength: number = 0;
    
    constructor(copybookPath: string) {
        if (copybookPath === '') {
            throw new Error(`Please provide a copybook path`);
        }

        checkPathExists(copybookPath);
        this.copybookPath = copybookPath;
        this.parsedCopybook = [];
    }

    /**
     * Parses a copybook for which the path is set in either the `constructor` or {@link CopybookParser.updateCopybookPath | updateCopybookPath(path)} 
     * and returns an array of {@link DataItem}'s representing the copybook
     * 
     * @remarks
     * - Lines in copybook will be split based on `CRLF` or `LF`
     * - Tabs will be replaced with spaces, all lines will be trimmed
     * - Skips blank lines or comment lines starting with `*`
     * 
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

            // Remove leading line number if present (e.g., "   1 01 CUSTOMER-RECORD" -> "01 CUSTOMER-RECORD")
            line = line.replace(/^\s*\d+\s+(\d{1,2}\s+)/, '$1');

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
            let usageType: usageType = 'display';
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
                    if (/ COMP/i.test(remainingPart) || / COMP/i.test(picToken)) usageType = 'comp';

                    // Check if packed field
                    if(/COMP-3/i.test(remainingPart) || /COMP-3/i.test(picToken)) {
                        picture = 'packed';
                        usageType = 'comp-3';
                    } else {
                        picture = 'number';
                    }

                    if (/COMP-1/i.test(remainingPart) || /COMP-1/i.test(picToken)) usageType = 'comp-1';
                    if (/COMP-2/i.test(remainingPart) || /COMP-2/i.test(picToken)) usageType = 'comp-2';
                    if (/COMP-4/i.test(remainingPart) || /COMP-4/i.test(picToken)) usageType = 'comp-4';
                    if (/COMP-5/i.test(remainingPart) || /COMP-5/i.test(picToken)) usageType = 'comp-5';

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

            // Calculate field length in bytes
            let byteLength = this.calculateBytes(picture, usageType, length);
            const dataPosition: IDataPosition = { offset: 0, byteLength: byteLength }

            const decimalsForItem = (picMatch && (picMatch as any).__decimals) ? (picMatch as any).__decimals : 0;

            let redefinesTarget: ICopybookItem | undefined = undefined;
            if (redefinesName) {                
                const target = this.findItemByName(redefinesName, dataItems);
                if (target) {
                    redefinesTarget = target
                    byteLength = redefinesTarget.dataPosition.byteLength; // Set byteLength to match the redefined field
                    dataPosition.byteLength = byteLength;
                } else {
                    redefinesTarget = { level: 0, name: redefinesName, picture: 'group', length: 0, signed: false } as DataItem
                }
            } 

            const dataItem: DataItem = new DataItem(level, name, picture, length, signed, usageType, dataPosition, occurs, redefinesTarget, undefined, undefined, decimalsForItem);

            if (value !== undefined) dataItem.setValue(value);

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

        this.setAbsoluteOffsets(dataItems);
        this.copyOffsetsForRedefines(dataItems);
        this.parsedCopybook = this.handleOccurs(dataItems);
        this.calculateTotalByteLength(this.parsedCopybook);
        return this.parsedCopybook;
    }

    /**
     * Updates copybook path
     * 
     * @remarks
     * This will erased any previously parsed copybook data
     * @param copybookPath
     */
    updateCopybookPath(copybookPath: string): void {
        if (copybookPath === '') {
            throw new Error(`Please provide a copybook path`);
        } else {
            checkPathExists(copybookPath);
            this.copybookPath = copybookPath;
            this.parsedCopybook = [];
            this.totalByteLength = 0;
        }
    }

    /**
     * Gets parsed copybook
     * 
     * @remarks
     * Return value will be empty if the {@link CopybookParser.parse | parse()} function has not yet been executed
     * @returns List of {@link DataItem}'s representing the previously parsed copybook 
     */
    getParsedCopybook(): DataItem[] {
        return this.parsedCopybook;
    }

    /**
     * Convert the parsed copybook to a JSON string
     * 
     * @remarks
     * Return value will be an empty JSON array if the {@link CopybookParser.parse | parse()} function has not yet been executed
     * @returns string JSON object representing the copybook as string
     */
    toJson(): string {
        return JSON.stringify(this.parsedCopybook);
    }

    getTotalByteLength(): number {
        return this.totalByteLength;
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
     * Calculate the length in bytes for the current copybook item
     * @param picture 
     * @param usage 
     * @param length 
     * @returns bytes 
     */
    private calculateBytes(picture: picture, usage: usageType, length: number): number {
        switch (usage) {
            case 'display':
                return length;
            case 'comp':
            case 'comp-4':
                if (length <= 4) return 2;
                if (length <= 9) return 4;
                if (length <= 18) return 8;

                throw new Error(`COMP field too large for parsing: S9(${length})`);
            case 'comp-3':
                // Packed decimal, so digits + sign
                return Math.ceil((length + 1) / 2);
            case 'comp-1':
                return 4;
            case 'comp-2':
                return 8;
            default:
                throw new Error(`Unsupported picture and/or usage clause: PIC ${picture}(${length}) ${usage}`);
        }
    }

    /**
     * Calculates the total byte length for the current copybook
     * @param items 
     */
    private calculateTotalByteLength(items: ICopybookItem[]) {
        if (items.length === 0) {
            this.totalByteLength = 0
        } else if (items[items.length - 1] !== undefined && items[items.length - 1]!.children !== undefined) {
            this.calculateTotalByteLength(items[items.length - 1]!.children!)
        } else {
            this.totalByteLength = items[items.length - 1]!.dataPosition.offset + items[items.length - 1]!.dataPosition.byteLength
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
                const newDataPosition: IDataPosition = { offset: item.dataPosition.offset + (i * item.dataPosition.byteLength), byteLength: item.dataPosition.byteLength };
                // Shallow clone base properties
                const clone = new DataItem(
                    item.level,
                    `${item.name}-${i}`,
                    item.picture,
                    item.length,
                    item.signed,
                    item.usage,
                    newDataPosition,
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
                        item.children.map(child => this.cloneItem(child as DataItem, i))
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
    private cloneItem(item: DataItem, occursCount: number): DataItem {
        const newDataPosition: IDataPosition = { offset: item.dataPosition.offset + ((occursCount - 1) * item.dataPosition.byteLength), byteLength: item.dataPosition.byteLength };
        const clone = new DataItem(
            item.level,
            item.name,
            item.picture,
            item.length,
            item.signed,
            item.usage,
            newDataPosition,
            item.occurs,
            undefined,
            undefined,
            item.value,
            item.decimals
        );

        clone.redefines = item.redefines;

        if (item.children) {
            clone.children = item.children.map(child => this.cloneItem(child as DataItem, occursCount));
        }

        return clone;
    }

    /**
     * Sets absolute offsets for all items sequentially
     * @param items Array of DataItems
     * @param currentOffset Starting offset
     * @returns The next offset after processing
     */
    private setAbsoluteOffsets(items: DataItem[], currentOffset = 0): number {
        for (const item of items) {
            item.dataPosition.offset = currentOffset;
            currentOffset += item.dataPosition.byteLength;
            if (item.children) {
                currentOffset = this.setAbsoluteOffsets(item.children as DataItem[], currentOffset);
            }
        }
        return currentOffset;
    }

    /**
     * Copies offsets from redefined targets to redefined items and their children
     * @param items Array of DataItems
     */
    private copyOffsetsForRedefines(items: DataItem[]): void {
        for (const item of items) {
            if (item.redefines && item.redefines.dataPosition) {
                this.copyOffsetsFromTarget(item, item.redefines);
            }
            if (item.children) {
                this.copyOffsetsForRedefines(item.children as DataItem[]);
            }
        }
    }

    /**
     * Copies offsets from the target to the redefined item and its children
     * @param item The redefined DataItem
     * @param target The target ICopybookItem
     */
    private copyOffsetsFromTarget(item: DataItem, target: ICopybookItem): void {
        item.dataPosition.offset = target.dataPosition.offset;
        if (item.children && target.children) {
            for (let i = 0; i < item.children.length && i < target.children.length; i++) {
                (item.children[i] as DataItem).dataPosition.offset = (target.children[i] as ICopybookItem).dataPosition.offset;
                this.copyOffsetsFromTarget(item.children[i] as DataItem, target.children[i] as ICopybookItem);
            }
        }
    }
}