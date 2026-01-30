import assert from 'assert';
import { describe, it } from 'mocha';
import { DataItem } from '../dist/transaction/dataItem.js';

describe('DataItem.setValue', () => {
  it('pads and truncates strings to defined length', () => {
    const s = new DataItem(5, 'STR', 'string', 5, false);
    s.setValue('abc');
    assert.strictEqual(s.value, 'abc  ');

    const s2 = new DataItem(5, 'STR2', 'string', 3, false);
    s2.setValue('abcdef');
    assert.strictEqual(s2.value, 'abc');
  });

  it('accepts and validates numbers against length and implied decimals', () => {
    const n = new DataItem(5, 'N1', 'number', 4, true, 'display', { offset: 0, byteLength: 4 });
    n.setValue(1234);
    assert.strictEqual(n.value, '1234');

    assert.throws(() => n.setValue(12345), /exceeds defined length/);

    const n2 = new DataItem(5, 'N2', 'number', 4, false, 'display', { offset: 0, byteLength: 4 }, undefined, undefined, undefined, undefined, 2); // length 4, decimals=2
    n2.setValue(12.34);
    // setValue stores String(num) padded to length: '12.34' -> '12.34' (length 4, but decimal point counts)
    assert.strictEqual(n2.value, '12.34');
    assert.throws(() => n2.setValue(123.45), /exceeds defined length/);
  });

  it('validates packed values similarly to numbers', () => {
    const p = new DataItem(5, 'P1', 'packed', 4, true, 'comp-3', { offset: 0, byteLength: 4 });
    p.setValue(9876);
    assert.strictEqual(p.value, '9876');
    assert.throws(() => p.setValue('12345'), /exceeds defined length/);
  });

  it('throws when setting a value on a group', () => {
    const g = new DataItem(1, 'GR', 'group', 0, false, 'display', { offset: 0, byteLength: 0 });
    assert.throws(() => g.setValue('x'), /Cannot set value on a group/);
  });
});

