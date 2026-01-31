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
     * Get the first transaction in the current package, or `undefined` if no transactions exist.
     * 
     * @remarks
     * Convenience method, you can also use:
     * ```typescript
     * transactionPackage.transactions[0]
     * ```
     *
     * @return {*}  {(ITransaction | undefined)}
     */
    getFirstTransaction(): ITransaction | undefined;

    /**
     * Get the last transaction in the current package, or `undefined` if no transactions exist.
     * 
     * @remarks
     * Convenience method, you can also use:
     * ```typescript
     * transactionPackage.transactions[transactionPackage.transactions.length - 1]
     * ```
     * @return {*} {(ITransaction | undefined)}
     */
    getLastTransaction(): ITransaction | undefined;

    /**
     * Create a new empty transaction using the parsed copybook
     */
    createEmptyTransaction(): void;

    /**
     * Convert the current transaction package to a buffer
     *
     * @return {*}  {Buffer}
     */
    toBuffer(): Buffer;

    /**
     * Convert the current transaction package to an array of transactions as JSON string
     *
     * @return {*}  {string}
     */
    toJson(): string;

    /**
     * Save the current transaction package to file.
     * 
     * The new line character `x'15'` will be added at the end of each transaction
     *
     * @param {string} path
     */
    save(path: string): void;
}