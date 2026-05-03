import type { CopybookParser } from "../parser/copybookParser.ts";
import type { DataItem } from "../transaction/dataItem.ts";
import type { IEvent } from "./event.interface.ts";
import type { ITransaction } from "./transaction.interface.ts";

/**
 * @interface
 * ITransactionPackageEvent interface is a helper interface to define the events that are submitted 
 * during interaction with a {@link TransactionPackage}
 * test
 */
export interface ITransactionPackageEvent extends IEvent {

    /**
     * Fired after {@link CopybookParser} is initialized and before parsing starts.
     * Can be used to subsribe to parsing events via `parser.getEventEmitter()`
     * Returns the following values:
     * - `parser`: Instance of {@link CopybookParser} that is used to parse the provided copybook
     * 
     *  @remarks
     * To receive events related to Copybook parsing, use the {@link TransactionPackage.parser | `parser` property}, see {@link IParsingEvent} for available events
     */
    beforeParsing: { parser: CopybookParser }

    /**
     * Fired after the copybook provided when creating a transaction package has been parsed
     * Returns the following values:
     * - `parser`: Instance of {@link CopybookParser} that is used to parse the provided copybook
     * - `parsedCopybook`: Array of {@link DataItem} containing the parsed copybook values
     * 
     */
    parsingComplete: { parser: CopybookParser, parsedCopybook: DataItem[]}

    /**
     * This event is triggered:
     * - When a new {@link TransactionPackage} instance is created.
     * - When the {@link TransactionPackage.loadFile} or {@link TransactionPackage.load} methods are used 
     * 
     * The following values will be returned:
     * - `parser`: Instance of {@link CopybookParser} that is used to parse the provided copybook
     * - `transactions`: Array of {@link ITransaction} that are loaded
     * 
     * @remarks
     * `transactions` is possibly an empty array when no transactions are provided. {@link TransactionPackage.load} will check 
     * if data is provided in the buffer. Within the {@link TransactionPackage} constructor, an empty transactions array is created when
     * no transactions are provided
     */
    transactionsLoaded: { parser: CopybookParser, transactions: ITransaction[]}

    /**
     * Fired when a new transaction is created after the {@link TransactionPackage} has been initialized by calling {@link TransactionPackage.createEmptyTransaction}
     * 
     * The following values are returned:
     * - `parser`: Instance of {@link CopybookParser} that is used to parse the provided copybook
     * - `newTransaction`: {@link ITransaction} that has recently been created
     * - `transactions`: Array of {@link ITransaction} containing the transactions that are added to the current transaction package
     * 
     * @remarks
     * `newTransaction` is included at the last position within the `transactions` array
     */
    transactionCreated: { parser: CopybookParser, newTransaction: ITransaction, transactions: ITransaction[]}

    /**
     * Fired when a transaction package is stored to a file.
     * 
     * The following values will be returned:
     * - `parser`: Instance of {@link CopybookParser} that is used to parse the provided copybook
     * - `transactions`: Array of {@link ITransaction} containing all the transaction that will be written to the output file
     * - `buffer`: {@link Buffer} object containing the raw data that will be written to file
     * - `outputPath`: Path where the output will be saved
     */
    transactionPackageSaved: { parser: CopybookParser, transactions: ITransaction[], buffer: Buffer, outputPath: string}

}