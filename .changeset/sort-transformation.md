---
"iterable-linq-utility": minor
---

New `sort(options?)`, `sort(compare)` and `sort(keys, options?)` Transformation: a stable sort that does not change the source, like `Array.prototype.toSorted`; `{ descending: true }` sorts the other way, and `null`, `undefined` and `NaN` go last (#41).
