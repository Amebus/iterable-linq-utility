---
"iterable-linq-utility": minor
---

New `shuffle(options?)` Transformation: lazily yields the values in uniform random order, a new one at each run; `{ seed }` repeats the same order, and `{ seed, random }` uses your generator, with a seed of any type. `shuffle().take(k)` gives k random values.
