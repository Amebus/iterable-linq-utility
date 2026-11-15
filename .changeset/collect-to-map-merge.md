---
"iterable-linq-utility": minor
---

`collectToMap(keySelector, valueSelector, options)` and `collectToMap(keySelector, options)` accept a `merge(existing, incoming, key)` function in their options: when a key is repeated, it receives the value stored and the new selected value, and returns the value to store, to keep the first value, combine the values or throw, like the merge function of Java `Collectors.toMap` (#167).
