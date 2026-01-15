import type { picture } from '../index.ts';

/**
 * @interface
 * ICopybookItem interface is a helped interface for representation of a line in a COBOL copybook.
 * 
 * This interface is implemented by {@link DataItem}
 */
export interface ICopybookItem {
    level: number;

    name: string;

    picture: picture;

    length: number;

    signed: boolean;

    occurs?: number | undefined;

    redefines?: ICopybookItem | undefined;

    children?: ICopybookItem[] | undefined;

    value?: any
}