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
    private rawData: Buffer | undefined

    constructor(copybookPath: string, transactionData?: Buffer) {
        // Check if copybook path exists
        checkPathExists(copybookPath);

        // Parse copybook to create dataItems
        this.parser = new CopybookParser(copybookPath);
        this.dataItems = this.parser.parse();

        // If transactionData is provide, parse it into the dataItems
        if (transactionData && transactionData.length > 0) {
            this.rawData = transactionData;
            this.processTransactionData(transactionData, this.dataItems);
        }
    }

    private processTransactionData(data: Buffer, items: ICopybookItem[]): void {
        if (data.length <= 0) {
            return
        }

        items.forEach(item => {
            if (item.picture === 'group') {
                if (item.children && item.children.length > 0) {
                    this.processTransactionData(data, item.children);
                } else {
                    throw new Error(`Unable to process '${item.name}' since it is a group field without children`);
                }
            }

            switch(item.picture) {
                case 'string':
                    // const bufferPart = data.subarray(item.dataPosition.offset, item.dataPosition.byteLength);
                    // const iconv = new Iconv('cp856', 'UTF8')
                    // const convertedBuffer = iconv.convert(bufferPart);
                    // const valueString: string = convertedBuffer.toString();
                    // item.setValue(valueString);
                    break;
                case 'number':
                    break;
                case 'packed':
                    break;
                default:
                    throw new Error(`PIC clause '${item.picture}' for item '${item.name}' cannot be processed`);
            }
        })
        
    }
    /**
     * Recursively process private property `rawData` using the `dataItems` that have been created when parsing the copybook
     * @param items 
     * @throws Throws an error when `rawData` is undefined, when `DataItem.start` is unknown or when an unsupported picture clause is used
     */
    // private processTransactionData(items: ICopybookItem[]): void {
    //     if (this.rawData === undefined) { throw new Error('No data to process'); }
    //     items.forEach(item => {
    //         if (item.children && item.children.length > 0) {
    //             this.processTransactionData(item.children);
    //         }

    //         if (item.start === undefined) { throw new Error(`Unable to determine start position of item '${item.name}' since property is empty`); }

    //         let value = '';
    //         switch(item.picture) {
    //             case 'string':
    //                 const valueAsBuffer = this.rawData!.slice(item.start, item.start + item.length);
    //                 const iconv = new Iconv('EBCDIC-US', 'UTF8');
    //                 const value = iconv.convert(valueAsBuffer);
    //             case 'number':
    //             case 'packed':
    //                 throw new Error('Processing of packed fields is currently not supported');
    //             case 'group':
    //                 throw new Error('Processing of group field is currently not supported');
    //             default:
    //                 throw new Error(`Picture clause '${item.picture}' is currently not supported when reading transaction data`);
    //         }
    //     })
    // }

    /**
     * Update the copybook path used for this transaction
     * 
     * @remarks
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
     * @remarks
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