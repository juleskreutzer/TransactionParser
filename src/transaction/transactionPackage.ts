import { Transaction } from "./transaction.js";
import { checkPathExists, readFile } from "../util/index.js";
import type { ITransactionPackage } from "../interface/transactionPackage.interface.ts";
import type { ITransaction } from "../interface/transaction.interface.ts";

/**
 * @experimental
 * @class
 * 
 * The TransactionPackage class represents a transaction file that can contain multiple transactions.
 */
export class TransactionPackage implements ITransactionPackage {
    transactions: ITransaction[];
    private copybookPath: string;
    
    constructor(copybookPath: string, transactions?: ITransaction[]) {
        if (copybookPath === '') throw new Error(`Please provide a copybook path`);

        // Check if copybook path exists
        checkPathExists(copybookPath);

        this.copybookPath = copybookPath;
        this.transactions = transactions === undefined || transactions.length === 0 ? [] : transactions;
    }

    load(data: Buffer): void {
        if (data.length === 0) throw new Error('No transaction data provided');

        // const lines = data
        //     .split(/\r?\n/)
        //     .map(l => l.replace(/\t/g, ' ').trim())
        //     .filter(l => l.length > 0 && !/^\s*\*/.test(l));

        // lines.forEach((line: string) => {
        //     const transaction: ITransaction = new Transaction(this.copybookPath, line);
        //     this.transactions.push(transaction);
        // })
        throw new Error('Method not yet implemented');
    }

    /**
     * Load transaction from a file
     * 
     * This method will read the file and pass the data to {@link load | TransactionPackage.load(data: string)} to process the data into a transaction
     * @param path 
     */
    loadFile(path: string): void {
        checkPathExists(path);

        throw new Error('Method not yet implemented');
        // this.load(readFile(path));
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
        this.transactions.push(new Transaction(this.copybookPath));
    }

}