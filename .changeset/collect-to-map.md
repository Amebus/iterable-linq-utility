---
"iterable-linq-utility": minor
---

New `collectToMap(keySelector, valueSelector?)` Action: collects the values into a `Map` from the key returned by `keySelector` to the value, or to the value returned by `valueSelector`. A later value with the same key replaces the earlier one (#64).
