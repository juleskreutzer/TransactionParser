import type { ICopybookItem } from "../interface/copybookItem.interface.js";
import type { ITransaction } from "../interface/transaction.interface.js";
import { cp037 } from "../lookupTable/cp037.js";
import { checkPathExists } from "../util/index.js";

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
    private rawData: Buffer | undefined

    constructor(copybookPath: string, dataItem: ICopybookItem[], transactionData?: Buffer) {
        // Check if copybook path exists
        checkPathExists(copybookPath);

        // Parse copybook to create dataItems
        this.dataItems = dataItem

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
            
            let subData: Buffer;
            let value: string = '';

            switch(item.picture) {
                case 'string':
                    subData = data.subarray(item.dataPosition.offset, item.dataPosition.offset + item.dataPosition.byteLength);
                    subData.forEach(byte => {
                        value += cp037.find(v => v.dec === byte)?.char || '';
                    })
                    item.setValue(value);
                    value = '';
                    break;
                case 'number':
                    switch (item.usage) {
                        case 'display':
                            // Regular lookup just as with string
                            subData = data.subarray(item.dataPosition.offset, item.dataPosition.offset + item.dataPosition.byteLength);
                            subData.forEach(byte => {
                                value += cp037.find(v => v.dec === byte)?.char || '';
                            });
                            item.setValue(value);
                            value = '';
                            break;
                        case 'comp':
                        case 'comp-4':
                        case 'comp-5':
                            // COMP fields are binary integers (big-endian)
                            subData = data.subarray(item.dataPosition.offset, item.dataPosition.offset + item.dataPosition.byteLength);
                            if (item.dataPosition.byteLength === 2) {
                                value = item.signed ? subData.readInt16BE(0).toString() : subData.readUInt16BE(0).toString();
                            } else if (item.dataPosition.byteLength === 4) {
                                value = item.signed ? subData.readInt32BE(0).toString() : subData.readUInt32BE(0).toString();
                            } else if (item.dataPosition.byteLength === 8) {
                                value = item.signed ? subData.readBigInt64BE(0).toString() : subData.readBigUInt64BE(0).toString();
                            } else {
                                throw new Error(`Unsupported COMP field byte length (${item.dataPosition.byteLength}) for item '${item.name}'`);
                            }
                            item.setValue(value);
                            value = '';
                            break;
                        case 'comp-1':
                            // COMP-1 is single-precision floating point (4 bytes)
                            subData = data.subarray(item.dataPosition.offset, item.dataPosition.offset + item.dataPosition.byteLength);
                            value = subData.readFloatBE(0).toString();
                            item.setValue(value);
                            value = '';
                            break;
                        case 'comp-2':
                            // COMP-2 is double-precision floating point (8 bytes)
                            subData = data.subarray(item.dataPosition.offset, item.dataPosition.offset + item.dataPosition.byteLength);
                            value = subData.readDoubleBE(0).toString();
                            item.setValue(value);
                            value = '';
                            break;
                        case 'comp-3':
                            // COMP-3 is packed decimal
                            subData = data.subarray(item.dataPosition.offset, item.dataPosition.offset + item.dataPosition.byteLength);
                            value = this.unpackDecimal(subData);
                            item.setValue(value);
                            value = '';
                            break;
                        default:
                            throw new Error(`Usage type '${item.usage}' for item '${item.name}' cannot be processed`);
                    }
                    break;
                case 'packed':
                    break;
                case 'group':
                    // Intentionally left blank since groups are processed recursively
                    break;
                default:
                    throw new Error(`PIC clause '${item.picture}' for item '${item.name}' cannot be processed`);
            }
        });
    }

    /**
     * Unpacks a packed decimal (COMP-3) field
     * @param buffer Buffer containing the packed decimal data
     * @returns String representation of the decimal value
     */
    private unpackDecimal(buffer: Buffer): string {
        let result = '';
        
        // Process all bytes except the last
        for (let i = 0; i < buffer.length - 1; i++) {
            const byte = buffer[i];
            if (byte === undefined) throw new Error(`Unable to unpack value from buffer: '${buffer.toString('hex')}'`)
            const highNibble = (byte >> 4) & 0x0F;
            const lowNibble = byte & 0x0F;
            result += highNibble.toString() + lowNibble.toString();
        }
        
        // Process the last byte (contains one digit and the sign)
        const lastByte = buffer[buffer.length - 1];
        if (lastByte === undefined) throw new Error(`Unable to unpack last byte from buffer: '${buffer.toString('hex')}'`);
        const digit = (lastByte >> 4) & 0x0F;
        const sign = lastByte & 0x0F;
        
        result += digit.toString();
        
        // Sign nibble: 0x0C or 0x0F = positive, 0x0D = negative
        if (sign === 0x0D) {
            result = '-' + result;
        }
        
        return result;
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

    /**
     * Get a JSON representatation of the current transaction
     *
     * @return {*}  {string}
     * @memberof Transaction
     */
    toJson(): string {
        return JSON.stringify(this.dataItems);
    }
    
}