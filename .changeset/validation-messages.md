---
"iterable-linq-utility": minor
---

The validation messages name the argument (`"iterable"`, `"other"`, `"inner"` or `"others"` instead of `"sourceIterable"`), and `min`, `max`, `memoize`, `fromRange`, `Functions.range` and `join` validate their arguments; `memoize({ allowPartialMemoization: undefined })` keeps the partial memoization ([migration guide](https://amebus.github.io/iterable-linq-utility/0.13/migrating-to-0.13.0/)) (#202).
