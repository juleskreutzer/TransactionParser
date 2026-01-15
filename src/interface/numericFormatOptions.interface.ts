import type { IFormatOptions } from '../index.ts';

export interface INumericFormatOptions extends IFormatOptions {
    decimals?: number;
    signed?: boolean;
}