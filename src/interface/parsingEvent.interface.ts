import type { DataItem } from "../transaction/dataItem.ts"

/**
 * @interface
 * IParsingEvent interface is a helper interface to define the events that are submitted 
 * during parsing of a copybook and the data of these events.
 */
export interface IParsingEvent {
    /**
     * Fired at the beginning of parsing a copybook
     * Returns the following values:
     * - `copybook`: Path of the copybook
     * - `rawData`: string containing the data of the copybook before any modifications
     * - `preparedData`: Array of strings containing the lines to be parsed
     * 
     * @remarks
     * `preparedData` is `rawData` splitted on every new line, tabs replaced with ` `.
     * Only includes lines that are not empty
     */
    start: { copybook: string, rawData: string, preparedData: string[] }

    /**
     * Fired at the beginning of every line from the copybook that is parsed.
     * Returns the following values:
     * - `copybook`: Path of the copybook
     * - `line`: Currently processed line from the copybook
     * - `parsedItems`: Array of objects of parsed lines, represented by `level` and {@link DataItem}
     */
    newLine: { copybook: string, line: string, parsedItems: { level: number, item: DataItem}[] }
    
    /**
     * Fired at the end of every line from the copybook that is parsed.
     * Returns the following values:
     * - `copybook`: Path of the copybook
     * - `line`: Currently processed line from the copybook
     * - `newItem`: Object representing the current line as `level` and {@link DataItem}
     * - `parsedItems`: Array of objects of parsed lines, represented by `level` and {@link DataItem}
     * 
     * @remarks
     * `newItem` is also included in `parsedItems`
     */
    endLine: { copybook: string, line: string, newItem: { level: number, item: DataItem}, parsedItems: { level: number, item: DataItem}[] }
    
    /**
     * Fired at the end of parsing a copybook
     * Returns the following values:
     * - `copybook`: Path of the copybook
     * - `parsedItems`: Array of {@link DataItem} after any post processing (resolve absolute offsets, redefines and occurs)
     */
    end: { copybook: string, parsedCopybook: DataItem[] }
}