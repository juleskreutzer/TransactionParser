import * as fs from 'fs';

/**
 * Helper function to check if path exits
 * @param path 
 * @throws Throws error when `path` does not exists or is empty
 */
export function checkPathExists(path: string): void {
    if (path === '') throw new Error(`Please provide a valid path`);
    if (!fs.existsSync(path)) throw new Error(`Provided path '${path}' does not exits`);
}

/**
 * Helper function to read data from the provided path
 * @param path 
 * @returns data from file
 * @throws Throws error when `path` does not exists or is empty
 */
export function readFile(path: string): string {
    checkPathExists(path);

    return fs.readFileSync(path).toString();
}