---
"iterable-linq-utility": minor
---

New `shuffle(options?)` Transformation: lazily yields the values in uniform random order, a new one at each run, where `{ seed }` repeats the same order, `{ seed, random }` uses your generator with a seed of any type, and `shuffle().take(k)` gives k random values (#220).
