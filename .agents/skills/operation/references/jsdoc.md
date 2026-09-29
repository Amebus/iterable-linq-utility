# JSDoc templates

`check:structure` requires a summary, `@operation`, `@returns`, `@example`, `@since` and one `@param` per parameter, on the raw function and on the chain method (each overload has its own JSDoc; the implementation signature does not). Add `@throws` whenever the operation validates an input. `tsdoc.json` registers `@operation` and `@since`; the linter checks the syntax.

New APIs always use `@since next`: the release replaces it with the version, and `check:since` rejects a version that is not released yet.

## Raw function (`src/functions/<name>.ts`)

The first `@param` is always `iterable`. The example uses `Functions.<name>`.

```ts
/**
 * Lazily transforms each value with `mapper`.
 * If `mapper` throws, the source is closed and the error propagates.
 * @operation `Transformation`
 * @param iterable - the source `Iterable`
 * @param mapper - called with each value and its index; returns the new value
 * @returns a lazy, re-runnable `Iterable` of the mapped values
 * @throws Error if `iterable` is missing or does not implement `[Symbol.iterator]`, or if `mapper` is not a function
 * @example
 * ```ts
 * Array.from(Functions.map([1, 2, 3], v => v * 10)); // [10, 20, 30]
 * ```
 * @since next
 */
```

## Chain method (`IIterableLinqBase` in `src/types/iterableLinq.ts`)

No `iterable` parameter. The example uses `IterableLinq.from(…)`; a Transformation returns "a new chain".

```ts
/**
 * Transforms each value with `mapper`.
 * If `mapper` throws, the source is closed and the error propagates.
 * @operation `Transformation`
 * @param mapper - called with each value and its index; returns the new value
 * @returns a new chain with the mapped values
 * @throws Error if `mapper` is not a function
 * @example
 * ```ts
 * IterableLinq.from([1, 2, 3, 4]).map(v => v * 10).collectToArray(); // [10, 20, 30, 40]
 * ```
 * @since next
 */
```

For an Action: `@operation \`Action\``, and the summary starts with "Runs the chain and …" on the chain method.
