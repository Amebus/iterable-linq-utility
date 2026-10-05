---
"iterable-linq-utility": minor
---

Breaking: `sequenceEqual(other, equals?)` without `equals` now compares the values with `SameValueZero`, like `Set` and `Map`, so `NaN` equals `NaN`; pass `(a, b) => a === b` for the old behaviour. See the migration guide and ADR 0024 (#152).
