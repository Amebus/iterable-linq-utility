---
"iterable-linq-utility": minor
---

New `flat(depth?)` Transformation: flattens the nested iterables up to `depth` levels (1 by default, `Infinity` for all), like `Array.prototype.flat` for any `Iterable`; strings are not flattened. The type of the values is the new `FlatIterable<T, Depth>` (#43).
