# TransactionParser

[![Node.js Package](https://github.com/juleskreutzer/TransactionParser/actions/workflows/npm-publish.yml/badge.svg)](https://github.com/juleskreutzer/TransactionParser/actions/workflows/npm-publish.yml)

Parse files containing transaction data using COBOL copybooks into a TypeScript object.

Documentation is published on [Github Pages](https://juleskreutzer.github.io/TransactionParser/).

## Parse copybooks
This package supports parsing a copybook into a TypeScript object.

```ts
const parser = new CopybookParser('/path/to/copybook'); // Supports any extension
parser.parse(); // Load copybook as object

parser.getParsedCopybook(); // Retrieve copybook as object
parser.toJson(); // Retrieve copybook as JSON string
```

Want to use a different copybook? Just update the path to the copybook:
```ts
parser.updateCopybookPath('/path/to/another/copybook');
```

> Note: This will clear previously parsed copybook data

### Example
The following copybook:
```
       01 CUSTOMER-RECORD.
          05 CUSTOMER-NAME.
             10 FIRST-NAME             PIC X(15).
```

Will be parsed and represented as a JSON object:
```json
[
  {
    "level": 1,
    "name": "CUSTOMER-RECORD",
    "picture": "group",
    "length": 0,
    "signed": false,
    "usage": "display",
    "dataPosition": {
      "offset": 0,
      "byteLength": 0
    },
    "decimals": 0,
    "children": [
      {
        "level": 5,
        "name": "CUSTOMER-NAME",
        "picture": "group",
        "length": 0,
        "signed": false,
        "usage": "display",
        "dataPosition": {
          "offset": 0,
          "byteLength": 0
        },
        "decimals": 0,
        "children": [
          {
            "level": 10,
            "name": "FIRST-NAME",
            "picture": "string",
            "length": 15,
            "signed": false,
            "usage": "display",
            "dataPosition": {
              "offset": 0,
              "byteLength": 15
            },
            "decimals": 0
          }
        ]
      }
    ]
  }
]
```

## Transaction Packages and Transactions
This package uses the term `transaction package` to indicate a package containing zero or more transactions. A `Transaction` is the representation of the parsed copybook and it's values.

### Usage
Create a new (empty) transaction package:
```typescript
import { TransactionPackage } from 'transactionparser';

const copybookPath = '/Path/to/copybook';
const tp = new TransactionPackage(copybookPath);
```
Once a transaction package is created, you can either fill it with empty transactions:
```typescript
tp.createEmptyTransaction();
```
Or load the contents of a Mainframe file downloaded in binary mode:
```typescript
const dataFile = '/Path/to/binary/file';
tp.loadFile(dataFile);
```

### Editing data from a transaction
The `transactions` property on the transaction package can be used to retrieve an array of all transactions in the package. Alternatively, helper methods like `getFirstTransaction()` or `getLastTransaction()` are also available.

To update the value for the `FIRST-NAME` field, you can:
```typescript
tp.transactions[0].getCopybookItem('FIRST-NAME').setValue('Jules');
```

### Saving data
The `TransactionPackage` class provides the functionality to write the package back to a file, that can the, for example using the Zowe CLI, be uploaded back to the Mainframe.

```typescript
tp.save('/path/my_modified_transaction');
```
> Note: This uses the `TransactionPackage#toBuffer()` method which will add the new line character, EBCDIC byte `x'15'` at the end of every transaction.

Alternatively, you can also use the `toJson()` or `toBuffer()` methods to convert the transaction package to a stringyfied JSON array or buffer.

