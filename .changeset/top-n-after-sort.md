---
"iterable-linq-utility": patch
---

`sort(…)` followed by `take`, `slice`, or `skip` and `take`, sorts only the values it yields when that is faster (#203).
