---
"iterable-linq-utility": patch
---

`count()` returns the `length` of an array and the `size` of a `Set` or a `Map` without iterating them, and `intersect(other)` and `except(other)` copy a `Set` or an array given as `other` faster, with the same results, as described in [ADR 0037](https://github.com/Amebus/iterable-linq-utility/blob/main/docs/decisions/0037-count-reads-the-size-and-other-is-copied-with-the-set-constructor.md) (#223).
