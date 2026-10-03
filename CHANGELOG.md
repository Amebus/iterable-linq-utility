# iterable-linq-utility

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
