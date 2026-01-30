import assert from 'assert';
import path from 'path';
import { describe, it } from 'mocha';
import { CopybookParser } from '../dist/parser/copybookParser.js';

const assetsDir = path.join(process.cwd(), 'test', 'assets');

function captureDataItems(assetFile) {
  const p = new CopybookParser(path.join(assetsDir, assetFile));
  return p.parse();
}

function findItemByName(name, items) {
  for (const item of items) {
    if (item && item.name === name) return item;
    if (item && item.children) {
      const f = findItemByName(name, item.children);
      if (f) return f;
    }
  }
  return undefined;
}

describe('CopybookParser', () => {
  describe('generic copybook', () => {
    const generic = captureDataItems('generic_copybook.txt');

    it('parses root and nested structure', () => {
      assert(Array.isArray(generic), 'generic result should be an array');
      assert(generic.length >= 1, 'should have at least one root element');
      const wsArea = findItemByName('WS-AREA', generic);
      assert(wsArea, 'WS-AREA should be present');
      assert.strictEqual(wsArea.level, 1, 'WS-AREA should be level 1');
      const areaXW1 = findItemByName('AREA-XW1', generic);
      assert(areaXW1, 'AREA-XW1 should be present');
      assert.strictEqual(areaXW1.level, 3, 'AREA-XW1 should be level 3');
    });

    it('captures values and PICs correctly', () => {
      const mdunam = findItemByName('MDUNAM-XW1', generic);
      assert(mdunam, 'MDUNAM-XW1 should be present');
      assert.strictEqual(mdunam.picture, 'group', 'MDUNAM-XW1 should be a group (no PIC)');
      assert.strictEqual(mdunam.value, undefined, 'MDUNAM-XW1 value should not be set (group items do not store values)');

      const filler = findItemByName('FILLER', generic);
      assert(filler, 'FILLER should be present');
      assert.strictEqual(filler.picture, 'string', 'FILLER should be a string');
      assert.strictEqual(filler.length, 2, 'FILLER should be length 2');

      const cri = findItemByName('CRI-BW5', generic);
      assert(cri, 'CRI-BW5 should be present');
      assert.strictEqual(cri.picture, 'number', 'CRI-BW5 should be a number');
      assert.strictEqual(cri.signed, true, 'CRI-BW5 should be signed');
      assert.strictEqual(cri.value, '0', 'CRI-BW5 should have value "0" (COMP field stores raw numeric)');
      assert.strictEqual(cri.length, 2, 'CRI-BW5 should have length 2');
    });
  });

  describe('occurs copybook', () => {
    const occurs = captureDataItems('occurs_copybook.txt');

    it('parses OCCURS and nested children', () => {
      const customer = findItemByName('CUSTOMER-RECORD', occurs);
      assert(customer, 'CUSTOMER-RECORD should be present');
      assert.strictEqual(customer.level, 1, 'CUSTOMER-RECORD should be level 1');

      // After expansion, PHONE-NUMBERS is expanded to PHONE-NUMBERS-1, -2, -3
      const phoneNumbers0 = findItemByName('PHONE-NUMBERS-1', occurs);
      const phoneNumbers1 = findItemByName('PHONE-NUMBERS-2', occurs);
      const phoneNumbers2 = findItemByName('PHONE-NUMBERS-3', occurs);
      assert(phoneNumbers0, 'PHONE-NUMBERS-1 should be present');
      assert(phoneNumbers1, 'PHONE-NUMBERS-2 should be present');
      assert(phoneNumbers2, 'PHONE-NUMBERS-3 should be present');

      // Check one of them
      assert(Array.isArray(phoneNumbers0.children), 'PHONE-NUMBERS-1 should have children');
      assert(phoneNumbers0.children.length >= 1, 'PHONE-NUMBERS-1 should contain at least one child');
      const phoneNumber = phoneNumbers0.children[0];
      assert.strictEqual(phoneNumber.name, 'PHONE-NUMBER', 'child should be PHONE-NUMBER-1');
      assert.strictEqual(phoneNumber.picture, 'number', 'PHONE-NUMBER-1 picture should be number');
      assert.strictEqual(phoneNumber.length, 10, 'PHONE-NUMBER-1 length should be 10');

      const acct = findItemByName('ACCOUNT-BALANCE', occurs);
      assert(acct, 'ACCOUNT-BALANCE should be present');
      assert.strictEqual(acct.picture, 'packed', 'ACCOUNT-BALANCE should be packed');
      assert.strictEqual(acct.signed, true, 'ACCOUNT-BALANCE should be signed');
      assert.strictEqual(acct.length, 9, 'ACCOUNT-BALANCE length should be 9 (7+2 decimal digits)');
      assert.strictEqual(acct.decimals, 2, 'ACCOUNT-BALANCE should have 2 implied decimals');
      const creditLimit = findItemByName('CREDIT-LIMIT', occurs);
      assert(creditLimit, 'CREDIT-LIMIT should be present');
      assert.strictEqual(creditLimit.picture, 'packed', 'CREDIT-LIMIT should be packed');
      assert.strictEqual(creditLimit.signed, true, 'CREDIT-LIMIT should be signed');
      assert.strictEqual(creditLimit.length, 7, 'CREDIT-LIMIT length should be 7 (5+2 decimal digits)');
      assert.strictEqual(creditLimit.decimals, 2, 'CREDIT-LIMIT should have 2 implied decimals');
    });
  });

  describe('packed copybook', () => {
    it('detects packed PIC and lengths', () => {
      const packed = captureDataItems('packed_copybook.txt');
      const custId = findItemByName('CUSTOMER-ID', packed);
      assert(custId, 'CUSTOMER-ID should be present');
      assert.strictEqual(custId.picture, 'packed', 'CUSTOMER-ID should be picture=packed');
      assert.strictEqual(custId.length, 6, 'CUSTOMER-ID should be length 6');
    });
  });

  describe('redefines copybook', () => {
    it('resolves redefines and captures raw string lengths', () => {
      const red = captureDataItems('redefines_copybook.txt');
      const alt = findItemByName('CUSTOMER-RECORD-ALT', red);
      assert(alt, 'CUSTOMER-RECORD-ALT should be present');
      assert(alt.redefines, 'CUSTOMER-RECORD-ALT should have redefines set');
      assert.strictEqual(alt.redefines.name, 'CUSTOMER-RECORD', "REDEFINES target should be 'CUSTOMER-RECORD'");
      const raw = findItemByName('RAW-DATA', red);
      assert(raw, 'RAW-DATA should be present');
      assert.strictEqual(raw.picture, 'string', 'RAW-DATA should be a string');
      assert.strictEqual(raw.length, 100, 'RAW-DATA length should be 100');
    });
  });

  describe('negative / malformed inputs', () => {
    it('skips lines that do not match header format and still parses other lines', () => {
      const m = captureDataItems('malformed_skip.txt');
      const valid = findItemByName('VALID-ITEM', m);
      assert(valid, 'VALID-ITEM should be present even with malformed lines present');
      const child = findItemByName('CHILD', m);
      assert(child, 'CHILD should be present and nested under VALID-ITEM');
      // Ensure the parser did not create extraneous items from the bad line
      const bad = findItemByName('BAD', m);
      assert.strictEqual(bad, undefined, 'BAD should not be parsed as an item');
    });

    it('throws when a data item has an invalid (zero) level', () => {
      const p = new CopybookParser(path.join(assetsDir, 'zero_level.txt'));
      assert.throws(() => p.parse(), /Level should at least be 1/);
    });

    it('returns a placeholder redefines object when the target is missing', () => {
      const r = captureDataItems('redefines_missing.txt');
      const b = findItemByName('B', r);
      assert(b, 'B should be present');
      assert(b.redefines, 'B should have a redefines placeholder');
      assert.strictEqual(b.redefines.name, 'MISSING', 'REDEFINES placeholder should use the provided name');
      assert.strictEqual(b.redefines.level, 0, 'Placeholder redefines should have level 0');
      assert.strictEqual(b.redefines.picture, 'group', 'Placeholder redefines should be group');
    });

    it('throws when the copybook file is empty', () => {
      const p = new CopybookParser(path.join(assetsDir, 'empty_copybook.txt'));
      assert.throws(() => p.parse(), /Loaded copybook file is empty/);
    });
  });
});
