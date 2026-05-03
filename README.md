# TransactionParser

[![Node.js Package](https://github.com/juleskreutzer/TransactionParser/actions/workflows/npm-publish.yml/badge.svg)](https://github.com/juleskreutzer/TransactionParser/actions/workflows/npm-publish.yml)

Parse files containing transaction data using COBOL copybooks into a TypeScript object.

Documentation is published on [Github Pages](https://juleskreutzer.github.io/TransactionParser/).

## Table of Contents
- [Parse copybooks](#parse-copybooks)
  - [Example](#example)
- [Transaction Packages and Transactions](#transaction-packages-and-transactions)
  - [Usage](#usage)
  - [Editing data from a transaction](#editing-data-from-a-transaction)
  - [Saving data](#saving-data)
- [Events](#events)
  - [Copybook parsing](#copybook-parsing)
    - [start event](#start-event)
    - [newLine event](#newline-event)
    - [endLine event](#endline-event)
    - [end event](#end-event)
- [CLI](#cli)
  - [Installation](#installation)
  - [Usage](#usage-1)
    - [Convert data to JSON](#convert-data-to-json)
    - [Convert data to CSV](#convert-data-to-csv)

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
            "decimals": 0,
            "value": "               "
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

## Events
This package emits _typed_ events during certain stages of processing, for example when parsing a copybook.

Use the `getEventEmitter()` method on supported classes to subscribe to events.
Events are supported in every class that implements the `IEventSupport` interface:
- CopybookParser

#### Example
```ts
const parser = new CopybookParser('/path/to/copybook')
const emitter = parser.getEventEmitter()

emitter.subscribe('start', (payload) => {
  console.log(payload) // Contains properties copybook, rawData and preparedData
})

const newLineFunc = (payload) => {
  console.log(payload)
}

emitter.subscribe('newLine', newLineFunc) // Subscribes to the 'newLine' event
emitter.unsubscribe('newLine', newLineFunc) // Unsubscribe from the 'newLine' event

emitter.once('endLine', (payload) => {
  console.log(payload) // Only logged once, for the first 'endLine' event
})
```

### Copybook parsing
During parsing of a copybook, the following events are emitted:
- `start`
- `newLine`
- `endLine`
- `end`

#### start event
This event is emitted at the beginning of parsing a copybook

| Property | Value
| - | - |
| `copybook` | Path of the copybook that will be parsed |
| `preparedData` | Array of strings containing the lines to be parsed |
| `rawData` | Data loaded from the copybook file that will be processed after being prepared |

> `preparedData` is `rawData` splitted on every new line, tabs are replaced with ` ` (space). Only includes non-empty lines

#### newLine event
This event is emitted at the beginning of each new line that is parsed

| Property | Value |
| - | - |
| `copybook` | Path of the copybook that is being parsed |
| `line` | Current line that is being parsed |
| `parsedItems` | Array of objects of previously parsed lines containing `item` (DataItem) and `level` (number) properties

#### endLine event
This event is emitted for each line when parsing has finished

| Property | Value | 
| - | - |
| `copybook` | Path of the copybook that is being parsed |
| `line` | Current line that is being parsed |
| `newItem` | Object representing the current line containing the `item` (DataItem) and `level` (number) properties |
| `parsedItems` | Array of objects of previously parsed lines containing `item` (DataItem) and `level` (number) properties |

> `parsedItems` will include `newItem`

#### end event
This event is emitted when parsing of the copybook is finished.

| Property | Value |
| - | - |
| `copybook` | Path of the copybook that has been parsed | 
| `parsedCopybook` | Array of DataItems into which the copybook has parsed. For these DataItem's, `children`, `occurs` and `redefines` clauses have been resolved.

### Transaction Package
When using a transaction package, the following event are emitted:
- `beforeParsing`
- `parsingComplete`
- `transactionLoaded`
- `transactionCreated`
- `transactionPackageSave`

#### beforeParsing event
This event is emitted after `CopybookParser` instance is created and before actual parsing of the copybook.

| Property | Value |
| - | - |
| `parser` | Instance of `CopybookParser` that is used to parse the provided copybook |

> Use `parser.getEventEmitter()` to subscribe to event that are emitted during copybook parsing. See [Copybook Parsing](#copybook-parsing)

#### parsingCompleted event
This event is emitted after the parsing of a copybook provided when creating a transaction package has been completed

| Property | Value |
| - | - |
| `parser` | Instance of `CopybookParser` that is used to parse the provided copybook. |
| `parsedCopybook` | An array of `DataItem` representing the parsed copybook | 

#### transactionLoaded event
This event is emitted when:
- A new transaction package instance is created
- When a transactions are loaded via the `loadFile()` or `load()` methods

| Property | Value |
| - | - |
| `parser` | Instance of `CopybookParser` that is used to parse the provided copybook |
| `transactions` | Array of `ITransaction` instances that have been loaded into the transaction package |

> `transactions` is possibly an empty array

#### transactionCreated event
This event is emitted when a new transaction is created after the transaction package has been initialized by calling `createEmptyTransaction()`

| Property | Value |
| - | - |
| `parser` | Instance of `CopybookParser` that is used to parse the provided copybook |
| `newTransaction` | `ITransaction` that was recently created |
| `transactions` | Array of `ITransaction` containing the transactions that are included in the current transaction package. This includes `newTransaction` |

#### transactionPackageSave event
This event is emitted when a transaction package is stored to a file

| Property | Value |
| - | - |
| `parser` | Instance of `CopybookParser` that is used to parse the provided copybook |
| `transactions` | Array of `ITransaction` containing all transactions that are included in the current transaction package |
| `buffer` | [NodeJS Buffer](https://nodejs.org/api/buffer.html#buffer) containing the raw data that will be written to `outputPath` |
| `outputPath` | Path where the transaction package will be stored |

## CLI
This package also provides a Command Line Interface (CLI) to convert a (binairy) transaction file into a JSON or CSV file.

### Installation
Install the package globally using:
```bash
npm i -g transactionparser
```

This will make the `transactionparser` (or the shorter `traper` version) available in your terminal.

### Usage

- `trapar -h` Show Help info with available commands
- `trapar parse -h` Show help info for the `parse` command

#### Convert data to JSON
```bash
trapar parse 'path/to/data' -c 'path/to/copybook' -f 'JSON' -o 'output.txt' 
```
Convert the data at `path/to/data` using the copybook located at `/path/to/copybook` and format it to a `JSON` string stored in `output.txt`

#### Convert data to CSV
```bash
trapar parse 'path/to/data' -c 'path/to/copybook' -f 'CSV' -o 'output.csv' 
```

