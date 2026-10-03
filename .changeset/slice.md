---
"iterable-linq-utility": minor
---

New `slice(start?, end?)` Transformation: yields the values from `start` to `end` (excluded), like `Array.prototype.slice`, with negative indexes counting from the end. Non-negative indexes stream the values and close the source at `end`; a negative index keeps only a buffer of `-start` or `-end` values (#25).
