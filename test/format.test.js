import assert from 'assert';
import { describe, it } from 'mocha';
import { Formatter } from '../dist/transaction/formatter.js';

describe('formatter helpers', () => {
  describe('formatString', () => {
    it('pads short strings and truncates long ones', () => {
      assert.strictEqual(Formatter.formatString('abc', 5), 'abc  ');
      assert.strictEqual(Formatter.formatString('abcdef', 3), 'abc');
      assert.strictEqual(Formatter.formatString('', 2), '  ');
    });
  });

  describe('formatNumeric', () => {
    it('formats integers with zero-padding', () => {
      assert.strictEqual(Formatter.formatNumeric(12, 5), '00012');
      assert.strictEqual(Formatter.formatNumeric('7', 3), '007');
    });

    it('applies implied decimals and removes decimal point', () => {
      // value 12.3 with 1 decimal -> digits = 123
      assert.strictEqual(Formatter.formatNumeric(12.3, 3, { decimals: 1 }), '123');
      // negative signed value includes leading '-'
      assert.strictEqual(Formatter.formatNumeric(-12.3, 4, { decimals: 1, signed: true }), '-0123');
      // signed positive does not include '+' prefix
      assert.strictEqual(Formatter.formatNumeric(12.3, 4, { decimals: 1, signed: true }), '0123');
    });

    it('rounds values based on implied decimals', () => {
      // 12.345 with 2 decimals -> Math.round(12.345*100)=1235
      assert.strictEqual(Formatter.formatNumeric(12.345, 4, { decimals: 2 }), '1235');
    });

    it('throws for non-numeric inputs or invalid lengths', () => {
      assert.throws(() => Formatter.formatNumeric('abc', 3), /cannot be parsed to number/i);
      assert.throws(() => Formatter.formatNumeric(1, 0), /Length must be positive/);
    });

    it('throws when the numeric representation exceeds the length', () => {
      assert.throws(() => Formatter.formatNumeric(12345, 4), /exceeds defined length/);
      assert.throws(() => Formatter.formatNumeric('123.45', 4, { decimals: 2 }), /exceeds defined length/);
    });
  });

  describe('formatPacked', () => {
    it('delegates to formatNumeric', () => {
      assert.strictEqual(Formatter.formatPacked(12, 3), '012');
    });
  });
});