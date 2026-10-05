---
"iterable-linq-utility": minor
---

Breaking: `sequenceEqual(other, equals?)` without `equals` now compares the values with `SameValueZero`, like `Set` and `Map`, so `NaN` equals `NaN`; pass `(a, b) => a === b` for the old behaviour. See the [migration guide](https://amebus.github.io/iterable-linq-utility/0.12/migrating-to-0.12.0/) and [ADR 0024](https://github.com/Amebus/iterable-linq-utility/blob/main/docs/decisions/0024-equality-of-the-operations-that-compare-values.md) (#152).
