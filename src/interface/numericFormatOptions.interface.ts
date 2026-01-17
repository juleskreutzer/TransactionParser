import type { IFormatOptions } from './formatOptions.interface.js';

export interface INumericFormatOptions extends IFormatOptions {
    decimals?: number;
    signed?: boolean;
}