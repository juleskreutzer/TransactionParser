import type { picture } from "../type/picture.type.js";

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

    start: number | undefined;

    end: number | undefined;

    /** Indicator if the copybook item is signed */
    signed: boolean;

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

    setValue(value: any): void;
}