describe('DataItem.toBuffer', () => {
  describe('string fields', () => {
    it('converts string values to EBCDIC buffer', () => {
      const item = new DataItem(5, 'NAME', 'string', 5, false, 'display', { offset: 0, byteLength: 5 });
      item.setValue('HELLO');
      const buffer = item.toBuffer();
      
      assert.strictEqual(buffer.length, 5);
      // 'H' = 0xC8, 'E' = 0xC5, 'L' = 0xD3, 'O' = 0xD6 in CP037
      assert.strictEqual(buffer[0], 0xC8);
      assert.strictEqual(buffer[1], 0xC5);
    });

    it('handles empty string values by padding with spaces', () => {
      const item = new DataItem(5, 'NAME', 'string', 3, false, 'display', { offset: 0, byteLength: 3 });
      const buffer = item.toBuffer();
      
      assert.strictEqual(buffer.length, 3);
      // Space = 0x40 in CP037
      assert.strictEqual(buffer[0], 0x40);
      assert.strictEqual(buffer[1], 0x40);
      assert.strictEqual(buffer[2], 0x40);
    });
  });

  describe('DISPLAY numeric fields', () => {
    it('converts numeric DISPLAY values to EBCDIC digits', () => {
      const item = new DataItem(5, 'NUM', 'number', 4, false, 'display', { offset: 0, byteLength: 4 });
      item.setValue(1234);
      const buffer = item.toBuffer();
      
      assert.strictEqual(buffer.length, 4);
      // '1' = 0xF1, '2' = 0xF2, '3' = 0xF3, '4' = 0xF4 in CP037
      assert.strictEqual(buffer[0], 0xF1);
      assert.strictEqual(buffer[1], 0xF2);
      assert.strictEqual(buffer[2], 0xF3);
      assert.strictEqual(buffer[3], 0xF4);
    });
  });

  describe('COMP/COMP-4/COMP-5 fields', () => {
    it('converts 2-byte signed COMP fields', () => {
      const item = new DataItem(5, 'SHORTNUM', 'number', 4, true, 'comp', { offset: 0, byteLength: 2 });
      item.setValue(1000);
      const buffer = item.toBuffer();
      
      assert.strictEqual(buffer.length, 2);
      assert.strictEqual(buffer.readInt16BE(0), 1000);
    });

    it('converts 2-byte unsigned COMP fields', () => {
      const item = new DataItem(5, 'SHORTNUM', 'number', 5, false, 'comp', { offset: 0, byteLength: 2 });
      item.setValue(50000);
      const buffer = item.toBuffer();
      
      assert.strictEqual(buffer.length, 2);
      assert.strictEqual(buffer.readUInt16BE(0), 50000);
    });

    it('converts 4-byte signed COMP fields', () => {
      const item = new DataItem(5, 'INTNUM', 'number', 8, true, 'comp-4', { offset: 0, byteLength: 4 });
      item.setValue(22230823);
      const buffer = item.toBuffer();
      
      assert.strictEqual(buffer.length, 4);
      assert.strictEqual(buffer.readInt32BE(0), 22230823);
      // Verify bytes: 22230823 from user's example
      assert.strictEqual(buffer[0], 0x01);
      assert.strictEqual(buffer[1], 0x53);
      assert.strictEqual(buffer[2], 0x37);
      assert.strictEqual(buffer[3], 0x27);
    });

    it('converts 4-byte unsigned COMP fields', () => {
      const item = new DataItem(5, 'INTNUM', 'number', 9, false, 'comp-5', { offset: 0, byteLength: 4 });
      item.setValue(123456789);
      const buffer = item.toBuffer();
      
      assert.strictEqual(buffer.length, 4);
      assert.strictEqual(buffer.readUInt32BE(0), 123456789);
    });

    it('converts 8-byte signed COMP fields', () => {
      const item = new DataItem(5, 'BIGNUM', 'number', 18, true, 'comp', { offset: 0, byteLength: 8 });
      item.setValue(9876543210);
      const buffer = item.toBuffer();
      
      assert.strictEqual(buffer.length, 8);
      assert.strictEqual(buffer.readBigInt64BE(0), BigInt(9876543210));
    });

    it('converts negative COMP values', () => {
      const item = new DataItem(5, 'NEGNUM', 'number', 8, true, 'comp', { offset: 0, byteLength: 4 });
      item.setValue(-12345);
      const buffer = item.toBuffer();
      
      assert.strictEqual(buffer.readInt32BE(0), -12345);
    });

    it('round-trips COMP values (write and read)', () => {
      const item = new DataItem(5, 'TEST', 'number', 10, true, 'comp', { offset: 0, byteLength: 4 });
      const testValues = [0, 1, -1, 12345, -67890, 2147483647, -2147483648];
      
      testValues.forEach(val => {
        item.setValue(val);
        const buffer = item.toBuffer();
        const readBack = buffer.readInt32BE(0);
        assert.strictEqual(readBack, val, `Failed round-trip for value ${val}`);
      });
    });
  });

  describe('COMP-1 fields', () => {
    it('converts single-precision floating point values', () => {
      const item = new DataItem(5, 'FLOAT', 'number', 1, false, 'comp-1', { offset: 0, byteLength: 4 });
      item.setValue(3.14159);
      const buffer = item.toBuffer();
      
      assert.strictEqual(buffer.length, 4);
      const readBack = buffer.readFloatBE(0);
      assert.ok(Math.abs(readBack - 3.14159) < 0.0001);
    });
  });

  describe('COMP-2 fields', () => {
    it('converts double-precision floating point values', () => {
      const item = new DataItem(5, 'DOUBLE', 'number', 1, false, 'comp-2', { offset: 0, byteLength: 8 });
      item.setValue(3.141592653589793);
      const buffer = item.toBuffer();
      
      assert.strictEqual(buffer.length, 8);
      const readBack = buffer.readDoubleBE(0);
      assert.strictEqual(readBack, 3.141592653589793);
    });
  });

  describe('COMP-3 (packed decimal) fields', () => {
    it('packs positive decimal values', () => {
      const item = new DataItem(5, 'PACKED', 'number', 5, true, 'comp-3', { offset: 0, byteLength: 3 });
      item.setValue(12345);
      const buffer = item.toBuffer();
      
      assert.strictEqual(buffer.length, 3);
      // Packed: 01 23 45 with sign 0x0C => 0x01, 0x23, 0x4C
      assert.strictEqual(buffer[0], 0x12);
      assert.strictEqual(buffer[1], 0x34);
      assert.strictEqual(buffer[2], 0x5C);
    });

    it('packs negative decimal values', () => {
      const item = new DataItem(5, 'PACKED', 'number', 5, true, 'comp-3', { offset: 0, byteLength: 3 });
      item.setValue(-12345);
      const buffer = item.toBuffer();
      
      assert.strictEqual(buffer.length, 3);
      // Packed: 01 23 45 with sign 0x0D => 0x01, 0x23, 0x4D
      assert.strictEqual(buffer[0], 0x12);
      assert.strictEqual(buffer[1], 0x34);
      assert.strictEqual(buffer[2], 0x5D);
    });

    it('pads with leading zeros', () => {
      const item = new DataItem(5, 'PACKED', 'number', 5, true, 'comp-3', { offset: 0, byteLength: 3 });
      item.setValue(123);
      const buffer = item.toBuffer();
      
      assert.strictEqual(buffer.length, 3);
      // Packed: 00 01 23 with sign 0x0C => 0x00, 0x01, 0x2C
      assert.strictEqual(buffer[0], 0x00);
      assert.strictEqual(buffer[1], 0x12);
      assert.strictEqual(buffer[2], 0x3C);
    });

    it('handles zero value', () => {
      const item = new DataItem(5, 'PACKED', 'number', 3, true, 'comp-3', { offset: 0, byteLength: 2 });
      item.setValue(0);
      const buffer = item.toBuffer();
      
      assert.strictEqual(buffer.length, 2);
      // Packed: 00 0 with sign 0x0C => 0x00, 0x0C
      assert.strictEqual(buffer[0], 0x00);
      assert.strictEqual(buffer[1], 0x0C);
    });
  });

  describe('packed picture type', () => {
    it('packs values for packed picture fields', () => {
      const item = new DataItem(5, 'PACKED', 'packed', 7, true, 'comp-3', { offset: 0, byteLength: 4 });
      item.setValue(1234567);
      const buffer = item.toBuffer();
      
      assert.strictEqual(buffer.length, 4);
      // Packed: 01 23 45 67 with sign 0x0C => 0x12, 0x34, 0x56, 0x7C
      assert.strictEqual(buffer[0], 0x12);
      assert.strictEqual(buffer[1], 0x34);
      assert.strictEqual(buffer[2], 0x56);
      assert.strictEqual(buffer[3], 0x7C);
    });
  });
});