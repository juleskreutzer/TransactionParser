import { CopybookParser } from '../dist/parser/copybookParser.js';
import * as path from 'path';

const exampleCopybook = path.join('C:\\Users\\Jules.Kreutzer\\GIT\\TransactionParser\\test', 'assets\\example_copybook.txt');

const parser = new CopybookParser(exampleCopybook);
parser.parse();
console.log(parser.toJson());