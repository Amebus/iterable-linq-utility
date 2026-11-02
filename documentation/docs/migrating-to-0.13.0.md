# Migrating to 0.13.0

Version 0.13.0 contains breaking changes. This page describes them, with the code to change when upgrading from 0.12.0.

## Selectors accept property keys, and their validation message changes

The selectors that read a value from the element accept a property key in place of the function: `map`, `flatMap`, `sum`, `average`, `distinct`, `except`, `intersect`, `union`, `groupBy`, `innerJoin`, `groupJoin` and `collectToMap`. See [Selectors](basic-concepts.md#selectors) and [ADR 0025](https://github.com/Amebus/iterable-linq-utility/blob/main/docs/decisions/0025-property-keys-as-selectors.md).

Two things change for the code that already uses them:

- A `string`, a `symbol` or a `number` passed as one of these selectors was rejected with an `Error`; it is now read as a property key.

    ```typescript
    // 0.12.0
    IterableLinq.from([{ name: 'Ann' }]).map('name' as never); // throws an Error

    // 0.13.0
    IterableLinq.from([{ name: 'Ann' }]).map('name').collectToArray(); // ['Ann']
    ```

- The message of the `Error` thrown for an invalid selector of these operations changes. Code that matches the message exactly must be updated:

    ```text
    // 0.12.0
    [iterable-linq-utility/groupBy] The "keySelector" function must be provided

    // 0.13.0
    [iterable-linq-utility/groupBy] The "keySelector" must be a function or a property key
    ```

The other operations (`filter`, `some`, `reduce`, the `result` of the joins, …) keep the message `The "<name>" function must be provided`.

## The validation messages name the argument, and more arguments are validated

The message of an invalid iterable named it `"sourceIterable"`, whatever the argument. It now uses the name of the argument in the signature: `"iterable"` for the source, `"other"`, `"inner"` or `"others"` for the other iterables. See [ADR 0030](https://github.com/Amebus/iterable-linq-utility/blob/main/docs/decisions/0030-validation-messages-name-the-argument.md). Code that matches the message exactly must be updated:

```text
// 0.12.0
[iterable-linq-utility/filter] The "sourceIterable" must be provided
[iterable-linq-utility/concat] The provided "sourceIterable" does not conform to the iterator protocol …
[iterable-linq-utility/reduce] The "sourceIterable" must not be empty when "reduce" has no seed

// 0.13.0
[iterable-linq-utility/filter] The "iterable" must be provided
[iterable-linq-utility/concat] The provided "others" does not conform to the iterator protocol …
[iterable-linq-utility/reduce] The "iterable" must not be empty when "reduce" has no seed
```

These arguments were accepted without a check, and now throw an `Error` when they are given and are not valid:

| Operation | Argument | Now required |
| --- | --- | --- |
| `min`, `max` | `comparer` | a function, a property, or a non-empty list of properties |
| `memoize` | `options` | an object, with `allowPartialMemoization` a boolean |
| `fromRange`, `Functions.range` | *start* and *end* | numbers (`NaN` is still an empty range) |
| `join` | `separator` | a string (`''` included) |

An argument is given when it is not `undefined`: `null` is a value, and is rejected. In 0.12.0 `min(null)` and `max(null)` compared with `<`, as without a comparer, and `join(null)` used `"null"` as the separator; leave the argument out instead.

```typescript
// 0.12.0: accepted
IterableLinq.from([1, 2]).join(0 as never);                                    // '102'
IterableLinq.from([1, 2]).min(null as never);                                  // 1
IterableLinq.from([1, 2]).memoize({ allowPartialMemoization: 'no' as never }); // partial memoization: 'no' is truthy

// 0.13.0
IterableLinq.from([1, 2]).join('0');                                           // '102'
IterableLinq.from([1, 2]).min();                                               // 1
IterableLinq.from([1, 2]).memoize({ allowPartialMemoization: true });          // the same partial memoization
```

`memoize({ allowPartialMemoization: undefined })` used the full memoization; it now uses the partial one, the default, as when the option is not given.
