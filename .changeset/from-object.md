---
"iterable-linq-utility": minor
---

New `fromObject(object, options?)` chain starter: lazily yields the entries, keys, values or property descriptors of an object, like `Object.entries`, `Object.keys` and `Object.values`, with `inherited`, `nonEnumerable` and `symbols` options (#173).
