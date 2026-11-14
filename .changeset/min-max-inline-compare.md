---
"iterable-linq-utility": patch
---

`min()` and `max()` without a comparer compare the values in their own loop instead of calling the default compare function, about 40% faster, and with a comparer they are from 33% to 100% faster, with the same results (#177).
