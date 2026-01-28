/**
 * The `usageType` type represents the `usage` clause in a COBOL copybook and 
 * is used to determine the {@link IDataPosition.byteLength } property and handling of reading transaction data
 */
export type usageType = 'display' 
    | 'comp'
    | 'comp-1'
    | 'comp-2'
    | 'comp-3'
    | 'comp-4'
    | 'comp-5'