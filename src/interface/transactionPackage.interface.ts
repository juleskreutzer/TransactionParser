import type { ITransaction } from "./transaction.interface.ts";

export interface ITransactionPackage {
    transactions?: ITransaction[];

    load(data: Buffer): void;

    loadFile(path: string): void;

    createEmptyTransaction(): void;
}