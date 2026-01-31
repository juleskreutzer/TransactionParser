import type { picture } from "../type/picture.type.js";
import type { usageType } from "../type/usage.type.ts";
import type { IDataPosition } from "./dataPosition.interface.ts";

/**
 * @interface
 * ICopybookItem interface is a helper interface for representation of a line in a COBOL copybook.
 * 
 * This interface is implemented by {@link DataItem}
 */
export interface ICopybookItem {
    /** Level at which this ICopybookItem resides */
    level: number;

    /** Name of the copybook item */
    name: string;

    /** Picture clause of the copybook item */
    picture: picture;

    /** Total length of the copybook item */
    length: number;

    /** Indicator if the copybook item is signed */
    signed: boolean;

    /** Usage of the current copybook item, e.g `DISPLAY` or `COMP-3` */
    usage: usageType

    /** Object representing the offset of this copybook item in a transaction and the byteLength of this copybook item determined by the picture, length and usageType */
    dataPosition: IDataPosition;

    /** Amount of times this copybook item occurs, optional */
    occurs?: number | undefined;

    /** Reference to copybook item which the current copybook item redefines, optional */
    redefines?: ICopybookItem | undefined;

    /** List of copybook items containing all children under the current copybook item */
    children?: ICopybookItem[] | undefined;

    /** Value for the current copybook item. Currently not in use, optional */
    value?: string | undefined;

    /** Amount of decimals used, related to PIC clauses defining decimals. Currently not in use, optional */
    decimals?: number;

    /** 
     * Set the value of the copybook item
     * 
     * @param value 
     */
    setValue(value: any): void;

    /**
     * Get the value of the copybook item as buffer which can be written to a file
     * @returns buffer 
     */
    toBuffer(): Buffer;

}