/**
 * @interface
 * IDataPosition interface is a helper interface to be used with {@link ICopybookItem} and represents the location of a specific 
 * copybook item in transaction data (the `offset` property) and the length of this copybook item (the `byteLength` property)
 * 
 * This interface is implemented by {@link DataItem}
 */
export interface IDataPosition {
    offset: number;
    byteLength: number;
}