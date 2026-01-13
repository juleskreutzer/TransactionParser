import { Transaction } from '../transaction/transaction.js';

import * as fs from 'fs';

export class TransactionPackage {
    private copybookPath: string;
    private transactions: Transaction[] = []

    constructor(copybookPath: string, transactionFile?: string) {
        if (copybookPath === '') {
            throw Error(`Please provide a Copybook path that is used for this transaction package`);
        }

        this.copybookPath = copybookPath

        if(transactionFile) {
            this.loadTransactionDataFromFile(transactionFile);
        }
    }

    loadTransactionData(data: string) {

    }

    loadTransactionDataFromFile(filepath: string) {
        if (fs.existsSync(filepath)) {
            //TODO: Load data from filepath
        } else {
            throw new Error(`Provided filepath for transaction file does not exist`);
        }
    }
}