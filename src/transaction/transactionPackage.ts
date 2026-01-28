import { Transaction } from "./transaction.js";
import { CopybookParser } from "../parser/copybookParser.js";
import { checkPathExists, readFile, readFileAsBuffer, splitBuffer } from "../util/index.js";
import type { ITransactionPackage } from "../interface/transactionPackage.interface.ts";
import type { ITransaction } from "../interface/transaction.interface.ts";

/**
 * @experimental
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
 */
export class TransactionPackage implements ITransactionPackage {
    transactions: ITransaction[];
    private copybookPath: string;
    readonly parser: CopybookParser;
    
    constructor(copybookPath: string, transactions?: ITransaction[]) {
        if (copybookPath === '') throw new Error(`Please provide a copybook path`);

        // Check if copybook path exists
        checkPathExists(copybookPath);

        this.copybookPath = copybookPath;
        this.parser = new CopybookParser(copybookPath);
        this.parser.parse();
        this.transactions = transactions === undefined || transactions.length === 0 ? [] : transactions;
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
            this.transactions.push(new Transaction(this.copybookPath, this.parser.getParsedCopybook(), buf));
        })
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
     * Get a transaction from this package based on the index 
     * @param index 
     * @returns transaction 
     */
    getTransaction(index: number): ITransaction | undefined {
        return this.transactions[index];
    }

    /**
     * Get all transaction in this transaction package
     * @returns transaction Array of transactions, or undefined if no transactions exist
     */
    getTransactions(): ITransaction[] {
        return this.transactions;
    }

    /**
     * Get the first transaction from this package
     * @returns first transaction 
     */
    getFirstTransaction(): ITransaction | undefined {
        if (this.transactions.length === 0) return undefined
        else return this.transactions[0];
    }

    /**
     * Get the last transaction from this packagee
     * @returns last transaction 
     */
    getLastTransaction(): ITransaction | undefined {
        if (this.transactions.length === 0) return undefined;
        else return this.transactions[this.transactions.length - 1];
    }

    /**
     * Create a new empty transaction in this package.
     */
    createEmptyTransaction(): void {
        this.transactions.push(new Transaction(this.copybookPath, this.parser.getParsedCopybook()));
    }

}