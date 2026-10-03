---
"iterable-linq-utility": minor
---

New `sequenceEqual(other, equals?)` Action: tells whether the chain and `other` have the same values in the same order, compared with `===` or with `equals`; it stops and closes both sources at the first difference (#60).
