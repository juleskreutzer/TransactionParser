import type { ITransaction } from "./transaction.interface.js";
import { CopybookParser } from "../parser/copybookParser.js";

/**
 * @interface
 * ITransaactionPackage is a helper interface that represents a group of transactions.
 * 
 * A `transaction package` uses one copybook and contains transactions that use the same copybook.
 */
export interface ITransactionPackage {
    /**
     * Array of {@link ITransaction} objects representing the transactions within the current transaction package 
     */
    transactions?: ITransaction[];

    /**
     * Instance of {@link CopybookParser} that is used to parse the copybook used by this transaction package 
     */
    readonly parser: CopybookParser;

    /**
     * Load data from a `Buffer` into transactions.
     * 
     * The `data` param can contain multiple transactions in a single buffer and {@link splitBuffer} is used to split the buffer
     * into an array of buffers for further processing
     * @param data 
     */
    load(data: Buffer): void;

    /**
     * Load data from a file into transactions
     * @param path 
     * @throws Throws an error when the provided path doesn't exist.
     */
    loadFile(path: string): void;

    /**
     * Create a new empty transaction using the parsed copybook
     */
    createEmptyTransaction(): void;
}