import type { ICopybookItem } from "../interface/copybookItem.interface.js";
import type { IDataPosition } from "../interface/dataPosition.interface.ts";
import type { picture } from "../type/picture.type.js";
import type { usageType } from "../type/usage.type.ts";
import { Formatter } from "./formatter.js";
import { cp037 } from "../lookupTable/cp037.js";

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

            // For COMP fields, store the numeric value as-is
            // For DISPLAY fields, pad with leading zeros
            if (this.usage === 'display') {
                this.value = String(num).padStart(this.length, '0');
            } else {
                this.value = String(num);
            }
            return;
        }

        // Fallback - set as-is
        this.value = val;
    }

    /**
     * Convert the current value to a buffer.
     * 
     * If the value is not set, an empty value will be returned according tot the picture and length
     *
     * @return {*}  {Buffer} Buffer representation of the current value
     * @memberof DataItem
     */
    toBuffer(): Buffer {
        const buffer: Buffer = Buffer.alloc(this.dataPosition.byteLength, undefined, 'binary');
        switch (this.picture) {
            case 'group':
                // Intentionally left blank since groups should be processed recursively
                break;
            case 'string':
                const chars = this.value ? this.value.split('') : new Array(this.dataPosition.byteLength).fill(' ');
                if (chars.length !== buffer.length) throw new Error(`Value length '${chars.length}' does not match defined buffer length '${buffer.length}' for item '${this.name}'`);

                chars.forEach((char, index) => {
                    const val = cp037.find(v => v.char === char)?.dec;
                    if (val === undefined) throw new Error(`Unable to lookup character '${char}' in CP037 table for item '${this.name}'`);
                    buffer[index] = val
                })
                break;
            case 'number':
                switch (this.usage) {
                    case 'display':
                        // DISPLAY numeric fields are EBCDIC-encoded digits
                        const displayChars = this.value ? this.value.split('') : new Array(this.dataPosition.byteLength).fill('0');
                        if (displayChars.length !== buffer.length) throw new Error(`Value length '${displayChars.length}' does not match defined buffer length '${buffer.length}' for item '${this.name}'`);
                        
                        displayChars.forEach((char, index) => {
                            const val = cp037.find(v => v.char === char)?.dec;
                            if (val === undefined) throw new Error(`Unable to lookup character '${char}' in CP037 table for item '${this.name}'`);
                            buffer[index] = val;
                        });
                        break;
                    case 'comp':
                    case 'comp-4':
                    case 'comp-5':
                        // COMP fields are binary integers (big-endian)
                        const numValue = this.value ? Number(this.value) : 0;
                        if (Number.isNaN(numValue)) throw new Error(`Value '${this.value}' is not a valid number for item '${this.name}'`);
                        
                        if (this.dataPosition.byteLength === 2) {
                            if (this.signed) {
                                buffer.writeInt16BE(numValue, 0);
                            } else {
                                buffer.writeUInt16BE(numValue, 0);
                            }
                        } else if (this.dataPosition.byteLength === 4) {
                            if (this.signed) {
                                buffer.writeInt32BE(numValue, 0);
                            } else {
                                buffer.writeUInt32BE(numValue, 0);
                            }
                        } else if (this.dataPosition.byteLength === 8) {
                            if (this.signed) {
                                buffer.writeBigInt64BE(BigInt(Math.round(numValue)), 0);
                            } else {
                                buffer.writeBigUInt64BE(BigInt(Math.round(numValue)), 0);
                            }
                        } else {
                            throw new Error(`Unsupported COMP field byte length (${this.dataPosition.byteLength}) for item '${this.name}'`);
                        }
                        break;
                    case 'comp-1':
                        // COMP-1 is single-precision floating point (4 bytes)
                        const floatValue = this.value ? Number(this.value) : 0;
                        if (Number.isNaN(floatValue)) throw new Error(`Value '${this.value}' is not a valid number for item '${this.name}'`);
                        buffer.writeFloatBE(floatValue, 0);
                        break;
                    case 'comp-2':
                        // COMP-2 is double-precision floating point (8 bytes)
                        const doubleValue = this.value ? Number(this.value) : 0;
                        if (Number.isNaN(doubleValue)) throw new Error(`Value '${this.value}' is not a valid number for item '${this.name}'`);
                        buffer.writeDoubleBE(doubleValue, 0);
                        break;
                    case 'comp-3':
                        // COMP-3 is packed decimal
                        const packedValue = this.value ? this.value : '0';
                        this.packDecimal(packedValue, buffer);
                        break;
                    default:
                        throw new Error(`Usage type '${this.usage}' is not supported in toBuffer() for item '${this.name}'`);
                }
                break;
            case "packed":
                // Packed decimal (same as COMP-3)
                const packedValue = this.value ? this.value : '0';
                this.packDecimal(packedValue, buffer);
                break;
            default:
                throw new Error(`Picture type '${this.picture}' is not yet implemented in toBuffer()`);
        }
        
        return buffer;
    }

    /**
     * Packs a decimal value into packed decimal (COMP-3) format
     * @param value String representation of the decimal value
     * @param buffer Buffer to write the packed data into
     */
    private packDecimal(value: string, buffer: Buffer): void {
        // Remove any sign from the value string and determine sign nibble
        let isNegative = false;
        let digits = value;
        
        if (digits.startsWith('-')) {
            isNegative = true;
            digits = digits.substring(1);
        } else if (digits.startsWith('+')) {
            digits = digits.substring(1);
        }
        
        // Remove decimal point if present (we assume decimals are handled by implied decimal positions)
        digits = digits.replace('.', '');
        
        // Pad with leading zeros to ensure we have the right number of digits
        const totalDigits = (buffer.length * 2) - 1; // One nibble is used for the sign
        digits = digits.padStart(totalDigits, '0');
        
        // Pack the digits
        let digitIndex = 0;
        for (let i = 0; i < buffer.length - 1; i++) {
            const highNibble = parseInt(digits[digitIndex++]!, 10);
            const lowNibble = parseInt(digits[digitIndex++]!, 10);
            buffer[i] = (highNibble << 4) | lowNibble;
        }
        
        // Pack the last byte (one digit and sign)
        const lastDigit = parseInt(digits[digitIndex]!, 10);
        const signNibble = isNegative ? 0x0D : 0x0C; // 0x0C = positive, 0x0D = negative
        buffer[buffer.length - 1] = (lastDigit << 4) | signNibble;
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