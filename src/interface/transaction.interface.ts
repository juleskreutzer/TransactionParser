import type { ICopybookItem } from "./copybookItem.interface.ts";

export interface ITransaction {
    getCopybookItems(): ICopybookItem[];

    getCopybookItem(name: string): ICopybookItem | undefined;

    getValue(name: string): string | undefined;

    setValue(name: string, value: string): void;

    toString(): string;
}