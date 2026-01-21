import {CopybookParser} from '../dist/parser/copybookParser.js';
import { TransactionPackage } from '../dist/transaction/transactionPackage.js';
import * as path from 'path';

const parser = new CopybookParser(path.join('/Users/juleskreutzer/git/TransactionParser/test', 'assets/occurs_copybook.txt')); 
parser.parse();
// console.log(parser.toJson());

const tp = new TransactionPackage(path.join('/Users/juleskreutzer/git/TransactionParser/test', 'assets/occurs_copybook.txt'));
tp.createEmptyTransaction();
console.log(tp.getFirstTransaction().getCopybookItems()[0].children[1]);

