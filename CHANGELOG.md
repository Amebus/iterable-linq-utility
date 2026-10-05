# iterable-linq-utility

## 0.11.0

### Minor Changes

- [#172](https://github.com/Amebus/iterable-linq-utility/pull/172) [`4e06e95`](https://github.com/Amebus/iterable-linq-utility/commit/4e06e953010471eb79e596b2b817aed9caee0ee1) Thanks [@Amebus](https://github.com/Amebus)! - `extend(name, implementation)` now replaces a method added by an earlier `extend` with the same name instead of throwing, so a module that runs twice (hot module replacement, test runners) keeps working; library methods still need `override` ([#81](https://github.com/Amebus/iterable-linq-utility/issues/81)).

- [#174](https://github.com/Amebus/iterable-linq-utility/pull/174) [`031b850`](https://github.com/Amebus/iterable-linq-utility/commit/031b8505c70d9b57ab8d1b9fc64921b9c3828220) Thanks [@Amebus](https://github.com/Amebus)! - New `fromObject(object, options?)` chain starter: lazily yields the entries, keys, values or property descriptors of an object, like `Object.entries`, `Object.keys` and `Object.values`, with `inherited`, `nonEnumerable` and `symbols` options ([#173](https://github.com/Amebus/iterable-linq-utility/issues/173)).

## 0.10.0

### Minor Changes

- [#168](https://github.com/Amebus/iterable-linq-utility/pull/168) [`f1f4df0`](https://github.com/Amebus/iterable-linq-utility/commit/f1f4df0b512e06e56d8e0123b84b676a65ae0779) Thanks [@Amebus](https://github.com/Amebus)! - New `chunk(size)` Transformation: yields arrays of `size` values, the last one with the remaining values. Each array is yielded once its values have been read, so it works with infinite sources ([#37](https://github.com/Amebus/iterable-linq-utility/issues/37)).

- [#166](https://github.com/Amebus/iterable-linq-utility/pull/166) [`d488393`](https://github.com/Amebus/iterable-linq-utility/commit/d488393d1a96e838b614255ea9958d14b96158e7) Thanks [@Amebus](https://github.com/Amebus)! - New `collectToMap(keySelector, valueSelector?)` Action: collects the values into a `Map` from the key returned by `keySelector` to the value, or to the value returned by `valueSelector`. A later value with the same key replaces the earlier one ([#64](https://github.com/Amebus/iterable-linq-utility/issues/64)).

- [#166](https://github.com/Amebus/iterable-linq-utility/pull/166) [`eaedb85`](https://github.com/Amebus/iterable-linq-utility/commit/eaedb854746de27e0018de00f15dc58718d30290) Thanks [@Amebus](https://github.com/Amebus)! - New `collectToSet()` Action: collects the distinct values into a `Set`, compared with `SameValueZero` as `Set` does ([#63](https://github.com/Amebus/iterable-linq-utility/issues/63)).

- [#168](https://github.com/Amebus/iterable-linq-utility/pull/168) [`23664cf`](https://github.com/Amebus/iterable-linq-utility/commit/23664cf112e81f657303592f6c9a420265b0af35) Thanks [@Amebus](https://github.com/Amebus)! - New `defaultIfEmpty(value)` Transformation: yields the values, or only `value` when the source is empty ([#45](https://github.com/Amebus/iterable-linq-utility/issues/45)).

- [#168](https://github.com/Amebus/iterable-linq-utility/pull/168) [`f115b0c`](https://github.com/Amebus/iterable-linq-utility/commit/f115b0c7f8638135e542f6883b2cff1238c03051) Thanks [@Amebus](https://github.com/Amebus)! - New `entries()` Transformation: yields `[index, value]` pairs, like `Array.prototype.entries` ([#44](https://github.com/Amebus/iterable-linq-utility/issues/44)).

- [#169](https://github.com/Amebus/iterable-linq-utility/pull/169) [`59309d2`](https://github.com/Amebus/iterable-linq-utility/commit/59309d2ace22c5016b732e39d0d85cb4fee8f348) Thanks [@Amebus](https://github.com/Amebus)! - New `flat(depth?)` Transformation: flattens the nested iterables up to `depth` levels (1 by default, `Infinity` for all), like `Array.prototype.flat` for any `Iterable`; strings are not flattened. The type of the values is the new `FlatIterable<T, Depth>` ([#43](https://github.com/Amebus/iterable-linq-utility/issues/43)).

- [#166](https://github.com/Amebus/iterable-linq-utility/pull/166) [`9693ad8`](https://github.com/Amebus/iterable-linq-utility/commit/9693ad83b8ddedc8ea10da34ba2c2f368c0c595a) Thanks [@Amebus](https://github.com/Amebus)! - New `reduceRight` Action: like `reduce`, from the last value to the first, as `Array.prototype.reduceRight`, with and without a seed. The reducer receives the index of each value in the source; the whole source is read first ([#62](https://github.com/Amebus/iterable-linq-utility/issues/62)).

- [#170](https://github.com/Amebus/iterable-linq-utility/pull/170) [`ab87d9a`](https://github.com/Amebus/iterable-linq-utility/commit/ab87d9acd6ee4e0c0c7adef9ee83467c7a8e2e62) Thanks [@Amebus](https://github.com/Amebus)! - New `with(index, value)` Transformation: yields the values with `value` in place of the value at `index`, like `Array.prototype.with`; a negative index counts from the end. An index out of range throws when the source ends. The raw function is `Functions.with` ([#46](https://github.com/Amebus/iterable-linq-utility/issues/46)).

- [#169](https://github.com/Amebus/iterable-linq-utility/pull/169) [`a20dd3d`](https://github.com/Amebus/iterable-linq-utility/commit/a20dd3df3511eb37505b5677ffafb303a4284041) Thanks [@Amebus](https://github.com/Amebus)! - New `zip(...others)` Transformation: yields tuples of the values at the same position in the source and in each of `others`, typed as `[T, ...U]`. It stops at the end of the shortest iterable and closes the others ([#36](https://github.com/Amebus/iterable-linq-utility/issues/36)).

## 0.9.0

### Minor Changes

- [#164](https://github.com/Amebus/iterable-linq-utility/pull/164) [`81b6243`](https://github.com/Amebus/iterable-linq-utility/commit/81b6243757ea3619bd75bccaccaf056e45ff4f17) Thanks [@Amebus](https://github.com/Amebus)! - New `reverse()` Transformation: yields the values in reverse order without changing the source, like `Array.prototype.toReversed`. It reads the whole source before the first value, and every run reads the source again ([#42](https://github.com/Amebus/iterable-linq-utility/issues/42)).

- [#164](https://github.com/Amebus/iterable-linq-utility/pull/164) [`8debf5c`](https://github.com/Amebus/iterable-linq-utility/commit/8debf5c62b9edfe52acd0e714d19fdd14f4a87b7) Thanks [@Amebus](https://github.com/Amebus)! - New `skipLast(count)` Transformation: yields every value except the last `count`, each one once `count` more values have been read, so it works with infinite sources. It keeps a buffer of `count` values ([#31](https://github.com/Amebus/iterable-linq-utility/issues/31)).

- [#164](https://github.com/Amebus/iterable-linq-utility/pull/164) [`5cc0dea`](https://github.com/Amebus/iterable-linq-utility/commit/5cc0dea2a569c519394b52f04cc13f498e9895b1) Thanks [@Amebus](https://github.com/Amebus)! - New `takeLast(count)` Transformation: yields the last `count` values. It reads the whole source before the first value, keeping a buffer of `count` values ([#30](https://github.com/Amebus/iterable-linq-utility/issues/30)).

## 0.8.0

### Minor Changes

- [#155](https://github.com/Amebus/iterable-linq-utility/pull/155) [`0b3b074`](https://github.com/Amebus/iterable-linq-utility/commit/0b3b0747730c272c1841e4ae9f602b7d6c4d4e0e) Thanks [@Amebus](https://github.com/Amebus)! - New `append(value)` Transformation: yields the values of the chain, then `value` ([#23](https://github.com/Amebus/iterable-linq-utility/issues/23)).

- [#158](https://github.com/Amebus/iterable-linq-utility/pull/158) [`dc4ec7f`](https://github.com/Amebus/iterable-linq-utility/commit/dc4ec7ff194247e0575980275c62c0b4c94928ed) Thanks [@Amebus](https://github.com/Amebus)! - New `concat(...others)` Transformation: yields the values of the chain, then the values of each iterable in `others`, opening each one only when it is reached ([#22](https://github.com/Amebus/iterable-linq-utility/issues/22)).

- [#157](https://github.com/Amebus/iterable-linq-utility/pull/157) [`66526a9`](https://github.com/Amebus/iterable-linq-utility/commit/66526a98d06d17d94f940ec107206ae64ad97f28) Thanks [@Amebus](https://github.com/Amebus)! - New `prepend(value)` Transformation: yields `value`, then the values of the chain ([#24](https://github.com/Amebus/iterable-linq-utility/issues/24)).

- [#159](https://github.com/Amebus/iterable-linq-utility/pull/159) [`26847ae`](https://github.com/Amebus/iterable-linq-utility/commit/26847ae11fdb40d75ce85bb33ac8ec6503dea2d6) Thanks [@Amebus](https://github.com/Amebus)! - New `slice(start?, end?)` Transformation: yields the values from `start` to `end` (excluded), like `Array.prototype.slice`, with negative indexes counting from the end. Non-negative indexes stream the values and close the source at `end`; a negative index keeps only a buffer of `-start` or `-end` values ([#25](https://github.com/Amebus/iterable-linq-utility/issues/25)).

## 0.7.0

### Minor Changes

- [#149](https://github.com/Amebus/iterable-linq-utility/pull/149) [`99d3c79`](https://github.com/Amebus/iterable-linq-utility/commit/99d3c793f613a994a4a177887cd93b5fb198b9b4) Thanks [@Amebus](https://github.com/Amebus)! - New `average(selector?)` Action: returns the average of the values, or of the numbers returned by `selector`, and `undefined` for an empty chain; without `selector`, the chain must contain numbers ([#51](https://github.com/Amebus/iterable-linq-utility/issues/51)).

- [#153](https://github.com/Amebus/iterable-linq-utility/pull/153) [`4b87319`](https://github.com/Amebus/iterable-linq-utility/commit/4b873199e3fcd9a917384918fd6120aebd6cb591) Thanks [@Amebus](https://github.com/Amebus)! - New `join(separator?)` Action: joins the values in a string, like `Array.prototype.join`, with `,` as the default separator ([#61](https://github.com/Amebus/iterable-linq-utility/issues/61)).

- [#151](https://github.com/Amebus/iterable-linq-utility/pull/151) [`14f0df3`](https://github.com/Amebus/iterable-linq-utility/commit/14f0df37c8c8318884c1bd1c70ebd7cf846a3469) Thanks [@Amebus](https://github.com/Amebus)! - New `sequenceEqual(other, equals?)` Action: tells whether the chain and `other` have the same values in the same order, compared with `===` or with `equals`; it stops and closes both sources at the first difference ([#60](https://github.com/Amebus/iterable-linq-utility/issues/60)).

- [#150](https://github.com/Amebus/iterable-linq-utility/pull/150) [`704c13b`](https://github.com/Amebus/iterable-linq-utility/commit/704c13bf81509923320fc48111d47d3eb3e5cb93) Thanks [@Amebus](https://github.com/Amebus)! - New `single(predicate?)` Action: returns the only value, or the only value that satisfies `predicate`, `undefined` if there is none, and throws if there is more than one ([#59](https://github.com/Amebus/iterable-linq-utility/issues/59)).

- [#148](https://github.com/Amebus/iterable-linq-utility/pull/148) [`d3640bc`](https://github.com/Amebus/iterable-linq-utility/commit/d3640bcf0d040280be7df27a0c17ee94015af349) Thanks [@Amebus](https://github.com/Amebus)! - New `sum(selector?)` Action: returns the sum of the values, or of the numbers returned by `selector`, and `0` for an empty chain; without `selector`, the chain must contain numbers ([#50](https://github.com/Amebus/iterable-linq-utility/issues/50)).

## 0.6.0

### Minor Changes

- [#144](https://github.com/Amebus/iterable-linq-utility/pull/144) [`a309ecd`](https://github.com/Amebus/iterable-linq-utility/commit/a309ecd0da5cfec3a27e6cddd0b5d6724418aa6f) Thanks [@Amebus](https://github.com/Amebus)! - New `at(index)` Action: returns the value at `index`, or `undefined`, with a negative index counting from the end, like `Array.prototype.at`; a non-integer `index` throws ([#58](https://github.com/Amebus/iterable-linq-utility/issues/58)).

- [#146](https://github.com/Amebus/iterable-linq-utility/pull/146) [`182ca7a`](https://github.com/Amebus/iterable-linq-utility/commit/182ca7a91cd41b50049c26d78229c48ea97200c9) Thanks [@Amebus](https://github.com/Amebus)! - The error messages created by the library now start with `[iterable-linq-utility/<operation>]`, the name of the function that rejected the input, e.g. `[iterable-linq-utility/filter] The "predicate" function must be provided`; the errors of the source and of the callbacks are unchanged ([#145](https://github.com/Amebus/iterable-linq-utility/issues/145)).

- [#143](https://github.com/Amebus/iterable-linq-utility/pull/143) [`cd5076d`](https://github.com/Amebus/iterable-linq-utility/commit/cd5076d4961f88c8d4e9f1c2caab29b8af413cb9) Thanks [@Amebus](https://github.com/Amebus)! - New `findLastIndex(predicate)` Action: returns the index of the last value that satisfies `predicate`, or `-1`, reading the whole source, like `Array.prototype.findLastIndex` ([#56](https://github.com/Amebus/iterable-linq-utility/issues/56)).

- [#142](https://github.com/Amebus/iterable-linq-utility/pull/142) [`c1ad0d1`](https://github.com/Amebus/iterable-linq-utility/commit/c1ad0d1fb239d4fa6ea41dc0440199a185581bb6) Thanks [@Amebus](https://github.com/Amebus)! - New `findLast(predicate)` Action: returns the last value that satisfies `predicate`, or `undefined`, reading the whole source; a type guard narrows the result, like `Array.prototype.findLast` ([#55](https://github.com/Amebus/iterable-linq-utility/issues/55)).

- [#140](https://github.com/Amebus/iterable-linq-utility/pull/140) [`35db392`](https://github.com/Amebus/iterable-linq-utility/commit/35db392df776cb6361dc06278475cad5d891f308) Thanks [@Amebus](https://github.com/Amebus)! - New `indexOf(value)` Action: returns the index of the first value strictly equal to `value`, or `-1`, stopping and closing the source at the first match, like `Array.prototype.indexOf` ([#54](https://github.com/Amebus/iterable-linq-utility/issues/54)).

- [#141](https://github.com/Amebus/iterable-linq-utility/pull/141) [`b338c3d`](https://github.com/Amebus/iterable-linq-utility/commit/b338c3dcbc45cbf0472d13b815642dc540e0682b) Thanks [@Amebus](https://github.com/Amebus)! - New `lastIndexOf(value)` Action: returns the index of the last value strictly equal to `value`, or `-1`, reading the whole source, like `Array.prototype.lastIndexOf` ([#57](https://github.com/Amebus/iterable-linq-utility/issues/57)).

## 0.5.0

### Minor Changes

- [#136](https://github.com/Amebus/iterable-linq-utility/pull/136) [`2bd0ec0`](https://github.com/Amebus/iterable-linq-utility/commit/2bd0ec0ad8fbdd61e9286bec448f7a729e8cd836) Thanks [@Amebus](https://github.com/Amebus)! - New `count(predicate?)` Action: counts the values, or the values that satisfy `predicate`, reading the whole source ([#49](https://github.com/Amebus/iterable-linq-utility/issues/49)).

- [#129](https://github.com/Amebus/iterable-linq-utility/pull/129) [`6d2c91a`](https://github.com/Amebus/iterable-linq-utility/commit/6d2c91a43777947d1cac1e079dd0dc9742b13a96) Thanks [@Amebus](https://github.com/Amebus)! - New `distinct(keySelector?)` Transformation: lazily keeps the first value for each distinct value or selected key in source order, using `SameValueZero` like `Set` ([#32](https://github.com/Amebus/iterable-linq-utility/issues/32)).

- [#133](https://github.com/Amebus/iterable-linq-utility/pull/133) [`78756f4`](https://github.com/Amebus/iterable-linq-utility/commit/78756f4110b8fa9cdabb3202c588262aba555b7b) Thanks [@Amebus](https://github.com/Amebus)! - New `every(predicate)` Action: tells whether every value satisfies `predicate`, stopping and closing the source at the first rejected value, like `Array.prototype.every` ([#47](https://github.com/Amebus/iterable-linq-utility/issues/47)).

- [#135](https://github.com/Amebus/iterable-linq-utility/pull/135) [`ef7c025`](https://github.com/Amebus/iterable-linq-utility/commit/ef7c025ecfb3259ebe6db6154427a70ff1f6c21f) Thanks [@Amebus](https://github.com/Amebus)! - New `findIndex(predicate)` Action: returns the index of the first value that satisfies `predicate`, or `-1`, stopping and closing the source at the first match, like `Array.prototype.findIndex` ([#53](https://github.com/Amebus/iterable-linq-utility/issues/53)).

- [#134](https://github.com/Amebus/iterable-linq-utility/pull/134) [`4556777`](https://github.com/Amebus/iterable-linq-utility/commit/4556777f7b94ad0d25011dd873f56a77bd606a8d) Thanks [@Amebus](https://github.com/Amebus)! - New `find(predicate)` Action: returns the first value that satisfies `predicate`, or `undefined`, stopping and closing the source at the first match; a type guard narrows the result, like `Array.prototype.find` ([#52](https://github.com/Amebus/iterable-linq-utility/issues/52)).

- [#137](https://github.com/Amebus/iterable-linq-utility/pull/137) [`7dfdac6`](https://github.com/Amebus/iterable-linq-utility/commit/7dfdac6921715e8092bb2e3675867b4eb636f022) Thanks [@Amebus](https://github.com/Amebus)! - New `includes(value)` Action: tells whether the chain contains `value`, compared with `SameValueZero` and stopping and closing the source at the first match, like `Array.prototype.includes` ([#48](https://github.com/Amebus/iterable-linq-utility/issues/48)).

- [#131](https://github.com/Amebus/iterable-linq-utility/pull/131) [`df630a5`](https://github.com/Amebus/iterable-linq-utility/commit/df630a53011242174e09f5ef5c239e225aa0c860) Thanks [@Amebus](https://github.com/Amebus)! - New `skipWhile(predicate)` Transformation: lazily skips values while `predicate` returns `true` and yields the rest, without calling `predicate` again after the first rejected value ([#29](https://github.com/Amebus/iterable-linq-utility/issues/29)).

- [#130](https://github.com/Amebus/iterable-linq-utility/pull/130) [`603cf14`](https://github.com/Amebus/iterable-linq-utility/commit/603cf14fb3a8cbb9f587d66d4210910ba43fc30e) Thanks [@Amebus](https://github.com/Amebus)! - New `takeWhile(predicate)` Transformation: lazily yields values while `predicate` returns `true`, then closes the source without reading further; a type guard narrows the element type ([#28](https://github.com/Amebus/iterable-linq-utility/issues/28)).

## 0.4.0

### Minor Changes

- [#123](https://github.com/Amebus/iterable-linq-utility/pull/123) [`7407890`](https://github.com/Amebus/iterable-linq-utility/commit/74078900aed6c62ce3ec07db41c7a601c95b973d) Thanks [@Amebus](https://github.com/Amebus)! - `filter(predicate)` accepts a type guard and narrows the element type of the result, like `Array.prototype.filter` ([#65](https://github.com/Amebus/iterable-linq-utility/issues/65)).

## 0.3.0

### Minor Changes

- [#94](https://github.com/Amebus/iterable-linq-utility/pull/94) [`76c28de`](https://github.com/Amebus/iterable-linq-utility/commit/76c28deda8accf3be125176d819cc590ea7cd1d4) Thanks [@Amebus](https://github.com/Amebus)! - New `skip(count)` Transformation: lazily skips the first `count` values and yields the rest ([#27](https://github.com/Amebus/iterable-linq-utility/issues/27)).

- [#92](https://github.com/Amebus/iterable-linq-utility/pull/92) [`2f3c23d`](https://github.com/Amebus/iterable-linq-utility/commit/2f3c23d5c7e94a251a4cea7554296636b61ff8df) Thanks [@Amebus](https://github.com/Amebus)! - Allow `some()` without a predicate to check whether an iterable contains any values ([#66](https://github.com/Amebus/iterable-linq-utility/issues/66)).

- [#79](https://github.com/Amebus/iterable-linq-utility/pull/79) [`8c5674a`](https://github.com/Amebus/iterable-linq-utility/commit/8c5674a22aecb468f9865d1b5e40f7f64cf4170d) Thanks [@andreafmdev](https://github.com/andreafmdev)! - New `take(count)` Transformation: yields the first `count` values, then closes the source, without reading past the `count`-th value ([#26](https://github.com/Amebus/iterable-linq-utility/issues/26)).

## 0.2.0

### Minor Changes

- [#70](https://github.com/Amebus/iterable-linq-utility/pull/70) [`9ef3f3f`](https://github.com/Amebus/iterable-linq-utility/commit/9ef3f3f1f9fc6fda22fc7e941d610ecbde6967c7) Thanks [@Amebus](https://github.com/Amebus)! - `reduce()` accepts a call without a seed: the first value is the initial accumulator, like `Array.prototype.reduce` without `initialValue` ([#67](https://github.com/Amebus/iterable-linq-utility/issues/67)).

## 0.1.0 and earlier

See the [GitHub Releases](https://github.com/Amebus/iterable-linq-utility/releases).
