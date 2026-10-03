---
"iterable-linq-utility": minor
---

New `distinct(keySelector?)` Transformation: lazily keeps the first value for each distinct value or selected key in source order, using `SameValueZero` like `Set` (#32).
