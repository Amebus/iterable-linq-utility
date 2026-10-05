---
"iterable-linq-utility": minor
---

New `with(index, value)` Transformation: yields the values with `value` in place of the value at `index`, like `Array.prototype.with`; a negative index counts from the end. An index out of range throws when the source ends. The raw function is `Functions.with` (#46).
