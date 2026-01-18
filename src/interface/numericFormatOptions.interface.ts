import type { IFormatOptions } from './formatOptions.interface.js';

/**
 * @interface
 * INumericFormatOptions is a helper interface for formatting {@link DataItem} objects to a COBOL-style, fixed-width string.
 */
export interface INumericFormatOptions extends IFormatOptions {
    /** Decimals used in formatting, optional */
    decimals?: number;

    /** Signed indicator used in formatting, optional */
    signed?: boolean;
}