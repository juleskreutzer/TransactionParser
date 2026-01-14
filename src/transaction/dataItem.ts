import type { ICopybookItem } from '../interface/index.ts';
import type { picture } from '../type/index.ts';

/**
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
    occurs?: number | undefined;
    redefines?: ICopybookItem | undefined;
    children?: ICopybookItem[] | undefined;
    value?: any;

    constructor(level: number, name: string, picture: picture, length: number, signed: boolean = false, occurs?: number, redefines?: ICopybookItem, children?: ICopybookItem[], value?: any) {
        if (level < 1) {
            throw Error(`Level should at least be 1`);
        }

        if (name === '') {
            throw Error(`Name cannot be an empty string`);
        }

        if (length < 1 && picture !== 'group') {
            throw new Error(`Length should at least be 1 when picture clause is set to 'group'`);
        }

        this.level = level;
        this.name = name;
        this.picture = picture;
        this.length = length
        this.signed = signed
        this.occurs = occurs
        this.redefines = redefines;
        this.children = children;
        this.value = value;
    }
    
}