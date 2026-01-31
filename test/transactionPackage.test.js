import assert from 'assert';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { describe, it } from 'mocha';
import { TransactionPackage } from '../dist/transaction/transactionPackage.js';

const assetsDir = path.join(process.cwd(), 'test', 'assets');
const copybookPath = path.join(assetsDir, 'example_copybook.txt');

function findItemByName(name, items) {
  for (const item of items) {
    if (!item) continue;
    if (item.name === name) return item;
    if (item.children && item.children.length > 0) {
      const found = findItemByName(name, item.children);
      if (found) return found;
    }
  }
  return undefined;
}

function setFirstName(transaction, value) {
  const item = findItemByName('FIRST-NAME', transaction.getCopybookItems());
  assert(item, 'FIRST-NAME should be present');
  item.setValue(value);
  return item;
}

describe('TransactionPackage', () => {
  it('throws when copybook path is empty', () => {
    assert.throws(() => new TransactionPackage(''), /Please provide a copybook path/);
  });

  it('starts empty and returns undefined for first/last transaction', () => {
    const pkg = new TransactionPackage(copybookPath);
    assert.strictEqual(pkg.transactions.length, 0);
    assert.strictEqual(pkg.getFirstTransaction(), undefined);
    assert.strictEqual(pkg.getLastTransaction(), undefined);
  });

  it('creates independent empty transactions', () => {
    const pkg = new TransactionPackage(copybookPath);
    pkg.createEmptyTransaction();
    pkg.createEmptyTransaction();

    setFirstName(pkg.transactions[0], 'ALICE');
    const secondFirstName = findItemByName('FIRST-NAME', pkg.transactions[1].getCopybookItems());

    assert(secondFirstName, 'FIRST-NAME should be present on second transaction');
    assert.strictEqual(secondFirstName.value, undefined, 'second transaction should not share values');
  });

  it('throws when loading an empty buffer', () => {
    const pkg = new TransactionPackage(copybookPath);
    assert.throws(() => pkg.load(Buffer.alloc(0)), /No transaction data provided/);
  });

  it('loads multiple transactions from a buffer', () => {
    const source = new TransactionPackage(copybookPath);
    source.createEmptyTransaction();
    source.createEmptyTransaction();
    setFirstName(source.transactions[0], 'ALICE');
    setFirstName(source.transactions[1], 'BOB');

    const rawData = Buffer.concat([
      source.transactions[0].toBuffer(),
      Buffer.alloc(1, 0x15),
      source.transactions[1].toBuffer()
    ]);

    const pkg = new TransactionPackage(copybookPath);
    pkg.load(rawData);

    assert.strictEqual(pkg.transactions.length, 2);
    const first = findItemByName('FIRST-NAME', pkg.transactions[0].getCopybookItems());
    const second = findItemByName('FIRST-NAME', pkg.transactions[1].getCopybookItems());

    assert(first, 'FIRST-NAME should be present on first loaded transaction');
    assert(second, 'FIRST-NAME should be present on second loaded transaction');
    assert.strictEqual(first.value, 'ALICE'.padEnd(15, ' '));
    assert.strictEqual(second.value, 'BOB'.padEnd(15, ' '));
  });

  it('serializes empty package to zero-filled buffer', () => {
    const pkg = new TransactionPackage(copybookPath);
    const buffer = pkg.toBuffer();

    assert.strictEqual(buffer.length, pkg.parser.getTotalByteLength() + 1);
    for (const byte of buffer) {
      assert.strictEqual(byte, 0);
    }
  });

  it('serializes transactions with newline separators', () => {
    const pkg = new TransactionPackage(copybookPath);
    pkg.createEmptyTransaction();
    pkg.createEmptyTransaction();

    setFirstName(pkg.transactions[0], 'ALICE');
    setFirstName(pkg.transactions[1], 'BOB');

    const recordLength = pkg.parser.getTotalByteLength();
    const buffer = pkg.toBuffer();

    assert.strictEqual(buffer.length, (recordLength * 2) + 2);

    const firstRecord = buffer.subarray(0, recordLength);
    const firstNewline = buffer[recordLength];
    const secondRecord = buffer.subarray(recordLength + 1, recordLength + 1 + recordLength);
    const secondNewline = buffer[buffer.length - 1];

    assert.deepStrictEqual(firstRecord, pkg.transactions[0].toBuffer());
    assert.strictEqual(firstNewline, 0x15);
    assert.deepStrictEqual(secondRecord, pkg.transactions[1].toBuffer());
    assert.strictEqual(secondNewline, 0x15);
  });

  it('saves buffer to file and rejects empty path', () => {
    const pkg = new TransactionPackage(copybookPath);
    pkg.createEmptyTransaction();
    setFirstName(pkg.transactions[0], 'ALICE');

    assert.throws(() => pkg.save(''), /Please provide a path to save the transaction package to/);

    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'transaction-package-'));
    const filePath = path.join(tempDir, 'package.dat');

    pkg.save(filePath);

    const saved = fs.readFileSync(filePath);
    assert.deepStrictEqual(saved, pkg.toBuffer());

    fs.rmSync(tempDir, { recursive: true, force: true });
  });
});
