---
"iterable-linq-utility": minor
---

New `sort(comparer?, options?)` Transformation: a stable sort that does not change the source, like `Array.prototype.toSorted`, with the comparer of `min` and `max`, `{ descending }`, and `null`, `undefined` and `NaN` last (#41).
