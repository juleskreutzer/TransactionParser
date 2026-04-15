/**
 * @interface
 * ILookupTable interface is a helper interface for conversion of EBCDIC data and vice versa
 */
export interface ILookupTable {
    hex: string;
    dec: number;
    char: string;
    desc: string;
}