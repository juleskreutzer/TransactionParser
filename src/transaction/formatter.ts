import type { INumericFormatOptions } from "../interface/numericFormatOptions.interface.js";

/**
 * @experimental
 * @class
 * 
 * The Fromatter class contains helper functions to convert the value of a {@link DataItem} into a COBOL-style, fixed-width string
 */
export class Formatter {
    /**
     * Formats string to the provided length. Adds spaces at the end
     * @param value 
     * @param length 
     * @returns string 
     */
    static formatString(value: any, length: number): string {
        const s = String(value ?? '');
        if (length <= 0) return '';
        if (s.length > length) return s.substring(0, length);

        return s.padEnd(length, ' ');
    }

    /**
     * Format a numeric value into a fixed-width digit string based on total `length` and implied `decimal`
     * 
     * @remarks
     * The returned string contains only digits and no decimal point.
     * 
     * If `signed` is true in the {@link INumericFormatOptions | opts} and value is negative, the returned string will be prefixed with `-`. The sign character is **not** counted towards `length`
     * 
     * @param value [number|string] The value to format
     * @param length [number] Length of the field
     * @param opts [INumericFormatOptions] Optional formatting options
     * @throws Throws error when the value has more digits than `length` aftre applying decimals
     * @returns String representation of the numeric value
     */
    static formatNumeric(value: number | string, length: number, opts: INumericFormatOptions = {}): string {
        if (length <= 0) throw new Error('Length must be positive');
        const decimals = opts.decimals || 0;
        const signed = opts.signed || false;

        const num = Number(value);
        if (Number.isNaN(num)) throw new Error('Value cannot be parsed to number');

        const multiplier = Math.pow(10, decimals);
        const absInt = Math.round(Math.abs(num) * multiplier);
        const digits = String(absInt);

        if (digits.length > length) throw new Error(`Formatted value exceeds defined length of '${length}`);

        const padded = digits.padStart(length, '0');
        if (signed && num < 0) return '-' + padded;
        return padded;
    }

    static formatPacked(value: number | string, length: number, opts: INumericFormatOptions = {}): string {
        return this.formatNumeric(value, length, opts);
    }
}