import type { ICopybookItem } from "./copybookItem.interface.ts";

/**
 * @interface
 * ITransaction is a helper interface for the representation of a `transaction`
 * 
 * A transaction represents one entity in a {@link TransactionPackage} and uses a copybook to determine which elements a transaction has
 */
export interface ITransaction {
    /**
     * Get an array of all {@link ICopybookItem} linked to the transaction based on the parsed copybook
     * @returns 
     */
    getCopybookItems(): ICopybookItem[];

    /**
     * Get a {@link ICopybookItem} based on the name of the item
     * @param name Name of the copybook item
     * @returns copybook item 
     */
    getCopybookItem(name: string): ICopybookItem | undefined;

    /**
     * Get the value of a specific {@link ICopybookItem} based on the name of the item
     * @param name Name of the copybook item
     * @returns value 
     */
    getValue(name: string): string | undefined;

    /**
     * Set the value of a specific {@link ICopybookItem} based on the name of the item.
     * 
     * @param name Name of the copybook item
     * @param value String representation of the value
     */
    setValue(name: string, value: string): void;

    /**
     * Get the JSON representation of the current transaction as string
     * @returns json 
     */
    toJson(): string
}