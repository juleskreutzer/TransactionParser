import {CopybookParser} from '../dist/parser/copybookParser.js';
import * as path from 'path';

const parser = new CopybookParser(path.join('/Users/juleskreutzer/git/TransactionParser/test', 'assets/occurs_copybook.txt')); 
parser.parse();
console.log(parser.toJson());