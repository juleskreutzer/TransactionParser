import assert from 'assert';
import { describe, it } from 'mocha';
import { DataItem } from '../dist/transaction/dataItem.js';

describe('DataItem.format integration with decimals', () => {
  it('formats numeric values respecting implied decimals and length', () => {
    const ai = new DataItem(5, 'AI', 'number', 9, true, undefined, undefined, undefined, 0, 2);
    ai.setValue(123.45);
    // decimals=2 => absInt = 12345, pad to length 9 -> '000012345'
    assert.strictEqual(ai.format(), '000012345');

    const neg = new DataItem(5, 'NEG', 'number', 9, true, undefined, undefined, undefined, 0, 2);
    neg.setValue(-12.34);
    assert.strictEqual(neg.format(), '-000001234');
  });

  it('formats strings correctly via format()', () => {
    const s = new DataItem(5, 'S', 'string', 4, false);
    s.setValue('xy');
    assert.strictEqual(s.format(), 'xy  ');
  });
});