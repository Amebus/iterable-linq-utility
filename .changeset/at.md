---
"iterable-linq-utility": minor
---

New `at(index)` Action: returns the value at `index`, or `undefined`, with a negative index counting from the end, like `Array.prototype.at`; a non-integer `index` throws (#58).
