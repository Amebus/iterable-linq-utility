# Migrating to 0.13.0

Version 0.13.0 contains a breaking change. This page describes it, with the code to change when upgrading from 0.12.0.

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
