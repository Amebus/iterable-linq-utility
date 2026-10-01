# iterable-linq-utility

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
