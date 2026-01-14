import type { ICopybookItem, picture } from "../index.ts";
import { Transaction, DataItem } from "../index.ts";

import * as fs from 'fs'; 

export class CopybookParser {
    private copybookPath: string
    private parsedCopybook: DataItem[];

    constructor(copybookPath: string) {
        if (copybookPath === '') {
            throw new Error(`Please provide a copybook path`);
        }

        this.copybookPath = copybookPath;
        this.validateCopybookPath();

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
    parse(): DataItem[] {
        this.validateCopybookPath();

        // Clear any previously parsed copybook
        this.parsedCopybook = [];

        const data = fs.readFileSync(this.copybookPath).toString();
        if (data === '') {
            throw new Error(`Loaded transaction file is empty`);
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

            const dataItem: DataItem = new DataItem(level, name, picture, length, signed, occurs);
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
        
        this.parsedCopybook = dataItems;
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
            this.validateCopybookPath();
            this.copybookPath = copybookPath;
            this.parsedCopybook = [];
        }
    }

    getParsedCopybook(): DataItem[] {
        return this.parsedCopybook;
    }

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
     * Validates copybook path exists
     * @throws Throws error when `this.copybookPath` is empty or when the provided path does not exist
     */
    private validateCopybookPath(): void {
        if (this.copybookPath === '') {
            throw new Error(`No copybook path set`);
        }
        else if (!fs.existsSync(this.copybookPath)) {
            throw new Error(`Provided copybook path '${this.copybookPath}' does not exist`);
        }
    }
}