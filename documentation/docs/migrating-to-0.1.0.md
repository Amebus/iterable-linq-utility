# Migrating to 0.1.0

Version 0.1.0 contains breaking changes. This page lists each one, with the code to change when upgrading from 0.0.16.

## `min` and `max` return `undefined` on an empty chain

In 0.0.16 they returned `null`. They now return `undefined`, and the return type is `T | undefined`.

```typescript
// 0.0.16
IterableLinq.empty<number>().max(); // null

// 0.1.0
IterableLinq.empty<number>().max(); // undefined
```

Replace checks like `result === null` with `result === undefined`, or use `result ?? fallback`.

## `fromRange` and `Functions.range` take an options object

The positional `step` and `reverse` arguments are gone. Pass them in an options object, always as the last argument.

```typescript
// 0.0.16
IterableLinq.fromRange(0, 6, 2);
IterableLinq.fromRange(3, true);
IterableLinq.fromRange(0, 6, 2, true);

// 0.1.0
IterableLinq.fromRange(0, 6, { step: 2 });
IterableLinq.fromRange(3, { reverse: true });
IterableLinq.fromRange(0, 6, { step: 2, reverse: true });
```

The options type is exported as `IRangeOptions`.

## `step` is validated

In 0.0.16 a `step` of `0` was replaced by `1`. `fromRange` and `Functions.range` now throw an `Error` when `step` is `0`, `NaN` or infinite, and when the options are not an object.

```typescript
IterableLinq.fromRange(0, 3, { step: 0 }); // throws
```

## `repeat` is validated

`repeat` and `Functions.repeat` now throw an `Error` with a clear message when the count is negative, not an integer, `NaN` or `Infinity`. In 0.0.16 some of these values threw unrelated errors.

```typescript
IterableLinq.repeat('a', -1);  // throws: The "count" parameter must be a non-negative integer
IterableLinq.repeat('a', 1.5); // throws
```

## `Unit` is nominal

In 0.0.16 `Unit` was an empty class, so the compiler accepted any object as a `Unit`. Now only `unit()` is a `Unit`: callbacks of `forEach`, `forEachAsync`, `tap` and `tapChain` must return `unit()`.

```typescript
// 0.0.16: compiled
IterableLinq.from([1, 2]).forEach(v => ({}));

// 0.1.0
IterableLinq.from([1, 2]).forEach(v => {
    console.log(v);
    return unit();
});
```

See [The Unit type](basic-concepts.md#the-unit-type).

## `forEachAsync` is sequential

In 0.0.16 `forEachAsync` started every callback at once. Now each callback starts after the previous one has settled, and the first rejection stops the iteration.

```typescript
await IterableLinq.from(['a', 'b']).forEachAsync(async file => { /* ... */ return unit(); });
// 0.0.16: start a, start b, end a, end b
// 0.1.0:  start a, end a, start b, end b
```

To keep running the callbacks in parallel, map the values to promises and wait for all of them:

```typescript
await Promise.all(IterableLinq.from(files).map(upload));
```

## `Functions` no longer exports option types

`Functions.IMemoizeOptions` is gone. Import the type from the package root:

```typescript
// 0.0.16
import { Functions } from 'iterable-linq-utility';
type Options = Functions.IMemoizeOptions;

// 0.1.0
import type { IMemoizeOptions } from 'iterable-linq-utility';
```

## `IterableLinqWrapper` is no longer exported

The class behind every chain is now internal. Use the factories and the extension API instead:

| 0.0.16                                          | 0.1.0                                                                 |
| ----------------------------------------------- | --------------------------------------------------------------------- |
| `new IterableLinqWrapper(iterable)`             | `from(iterable)`                                                      |
| `value instanceof IterableLinqWrapper`          | `isIterableLinq(value)`                                               |
| `IterableLinqWrapper.prototype.myMethod = …`    | `extend('myMethod', …)`, or `override` for an existing method        |

See [Extending the API](advanced-concepts/extending.md).
