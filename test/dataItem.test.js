import assert from 'assert';
import { describe, it } from 'mocha';
import { DataItem } from '../dist/index.js';

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
    const n = new DataItem(5, 'N1', 'number', 4, true);
    n.setValue(1234);
    assert.strictEqual(n.value, 1234);

    assert.throws(() => n.setValue(12345), /exceeds defined length/);

    const n2 = new DataItem(5, 'N2', 'number', 4, false, undefined, undefined, undefined, undefined, 2); // length 4, decimals=2 -> max integer part 2 digits
    n2.setValue(12.34);
    assert.strictEqual(n2.value, 12.34);
    assert.throws(() => n2.setValue(123.45), /exceeds defined length/);
  });

  it('validates packed values similarly to numbers', () => {
    const p = new DataItem(5, 'P1', 'packed', 4, true);
    p.setValue(9876);
    assert.strictEqual(p.value, 9876);
    assert.throws(() => p.setValue('12345'), /exceeds defined length/);
  });

  it('throws when setting a value on a group', () => {
    const g = new DataItem(1, 'GR', 'group', 0, false);
    assert.throws(() => g.setValue('x'), /Cannot set value on a group/);
  });
});