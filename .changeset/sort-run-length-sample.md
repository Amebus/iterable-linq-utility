---
"iterable-linq-utility": patch
---

`sort(…)` followed by `take`, `slice`, or `skip` and `take`, also sorts only the values it yields on data of short runs that look almost sorted or almost reversed, such as `(i * 7919) % 1000` (#207).
