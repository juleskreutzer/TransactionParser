import type { ICopybookItem } from "../interface/copybookItem.interface.js";
import type { IDataPosition } from "../interface/dataPosition.interface.ts";
import type { picture } from "../type/picture.type.js";
import type { usageType } from "../type/usage.type.ts";
import { Formatter } from "./formatter.js";

/**
 * @class
 * The DataItem class represents a single line in a COBOL copybook as an object.
 * 
 * Data of the line such as the used level, the name of the element, picture clause etc. are parsen into properties of the {@link DataItem}
 */
export class DataItem implements ICopybookItem{
    level: number;
    name: string;
    picture: picture;
    length: number;
    signed: boolean;
    usage: usageType = 'display';
    dataPosition: IDataPosition
    decimals?: number;
    occurs?: number | undefined;
    redefines?: ICopybookItem | undefined;
    children?: ICopybookItem[] | undefined;
    value?: string | undefined;

    constructor(level: number, name: string, picture: picture, length: number, signed: boolean = false, usage: usageType = 'display', dataPosition: IDataPosition, occurs?: number, redefines?: ICopybookItem, children?: ICopybookItem[], value?: any, decimals?: number) {
        if (level < 1) {
            throw new Error(`Level should at least be 1`);
        }

        if (name === '') {
            throw new Error(`Name cannot be an empty string`);
        }

        if (length < 1 && picture !== 'group') {
            throw new Error(`Length should at least be 1 when picture clause is set to 'group'`);
        }

        this.level = level;
        this.name = name;
        this.picture = picture;
        this.length = length;
        this.signed = signed;
        this.usage = usage;
        this.dataPosition = dataPosition;
        this.occurs = occurs;
        this.redefines = redefines;
        this.children = children;
        this.value = value;
        this.decimals = decimals || 0;
    }

    /**
     * @experimental
     * 
     * Set the value for this {@link DataItem} taking `picture` and `length` into account.
     * - For `string` pictures the value is converted to string, truncated or padded with spaces to `length`.
     * - For `number` and `packed` pictures the value is coerced to a Number and validated against `length` (total digits). Throws when value is not numeric or exceeds the defined length.
     * - For `group` pictures setting a value is not allowed (throws).
     * @param val The value to set
     */
    setValue(val: any): void {
        // Use implied decimals when validating numeric values
        // Allow clearing the value
        if (val === undefined || val === null) {
            this.value = undefined;
            return;
        }

        if (this.picture === 'group') {
            throw new Error(`Cannot set value on a group item '${this.name}'`);
        }

        if (this.picture === 'string') {
            let s = String(val);
            if (this.length && s.length > this.length) {
                s = s.substring(0, this.length);
            } else if (this.length && s.length < this.length) {
                s = s.padEnd(this.length, ' ');
            }
            this.value = s;
            return;
        }

        if (this.picture === 'number' || this.picture === 'packed') {
            const num = Number(val);
            if (Number.isNaN(num)) throw new Error(`Value for '${this.name}' is not a valid number`);

            // Count digits (ignoring sign and decimal point). For example, 12.3 -> digits=3
            // Respect implied decimals: the stored length represents total digits including decimals
            const multiplier = Math.pow(10, this.decimals || 0);
            const absInt = Math.round(Math.abs(num) * multiplier);
            const digits = String(absInt);
            const digitCount = digits.length === 0 ? 1 : digits.length;

            if (this.length && digitCount > this.length) {
                throw new Error(`Value for '${this.name}' exceeds defined length (${this.length})`);
            }

            this.value = String(num).padStart(this.length, '0');;
            return;
        }

        // Fallback - set as-is
        this.value = val;
    }

    toBuffer(): Buffer {
        throw new Error('Method not yet implemented');
    }

    /**
     * @experimental
     * 
     * Format the {@link DataItem} value as a COBOL-style fixed-width string using formatter helpers.
     * 
     * @returns string String representation of the value for the current instance
     */
    format(): string {
        // Groups do not render as a value
        if (this.picture === 'group') throw new Error(`Cannot format a group item '${this.name}'`);

        if (this.picture === 'string') {
            return Formatter.formatString(this.value ?? '', this.length);
        }

        if (this.picture === 'number') {
            return Formatter.formatNumeric(this.value ?? 0, this.length, { decimals: this.decimals || 0, signed: this.signed });
        }

        if (this.picture === 'packed') {
            return Formatter.formatPacked(this.value ?? 0, this.length, { decimals: this.decimals || 0, signed: this.signed });
        }

        return String(this.value ?? '');
    }
    
}