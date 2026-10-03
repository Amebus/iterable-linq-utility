---
"iterable-linq-utility": minor
---

New `findLast(predicate)` Action: returns the last value that satisfies `predicate`, or `undefined`, reading the whole source; a type guard narrows the result, like `Array.prototype.findLast` (#55).
