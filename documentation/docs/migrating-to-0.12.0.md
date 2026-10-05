# Migrating to 0.12.0

Version 0.12.0 contains a breaking change. This page describes it, with the code to change when upgrading from 0.11.0.

## `sequenceEqual` compares with `SameValueZero` by default

Without `equals`, `sequenceEqual` compared the values with `===`, so `NaN` was never equal to itself. It now compares them with `SameValueZero`, like `Set` and `Map`: `NaN` equals `NaN`. `+0` still equals `-0`, and objects are still compared by reference. See [Equality](basic-concepts.md#equality) and [ADR 0024](https://github.com/Amebus/iterable-linq-utility/blob/main/docs/decisions/0024-equality-of-the-operations-that-compare-values.md).

```typescript
// 0.11.0
IterableLinq.from([1, NaN]).sequenceEqual([1, NaN]); // false

// 0.12.0
IterableLinq.from([1, NaN]).sequenceEqual([1, NaN]); // true
```

Only the chains that compare `NaN` change. To keep the old result, pass `===` as `equals`:

```typescript
IterableLinq.from([1, NaN]).sequenceEqual([1, NaN], (a, b) => a === b); // false
```
