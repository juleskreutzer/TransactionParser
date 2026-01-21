import type { ICopybookItem } from "../interface/copybookItem.interface.ts";
import type { ITransaction } from "../interface/transaction.interface.ts";
import { CopybookParser } from "../parser/copybookParser.ts";
import { checkPathExists, readFile } from "../util/index.ts";

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
            
        }

    }

    /**
     * Update the copybook path used for this transaction
     * 
     * @remark
     * This will clear the current data items that have been parsed using 
     * the previous copybook path and the copybook is parsed again
     * @param path Path to the copybook
     * @throws Throws an error if the copybook path doesn't exist, or when an error occurs during parsing
     */
    setCopybookPath(path: string): void {
        checkPathExists(path);

        this.dataItems = [];
        this.parser.updateCopybookPath(path);
        this.parser.parse();
    }

    /**
     * Return an array of all copybook items
     * @returns copybook items 
     */
    getCopybookItems(): ICopybookItem[] {
        return this.dataItems;
    }

    /**
     * Get a specific copybook item based on the name of the item
     * 
     * @remark
     * It is possible that due to an occurs class, mutliple data items with the same name exist.
     * Only the first occurance will be returned. Using the name of the group field might be better
     * @param name Name of the copybook item 
     * @returns copybook item 
     */
    getCopybookItem(name: string): ICopybookItem | undefined {
        return this.dataItems.find(v => v.name === name);
    }

    /**
     * Get the value of a specific copybook item using the name of the copybook item
     *
     * @param name 
     * @returns value Returns the string representatation of the copybook item's value, or undefined if it is not set
     * @throws Throws an error if a copybook item couldn't be found based on the provided name
     */
    getValue(name: string): string | undefined {
        const item: ICopybookItem | undefined = this.dataItems.find(v => v.name === name);

        if (item === undefined) {
            throw new Error(`Copybook item with name '${name}' couldn't be found`);
        } else {
            return item.value
        }
    }

    /**
     * Set the value of a copybook item based on the name of the item
     * @param name Name of the copybook item
     * @param value String representatation of the value for the copybook item
     * @throws Throws an error if a copybook item couldn't be found based on the provided name
     */
    setValue(name: string, value: string): void {
        const item = this.dataItems.find(v => v.name === name);

        if (item === undefined) {
            throw new Error(`Copybook item with name '${name}' couldn't be found`);
        } else {
            item.setValue(value);
        }
    }
    
    toString(): string {
        throw new Error("Method not implemented.");
    }
    
}