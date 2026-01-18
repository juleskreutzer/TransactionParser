import { Transaction } from "./transaction.js";
import { checkPathExists, readFile } from "../util/index.js";

/**
 * @experimental
 * @class
 * 
 * The TransactionPackage class represents a transaction file that can contain multiple transactions.
 */
export class TransactionPackage {
    private transactions: Transaction[];
    private copybookPath: string;
    
    constructor(copybookPath: string, transactionDataPath?: string) {
        if (copybookPath === '') throw new Error(`Please provide a copybook path`);

        // Check if copybook path exists
        checkPathExists(copybookPath);

        this.copybookPath = copybookPath;
        this.transactions = [];

        if (transactionDataPath && transactionDataPath !== '') {
            // Load transaction data from file
            this.loadTransactionDataFromFile(transactionDataPath);
        }
    }

    getTransactions(): Transaction[] {
        return this.transactions;
    }

    loadTransactionData(data: string): void {

    }

    loadTransactionDataFromFile(path: string): void {
        this.loadTransactionData(readFile(path));
    }

}