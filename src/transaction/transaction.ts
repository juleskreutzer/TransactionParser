import type { ICopybookItem } from "../interface/copybookItem.interface.ts";
import type { ITransaction } from "../interface/transaction.interface.ts";
import { CopybookParser } from "../parser/copybookParser.ts";
import { checkPathExists } from "../util/index.ts";

/**
 * @experimental
 * @class
 * 
 * The Transaction class represents a single line in a transactions file (package) that is represented by a copybook.
 * 
 * A transaction requires a parsed copybook to be able to store data in the resulting {@link DataItem}'s
 */
export class Transaction implements ITransaction {
    private dataItems: ICopybookItem[] = [];
    private parser: CopybookParser;

    constructor(copybookPath: string, transactionData?: string) {
        // Check if copybook path exists
        checkPathExists(copybookPath);

        this.parser = new CopybookParser(copybookPath);
        this.dataItems = this.parser.parse();

        if (transactionData && transactionData.length > 0) {
            this.from(transactionData);
        }

    }

    from(data: string): void {
        throw new Error("Method not implemented.");
    }
    fromFile(path: string): void {
        throw new Error("Method not implemented.");
    }
    setCopybookPath(path: string): void {
        throw new Error("Method not implemented.");
    }
    getLayout(): ICopybookItem[] {
        throw new Error("Method not implemented.");
    }
    getCopybookItem(name: string): ICopybookItem | undefined {
        throw new Error("Method not implemented.");
    }
    getValue(name: string): string | undefined {
        throw new Error("Method not implemented.");
    }
    setValue(name: string, value: string): void {
        throw new Error("Method not implemented.");
    }
    toString(): string {
        throw new Error("Method not implemented.");
    }
    
}