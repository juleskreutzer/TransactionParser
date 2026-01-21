import type { ICopybookItem } from "./copybookItem.interface.ts";

export interface ITransaction {
    from(data: string): void;

    fromFile(path: string): void;

    setCopybookPath(path: string): void;

    getLayout(): ICopybookItem[];

    getCopybookItem(name: string): ICopybookItem | undefined;

    getValue(name: string): string | undefined;

    setValue(name: string, value: string): void;

    toString(): string;
}