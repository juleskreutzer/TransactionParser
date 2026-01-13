import { Transaction } from "../transaction/index.ts";

import * as fs from 'fs'; 

export class CopybookParser {
    private copybookPath: string

    constructor(copybookPath: string) {
        if (copybookPath === '') {
            throw new Error(`Please provide a copybook path`);
        }

        this.copybookPath = copybookPath
    }

    parse(): Transaction {
        if (fs.existsSync(this.copybookPath)) {
            const data = fs.readFileSync(this.copybookPath).toString();
            if (data !== '') {
                throw Error('Not yet implemented!');
            } else {
                throw new Error(`Loaded transaction file is empty`);
            }
        } else {
            throw new Error(`Provided copybook path does not exist`);
        }
    }
}