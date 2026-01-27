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

## Load transaction data
In the future, this package will support loading transaction data from a file based on a copybook that will be used for validation.

