---
"iterable-linq-utility": minor
---

The selectors that read a value from the element accept a property key in place of the function: `map('name')`, `flatMap('tags')`, `sum('price')`, `average('price')`, `distinct('email')`, `except`, `intersect` and `union` with a key, `groupBy('team')`, `collectToMap('id', 'name')`, and `innerJoin` / `groupJoin` with `'id', 'teamId'`. A key behaves like `v => v[key]`, and the result is typed from the property. The new type `KeysOfType<T, V>` gives the keys of `T` whose value is a `V`, and `KeysOverlapping<T, V>` the keys whose value has values in common with `V`, as the keys of a join need (#185).

The validation message of these selectors changes from `The "<name>" function must be provided` to `The "<name>" must be a function or a property key`: see [Migrating to 0.13.0](https://amebus.github.io/iterable-linq-utility/0.13/migrating-to-0.13.0/).
