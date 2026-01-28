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

/**
 * Read a file into buffer instead of string
 * 
 * @remarks
 * If the file contains multiple lines, it will be returned as **one** buffer.
 * 
 * Hex `15` / Decimal `21` (new line) will not be taken into account. Use {@link splitBufferOnNewLine} for this
 * 
 * @param path Path to the file
 * @returns Content of file as buffer array
 */
export function readFileAsBuffer(path: string): Buffer {
    const data: Buffer = fs.readFileSync(path);
    return data;
}

/**
 * Splits buffer on new line control character (hex 15/dec 21)
 * 
 * @remarks
 * This function will split the buffer on every occurance of the new line character
 * If `x'15'` is present in the data, buffer will be incorrectly split
 * 
 * @param buffer 
 * @returns buffer on new line 
 */
export function splitBufferOnNewLine(buffer: Buffer): Buffer[] {
    const offset = buffer.findIndex(v => v.valueOf() === 21);

    if (offset === -1) return [buffer] // No new line control character found

    let result: Buffer[] = []
    let offsetNext: number = offset;
    let bufferToProcess: Buffer = buffer

    while(offsetNext !== -1) {
        result.push(bufferToProcess.subarray(0, offsetNext - 1));
        bufferToProcess = bufferToProcess.subarray(offsetNext + 1);

        offsetNext = bufferToProcess.findIndex(v => v.valueOf() === 21);
    }

    // Add the last piece of the buffer
    if (bufferToProcess.length > 0) {
        result.push(bufferToProcess);
    }

    return result;
}

/**
 * Split a buffer based on the length of the data in bytes
 * 
 * By default, this function will check for new line or carriage return control characters
 * and omit these values from the result. Set `disableControlCharacterCheck` to `true` if you want to include 
 * this in the result
 * @param buffer The buffer to split
 * @param dataBytesLength Length of the data in bytes
 * @param [disableControlCharacterCheck] If set to `true`, new line and carriage return values will be included in output
 * @returns buffer Array of buffer items
 */
export function splitBuffer(buffer: Buffer, dataBytesLength: number, disableControlCharacterCheck: boolean = false): Buffer[] {
    if (buffer.length <= dataBytesLength) return [buffer];

    let result: Buffer[] = [];
    let bufferToProcess: Buffer = buffer;

    while(bufferToProcess.length >= dataBytesLength) {
        result.push(bufferToProcess.subarray(0, dataBytesLength + 1));

        // Check for for control characters
        if (bufferToProcess.at(dataBytesLength + 1) === 21 || bufferToProcess.at(dataBytesLength + 1) === 13) {
            if (!disableControlCharacterCheck) {
                // Either new line or carriage return control character found
                if (bufferToProcess.at(dataBytesLength + 2) === 21 || bufferToProcess.at(dataBytesLength + 2) === 13) {
                    // Second new line or carriage return control character found
                    bufferToProcess = bufferToProcess.subarray(dataBytesLength + 3);
                } else {
                    bufferToProcess = bufferToProcess.subarray(dataBytesLength + 2);
                } 
            } else {
                bufferToProcess = bufferToProcess.subarray(dataBytesLength + 1);
            }
        } else {
            bufferToProcess = bufferToProcess.subarray(dataBytesLength + 1);
        }
    }

    if (bufferToProcess.length > 0) {
        result.push(bufferToProcess);
    }

    return result;
}