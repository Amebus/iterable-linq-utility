---
"iterable-linq-utility": minor
---

New `find(predicate)` Action: returns the first value that satisfies `predicate`, or `undefined`, stopping and closing the source at the first match; a type guard narrows the result, like `Array.prototype.find` (#52).
