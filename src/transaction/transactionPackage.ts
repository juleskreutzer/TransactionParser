import { Transaction } from "./transaction.js";
import { CopybookParser } from "../parser/copybookParser.js";
import { checkPathExists, readFileAsBuffer, splitBuffer, writeFile } from "../util/index.js";
import { DataItem } from "./dataItem.js";
import { TypedEventEmitter } from "../events/typedEventEmitter.ts";
import type { ITransactionPackage } from "../interface/transactionPackage.interface.js";
import type { ITransaction } from "../interface/transaction.interface.js";
import type { ICopybookItem } from "../interface/copybookItem.interface.js"
import type { IDataPosition } from "../interface/dataPosition.interface.ts";
import type { IEventSupport } from "../interface/eventSupport.interface.ts";
import type { IEvent } from "../interface/event.interface.ts";
import type { ITransactionPackageEvent } from "../interface/transactionPackageEvent.interface.ts"

/**
 * @class
 * 
 * The TransactionPackage class represents a transaction file that can contain multiple transactions.
 * 
 * @example
 * Create a new Transaction Package and load data from a (binary) file:
 * ```typescript
 * const tp: TransactionPackage = new TransactionPackage('path/to/copybook'); // Creates new (empty) transaction package
 * tp.loadFile('path/to/data/file'); // Load file and create transactions
 * 
 * console.log(tp.transactions); // Logs all transaction in package
 * ```
 * 
 * @remarks
 * This calss supports events via {@link TypedEventEmitter}, see {@link ITransactionPackageEvent}
 */
export class TransactionPackage implements ITransactionPackage, IEventSupport {
    transactions: ITransaction[];
    readonly parser: CopybookParser;
    private emitter: TypedEventEmitter<ITransactionPackageEvent>;
    
    constructor(copybookPath: string, transactions?: ITransaction[]) {
        if (copybookPath === '') throw new Error(`Please provide a copybook path`);

        // Check if copybook path exists
        checkPathExists(copybookPath);

        // Initialize event emitter for later use
        this.emitter = new TypedEventEmitter<ITransactionPackageEvent>();

        this.parser = new CopybookParser(copybookPath);
        this.parser.parse();
        
        // Copybook has been parsed, emit event
        this.emitter.emit('parsingComplete', { parser: this.parser, parsedCopybook: this.parser.getParsedCopybook() });

        this.transactions = transactions === undefined ? [] : transactions.length > 0 ? transactions : [];
        
        // Transactions are assigned, if provided, otherwise empty array
        this.emitter.emit('transactionsLoaded', { parser: this.parser, transactions: this.transactions})
    }

    /**
     * Create a clone of the copybook items retrieved from parser to prevent reuse of the same instances and overwriting data
     *
     * @private
     * @param {ICopybookItem[]} items
     * @return {*}  {ICopybookItem[]}
     */
    private clone(items: ICopybookItem[]): ICopybookItem[] {
        let result: DataItem[] = [];

        items.forEach(item => {
            const newDataPositon: IDataPosition = { offset: item.dataPosition.offset, byteLength: item.dataPosition.byteLength };
            const newItem: DataItem = new DataItem(
                item.level,
                item.name,
                item.picture,
                item.length,
                item.signed,
                item.usage,
                newDataPositon,
                item.occurs,
                undefined,
                undefined,
                item.value,
                item.decimals
            );

            newItem.redefines = item.redefines;
            if (item.children && item.children.length > 0) {
                newItem.children = this.clone(item.children);
            }

            result.push(newItem as DataItem);
        });

        return result;
    }

    /**
     * Load transaction(s) from a buffer
     * 
     * @remarks
     * The buffer can represent multiple transactions.
     * Based on the length of the copybook, the buffer will be split
     *
     * @param {Buffer} data Transaction data
     */
    load(data: Buffer): void {
        if (data.length === 0) throw new Error('No transaction data provided');

        const buffers = splitBuffer(data, this.parser.getTotalByteLength());

        buffers.forEach(buf => {
            this.transactions.push(new Transaction(this.clone(this.parser.getParsedCopybook()), buf));
        })

        // Emit event that transactions are loaded
        this.emitter.emit('transactionsLoaded', { parser: this.parser, transactions: this.transactions });
    }

    /**
     * Load transaction from a file
     * 
     * This method will read the file and pass the data to {@link load | TransactionPackage.load(data: string)} to process the data into a transaction
     * @param path 
     */
    loadFile(path: string): void {
        checkPathExists(path);

        this.load(readFileAsBuffer(path));
    }

    /**
     * Get the first transaction from this package
     * @returns first transaction 
     */
    getFirstTransaction(): ITransaction | undefined {
        return this.transactions.length > 0 ? this.transactions[0] : undefined;
    }

    /**
     * Get the last transaction from this package
     * @returns last transaction 
     */
    getLastTransaction(): ITransaction | undefined {
        return this.transactions.length > 0 ? this.transactions[this.transactions.length - 1] : undefined;
    }

    /**
     * Create a new empty transaction in this package.
     */
    createEmptyTransaction(): void {
        this.transactions.push(new Transaction(this.clone(this.parser.getParsedCopybook())));

        // Emit event that new transaction is created
        this.emitter.emit('transactionCreated', { parser: this.parser, newTransaction: this.getLastTransaction()!, transactions: this.transactions})
    }

    /**
     * Convert the current transaction package to a buffer
     * 
     * @remarks
     * At the end of each transaction, a `x'15'` (New Line) byte is inserted
     *
     * @return {*}  {Buffer}
     */
    toBuffer(): Buffer {
        if (this.transactions.length === 0) {
            return Buffer.alloc(this.parser.getTotalByteLength() + 1).fill(0);
        } else {
            // Create a buffer with size of data length for 1 transaction times the amount of transactions in this package, plus 1 byte per transaction for new line character
            let buffer: Buffer = Buffer.alloc((this.parser.getTotalByteLength() * this.transactions.length) + this.transactions.length);
            for(let i = 0; i < this.transactions.length; i++) {
                if (i === 0) {
                    buffer.fill(this.transactions[i]!.toBuffer(), 0, this.parser.getTotalByteLength());
                    buffer.fill(0x15, this.parser.getTotalByteLength(), this.parser.getTotalByteLength() + 1); // Insert new line character
                } else {
                    buffer.fill(this.transactions[i]!.toBuffer(), (i * this.parser.getTotalByteLength()) + i, ((i + 1) * this.parser.getTotalByteLength()) + i);
                    buffer.fill(0x15, ((i + 1) * this.parser.getTotalByteLength()) + i, ((i + 1) * this.parser.getTotalByteLength()) + i + 1); // Insert new line character
                }
            }
            return buffer;
        }
    }

    /**
     * Convert the current package to an array of transactions as JSON string
     *
     * @param {number} [spaces] Number of spaces to use for indentation
     * @return {*}  {string}
     */
    toJson(spaces?: number): string {
        return JSON.stringify(this.transactions, null, spaces);
    }

    /**
     * Save the current package to a file
     *
     * @param {string} path
     */
    save(path: string): void {
        if (path === '') throw new Error('Please provide a path to save the transaction package to');
        const dataToSave: Buffer = this.toBuffer();
        writeFile(dataToSave, path);

        // Emit event that transactions are saved to file
        this.emitter.emit('transactionPackageSaved', { parser: this.parser, transactions: this.transactions, buffer: dataToSave, outputPath: path});
    }

    getEventEmitter(): TypedEventEmitter<IEvent> {
        return this.emitter
    }

}