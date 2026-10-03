---
"iterable-linq-utility": minor
---

New `average(selector?)` Action: returns the average of the values, or of the numbers returned by `selector`, and `undefined` for an empty chain; without `selector`, the chain must contain numbers (#51).
