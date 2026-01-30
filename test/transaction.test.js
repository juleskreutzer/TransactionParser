import assert from 'assert';
import { describe, it } from 'mocha';
import { Transaction } from '../dist/transaction/transaction.js';
import { DataItem } from '../dist/transaction/dataItem.js';
import { CopybookParser } from '../dist/parser/copybookParser.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Transaction buffer processing', () => {
  describe('COMP field reading', () => {
    it('reads 4-byte signed COMP field from buffer', () => {
      // Create a simple copybook structure
      const copybookPath = path.join(__dirname, 'assets', 'example_copybook.txt');
      
      // Manually create a data item for testing
      const compItem = new DataItem(
        5, 
        'TEST-COMP', 
        'number', 
        8, 
        true, 
        'comp', 
        { offset: 0, byteLength: 4 }
      );
      
      // Create buffer with value from user's example: 01 53 37 27
      const buffer = Buffer.from([0x01, 0x53, 0x37, 0x27]);
      
      // Process it
      const transaction = new Transaction(copybookPath, [compItem], buffer);
      const item = transaction.getCopybookItem('TEST-COMP');
      
      assert.strictEqual(item.value, '22230823'); // The actual value of those bytes
    });

    it('reads 2-byte signed COMP field from buffer', () => {
      const compItem = new DataItem(
        5, 
        'SHORT-COMP', 
        'number', 
        4, 
        true, 
        'comp', 
        { offset: 0, byteLength: 2 }
      );
      
      // Create buffer with value 1000
      const buffer = Buffer.alloc(2);
      buffer.writeInt16BE(1000, 0);
      
      const copybookPath = path.join(__dirname, 'assets', 'example_copybook.txt');
      const transaction = new Transaction(copybookPath, [compItem], buffer);
      const item = transaction.getCopybookItem('SHORT-COMP');
      
      assert.strictEqual(item.value, '1000');
    });

    it('reads negative COMP values', () => {
      const compItem = new DataItem(
        5, 
        'NEG-COMP', 
        'number', 
        8, 
        true, 
        'comp', 
        { offset: 0, byteLength: 4 }
      );
      
      // Create buffer with value -12345
      const buffer = Buffer.alloc(4);
      buffer.writeInt32BE(-12345, 0);
      
      const copybookPath = path.join(__dirname, 'assets', 'example_copybook.txt');
      const transaction = new Transaction(copybookPath, [compItem], buffer);
      const item = transaction.getCopybookItem('NEG-COMP');
      
      assert.strictEqual(item.value, '-12345');
    });

    it('reads COMP-1 (float) field from buffer', () => {
      const compItem = new DataItem(
        5, 
        'FLOAT-COMP', 
        'number', 
        1, 
        false, 
        'comp-1', 
        { offset: 0, byteLength: 4 }
      );
      
      // Create buffer with float value
      const buffer = Buffer.alloc(4);
      buffer.writeFloatBE(3.14159, 0);
      
      const copybookPath = path.join(__dirname, 'assets', 'example_copybook.txt');
      const transaction = new Transaction(copybookPath, [compItem], buffer);
      const item = transaction.getCopybookItem('FLOAT-COMP');
      
      const value = parseFloat(item.value);
      assert.ok(Math.abs(value - 3.14159) < 0.0001);
    });

    it('reads COMP-2 (double) field from buffer', () => {
      const compItem = new DataItem(
        5, 
        'DOUBLE-COMP', 
        'number', 
        1, 
        false, 
        'comp-2', 
        { offset: 0, byteLength: 8 }
      );
      
      // Create buffer with double value
      const buffer = Buffer.alloc(8);
      buffer.writeDoubleBE(3.141592653589793, 0);
      
      const copybookPath = path.join(__dirname, 'assets', 'example_copybook.txt');
      const transaction = new Transaction(copybookPath, [compItem], buffer);
      const item = transaction.getCopybookItem('DOUBLE-COMP');
      
      assert.strictEqual(item.value, '3.141592653589793');
    });
  });

  describe('COMP-3 (packed decimal) field reading', () => {
    it('reads positive packed decimal values', () => {
      const packedItem = new DataItem(
        5, 
        'PACKED-FIELD', 
        'number', 
        5, 
        true, 
        'comp-3', 
        { offset: 0, byteLength: 3 }
      );
      
      // Create packed decimal buffer for 12345 (positive)
      // 01 23 4C (last nibble C = positive)
      const buffer = Buffer.from([0x12, 0x34, 0x5C]);
      
      const copybookPath = path.join(__dirname, 'assets', 'example_copybook.txt');
      const transaction = new Transaction(copybookPath, [packedItem], buffer);
      const item = transaction.getCopybookItem('PACKED-FIELD');
      
      assert.strictEqual(item.value, '12345');
    });

    it('reads negative packed decimal values', () => {
      const packedItem = new DataItem(
        5, 
        'PACKED-NEG', 
        'number', 
        5, 
        true, 
        'comp-3', 
        { offset: 0, byteLength: 3 }
      );
      
      // Create packed decimal buffer for -12345 (negative)
      // 01 23 4D (last nibble D = negative)
      const buffer = Buffer.from([0x12, 0x34, 0x5D]);
      
      const copybookPath = path.join(__dirname, 'assets', 'example_copybook.txt');
      const transaction = new Transaction(copybookPath, [packedItem], buffer);
      const item = transaction.getCopybookItem('PACKED-NEG');
      
      assert.strictEqual(item.value, '-12345');
    });

    it('reads packed decimal with leading zeros', () => {
      const packedItem = new DataItem(
        5, 
        'PACKED-SMALL', 
        'number', 
        5, 
        true, 
        'comp-3', 
        { offset: 0, byteLength: 3 }
      );
      
      // Create packed decimal buffer for 123 (with leading zeros)
      // 00 01 2C
      const buffer = Buffer.from([0x00, 0x12, 0x3C]);
      
      const copybookPath = path.join(__dirname, 'assets', 'example_copybook.txt');
      const transaction = new Transaction(copybookPath, [packedItem], buffer);
      const item = transaction.getCopybookItem('PACKED-SMALL');
      
      assert.strictEqual(item.value, '123');
    });
  });

  describe('DISPLAY numeric field reading', () => {
    it('reads EBCDIC-encoded numeric values', () => {
      const displayItem = new DataItem(
        5, 
        'DISPLAY-NUM', 
        'number', 
        4, 
        false, 
        'display', 
        { offset: 0, byteLength: 4 }
      );
      
      // Create EBCDIC buffer for '1234'
      // '1' = 0xF1, '2' = 0xF2, '3' = 0xF3, '4' = 0xF4
      const buffer = Buffer.from([0xF1, 0xF2, 0xF3, 0xF4]);
      
      const copybookPath = path.join(__dirname, 'assets', 'example_copybook.txt');
      const transaction = new Transaction(copybookPath, [displayItem], buffer);
      const item = transaction.getCopybookItem('DISPLAY-NUM');
      
      assert.strictEqual(item.value, '1234');
    });
  });

  describe('Round-trip conversion', () => {
    it('converts COMP value to buffer and back', () => {
      const compItem = new DataItem(
        5, 
        'ROUNDTRIP', 
        'number', 
        8, 
        true, 
        'comp', 
        { offset: 0, byteLength: 4 }
      );
      
      const testValue = 99887766;
      compItem.setValue(testValue);
      
      // Convert to buffer
      const buffer = compItem.toBuffer();
      
      // Read back from buffer
      const copybookPath = path.join(__dirname, 'assets', 'example_copybook.txt');
      const transaction = new Transaction(copybookPath, [compItem], buffer);
      const item = transaction.getCopybookItem('ROUNDTRIP');
      
      assert.strictEqual(item.value, testValue.toString());
    });

    it('converts COMP-3 value to buffer and back', () => {
      const packedItem = new DataItem(
        5, 
        'PACKED-RT', 
        'number', 
        7, 
        true, 
        'comp-3', 
        { offset: 0, byteLength: 4 }
      );
      
      const testValue = 1234567;
      packedItem.setValue(testValue);
      
      // Convert to buffer
      const buffer = packedItem.toBuffer();
      
      // Read back from buffer
      const copybookPath = path.join(__dirname, 'assets', 'example_copybook.txt');
      const transaction = new Transaction(copybookPath, [packedItem], buffer);
      const item = transaction.getCopybookItem('PACKED-RT');
      
      assert.strictEqual(item.value, testValue.toString().padStart(7, '0'));
    });
  });
});
