---
"iterable-linq-utility": minor
---

`extend(name, implementation)` now replaces a method added by an earlier `extend` with the same name instead of throwing, so a module that runs twice (hot module replacement, test runners) keeps working; library methods still need `override` (#81).
