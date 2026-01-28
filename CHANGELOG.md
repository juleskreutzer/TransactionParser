#### 0.1.7-alpha.0 (2026-01-28)

##### Documentation Changes

*  Updated code documentation for TypeDoc generation ([a24562a0](https://github.com/juleskreutzer/TransactionParser/commit/a24562a0144cc00e75fe00ed380108c3e2a09d50))
*  Generate docs when new release is published ([a61e2e0e](https://github.com/juleskreutzer/TransactionParser/commit/a61e2e0e2e230e5453c4887b116a68d73ff60085))

##### New Features

* **Transaction:**  Load transaction data from a buffer ([7ac45a59](https://github.com/juleskreutzer/TransactionParser/commit/7ac45a590cd746dd95e1faa5ccea9a06d0980121))
* **Parser:**  Keep track of byte length for each copybook item and usage type (DISPLAY or COMPUTATIONAL) ([81113b35](https://github.com/juleskreutzer/TransactionParser/commit/81113b355c51c73e5cb499942baabe0e225e7951))

##### Bug Fixes

* **tests:**  Updated several tests after code changes ([f657740a](https://github.com/juleskreutzer/TransactionParser/commit/f657740a14a7df53d6c4f34645355111067b2e8e))
* **Parser:**
  *  Filter out linenumber if these are present ([96381204](https://github.com/juleskreutzer/TransactionParser/commit/96381204f58e5412a07f26e32da6753c1a037254))
  *  Regex to get header of copybook item now starts processing from position 7 to prevent incorrect parsing when line numbers are included in the copybook ([589540b6](https://github.com/juleskreutzer/TransactionParser/commit/589540b674356a28c6eb3a88b18ce37f9c1c6e8e))
* **docs:**  Resolved TypeDoc warnings ([ac62077f](https://github.com/juleskreutzer/TransactionParser/commit/ac62077fb097315241e4b70252b8b8cf79c6e57e))

##### Other Changes

*  Upload docs folder to github-pages ([550d119c](https://github.com/juleskreutzer/TransactionParser/commit/550d119c3992460d9af71dd947727d438a8844a8))
*  Updated documentation action workflow ([cfaa2c69](https://github.com/juleskreutzer/TransactionParser/commit/cfaa2c6949bde7e48d8295665813569c26be1df4))
*  Updated npmignore and gitignore files ([e0f58773](https://github.com/juleskreutzer/TransactionParser/commit/e0f5877334c6ff8deca94a3e9f831ac4f38dcd0a))
*  Include .github/ files in commits ([872550ce](https://github.com/juleskreutzer/TransactionParser/commit/872550ce7181ff9a82b765f1a6be5ded56464336))
* **docs:**  Added typedoc dev dependency ([b475b792](https://github.com/juleskreutzer/TransactionParser/commit/b475b79202407aa53ed9ef299e1fe8be7b075f66))

##### Refactors

* **Transaction:**  Convert interface to use buffer instead of string ([a62b198d](https://github.com/juleskreutzer/TransactionParser/commit/a62b198dc19518043d70fe1f0fac33e7655807c6))

#### 0.1.6 (2026-01-21)

##### New Features

* **Transaction:**  Initial support for TransactionPackage ([99005710](https://github.com/juleskreutzer/TransactionParser/commit/9900571047051a5abce7e6c9fd395e9b14571ac2))
* Track start and end of position of copybook item ([c6d20542](https://github.com/juleskreutzer/TransactionParser/commit/c6d20542b582e06398ccaec5716133ae34a8db21))

##### Other Changes

* **Transaction:**  Added initial interface for transaction support ([fbaa81f1](https://github.com/juleskreutzer/TransactionParser/commit/fbaa81f15735f146ee56a58d6c4a3ca065951ba3))

#### 0.1.6 (2026-01-18)

##### Bug Fixes

* Include missing files in npm package ([4cbcd562](https://github.com/juleskreutzer/TransactionParser/commit/4cbcd5621929a9fa657b662ced63504b5e556f72))

##### Other Changes

* **misc:**  Adjusted badge URL in README.md ([c6d670cb](https://github.com/juleskreutzer/TransactionParser/commit/c6d670cbb72c5008a4f0cd52f2d3b7e5835ca893))

#### 0.1.5 (2026-01-18)

#### 0.1.4 (2026-01-18)

##### Other Changes

* **misc:**  Added status badge to README.md ([36463f6f](https://github.com/juleskreutzer/TransactionParser/commit/36463f6f9b333173b8518705fc5468882ac2205a))

#### 0.1.3 (2026-01-18)

##### Bug Fixes

* **tests:**  Fixed failing test ([a699da0f](https://github.com/juleskreutzer/TransactionParser/commit/a699da0fe9cacae4db0fe9358088455a3b6c08f3))

#### 0.1.2 (2026-01-18)

##### Other Changes

*  Clean up left over comments ([6dad9888](https://github.com/juleskreutzer/TransactionParser/commit/6dad98888646ced2041cd0540a23c10f73f01724))

#### 0.1.1 (2026-01-18)

##### Other Changes

* //github.com/juleskreutzer/TransactionParser ([417d9220](https://github.com/juleskreutzer/TransactionParser/commit/417d9220f110abc254f083b76037ae433070d513))

### 0.1.0.3 (2026-01-18)

#### 0.0.2-alpha.2 (2026-01-18)

##### Documentation Changes

*  Expanded TypeDoc comments ([6977c1ac](https://github.com/juleskreutzer/TransactionParser/commit/6977c1aca5dc9e47463c49f880b0889d90f836c4))

##### Other Changes

* Prepare for npm packaging ([26aee42a](https://github.com/juleskreutzer/TransactionParser/commit/26aee42a4ea143ce96f736f90a5eff282f57b3c8))

#### 0.0.2-alpha.1 (2026-01-17)

##### Other Changes

* **misc:**
  *  Updated README.md to include docs and sample ([e4d709ff](https://github.com/juleskreutzer/TransactionParser/commit/e4d709ff70c263cfde2f929b4b3460d5ee778213))
  *  Updated README.md to reflect latest changes ([e45b96fd](https://github.com/juleskreutzer/TransactionParser/commit/e45b96fd2e5a5af66649b519c18cdbfd262cb997))

#### 0.0.2-alpha.0 (2026-01-17)

##### New Features

* **parser:**  Support for handling OCCURS clauses ([4c8c994b](https://github.com/juleskreutzer/TransactionParser/commit/4c8c994b9920f9db0dc6f0f74eed685d3e8be7d2))

##### Fixes

* **tests:** Adjusted unit tests to handle OCCURS clauses ([4c8c994b](https://github.com/juleskreutzer/TransactionParser/commit/4c8c994b9920f9db0dc6f0f74eed685d3e8be7d2))

##### Other changes (-refactor)

* **refactoring:** Refactored imports ([4c8c994b](https://github.com/juleskreutzer/TransactionParser/commit/4c8c994b9920f9db0dc6f0f74eed685d3e8be7d2))

#### 0.0.1 (2026-01-15)

##### Other Changes (-refactor)

* **package.json:**  Refactored release scripts ([9d5c0fc8](https://github.com/juleskreutzer/TransactionParser/commit/9d5c0fc825ddf5bf9b7267f7aa0962a66b225c2a))

##### Other Changes

* Clean CHANGELOG.md ([76b41b6e](https://github.com/juleskreutzer/TransactionParser/commit/76b41b6e9d3298c9b42c9440e012d66b46e12454))

#### 0.0.1 (2026-01-14)
- Initial version

