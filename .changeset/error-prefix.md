---
"iterable-linq-utility": minor
---

The error messages created by the library now start with `[iterable-linq-utility/<operation>]`, the name of the function that rejected the input, e.g. `[iterable-linq-utility/filter] The "predicate" function must be provided`; the errors of the source and of the callbacks are unchanged (#145).
