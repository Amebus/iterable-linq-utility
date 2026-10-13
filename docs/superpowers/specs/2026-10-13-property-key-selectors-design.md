# Property keys in place of the selector functions — design

* Status: approved; Phase 0 done (gate passed 2026-10-13), Phase 1 in progress
* Date: 2026-10-13
* Branch: `feat/property-key-selectors`
* Issue: https://github.com/Amebus/iterable-linq-utility/issues/185
* Decision record: `docs/decisions/0025-property-keys-as-selectors.md` (new)

## Context

On an iterable of objects, most selectors only read a property:

```ts
from(orders).collectToMap(o => o.id);
from(orders).sum(o => o.price);
from(orders).groupBy(o => o.customer);
```

`min` and `max` already accept a property key in place of the function (`Comparer<T>`, `src/types/comparer.ts`, turned into a function by `toCompareFunction` in `src/utils/compare.ts`). The other operations that take a selector do not.

## Goals

* Every selector that reads a value from the element also accepts a property key (`string`, `symbol` or `number`), typed as a key of the element.
* `key` behaves exactly like `v => v[key]`: same result, same equality of the keys ([ADR 0024](../../decisions/0024-equality-of-the-operations-that-compare-values.md)), same errors.
* The result type follows the key: `map('name')` is `Iterable<T['name']>`.
* `func('p')` is not slower than `func(v => v.p)`, and `func(v => v.p)` is not slower than on `main`. Otherwise the issue is rejected (see §0).

## Non-goals

* Arrays of keys as a key selector, a path or a composite key: #186.
* `map` with an array of keys, to build an object: #187.
* Changes to `Comparer<T>`, `min` and `max`.
* Keys in place of predicates, reducers, taps, `forEach`, `sequenceEqual`'s `equals` and the `result` callback of the joins.

## Scope

| Operation | Selector | Key accepted | Example |
| --- | --- | --- | --- |
| `collectToMap` | `keySelector`, `valueSelector` | any key of `T` | `collectToMap('id')`, `collectToMap('id', 'name')`, `collectToMap('id', o => o.total)` |
| `distinct` | `keySelector` | any key of `T` | `distinct('email')` |
| `except`, `intersect`, `union` | `keySelector` | any key of `T` | `union(others, 'id')` |
| `flatMap` | `mapper` | keys whose value is an `Iterable` | `flatMap('children')` → `Iterable<C>` for `children: C[]` |
| `groupBy` | `keySelector` | any key of `T` | `groupBy('team')` → `Iterable<[T['team'], T[]]>` |
| `groupJoin`, `innerJoin` | `outerKey`, `innerKey` | any key of `T` / of `I`, with the same value type | `innerJoin(players, 'id', 'teamId', (t, p) => …)` |
| `map` | `mapper` | any key of `T` | `map('name')` → `Iterable<T['name']>` |
| `sum`, `average` | `selector` | keys whose value is a `number` | `sum('price')` |

`flatMap` is not in the table of the issue. It was added during the design, because `flatMap('children')` reads a value from the element just like `map('name')`.

## Decisions

| Topic | Decision | Rejected |
| --- | --- | --- |
| Typing | One extra overload per selector, `P extends keyof T` → `T[P]`. The joins and `collectToMap` get every function/key combination. | One signature with a `Selector<T>` union and a conditional result type: no overloads to multiply, but less readable compiler errors and a weaker check that the two join keys match. Same-kind-only combinations: fewer overloads, but mixing the forms needs a lambda. |
| Primitive element types | Allowed, as `v => v[key]` would be: `from(words).map('length')`, `from(pairs).map(0)`. Consistent with `Comparer<T>`, which accepts any `keyof T`. Autocompletion also offers the methods (`map('charAt')`). | `T extends object` only: loses `length` and diverges from `Comparer<T>`. Methods excluded: a more complex type, and no longer `v => v[key]`. |
| `null` or `undefined` element | The native `TypeError` of `v[key]` propagates unchanged as a callback error, and the source is closed ([ADR 0008](../../decisions/0008-error-handling-and-source-closing.md)). | A library error: diverges from `v => v[key]`, and costs a check per value. `v?.[key]`: hides bad data (an `undefined` group, `NaN` sums). |
| Implementation | **The inline read of `value[key]`, chosen by the prototype (§0)**: a Transformation gets an iterator class for the key, an Action one function per loop (selector and key), so the code of the function path stays the one of `main`. Resolving the key into `v => v[key]` (`toSelector`) was 2–10% slower than the lambda, and 2.5 times slower for `sum` when both forms reach the same call site. | Measuring after the rollout: if the issue is rejected, the work on 13 operations and the documentation is lost. |
| Go/no-go | A gate on a prototype of 4 operations, before the rollout (§0). If it fails, the issue is closed with the numbers. | Implementing everything and then measuring. |
| Validation | `Validations.throwIfNotSelector(value, name, operation)` accepts a function, a `string`, a `symbol` or a `number`, with no other check (`v['']` and `v[1.5]` are valid JavaScript). One message: `The "<name>" must be a function or a property key`. Only the operations in scope change their message. | Two messages, one for a missing and one for a wrong selector: two branches, and a text that does not mention the key. |
| Public types | `KeysOfType<T, V>` exported, for anyone who writes wrappers or extensions ([ADR 0003](../../decisions/0003-extension-api-instead-of-public-wrapper-class.md)) with the same signatures. `Comparer<T>` unchanged. | Internal only. Rewriting `Comparer<T>` on a common type: changes a released public type with no need. |

## Design

### 0. Prototype and go/no-go gate

The work is split into two phases. The rollout starts only if the prototype passes the gate.

**Phase 0: prototype.** It covers `map` (Transformation), `sum` (Action), `groupBy` (grouping on a `Map`) and `distinct` (keys in a `Set`), on the branch.

* Implement the key variant aiming at the best performance. Try the candidates of the Decisions table, `toSelector` and the inline read of `value[key]`, and keep the fastest per operation.
* Add the overloads, the validation and the specs of these 4 operations only, enough to measure real code. There is no documentation and no ADR yet.

**Measurement.** It runs outside Vitest, with the method of #181:

* one process per variant, then all the variants in one process, in both orders;
* a warm-up first, then counting over 1.5–2 s, checking each result;
* ns per value, at several sizes;
* `--trace-opt --trace-deopt` on the hot function;
* every measurement repeated 2–3 times, to know the noise.

| Comparison | Variants |
| --- | --- |
| A: key against lambda | `func('p')` against `func(v => v.p)`, both on the branch |
| B: lambda, branch against `main` | `func(v => v.p)` on the branch against `func(v => v.p)` on `main` (built from `git stash` / `git worktree`) |

A also runs with both forms in the same process, since a real application uses both. This is the polymorphic call site case of #152 and #177.

**Gate.** The changes are kept only if, for each of the 4 operations, both of these hold:

1. A: `func('p')` is at least as fast as `func(v => v.p)`, within the noise measured between repeated runs;
2. B: `func(v => v.p)` on the branch is at least as fast as on `main`, within the noise.

A single verified violation means one of these:

* a new attempt at the implementation of that operation;
* or the rejection of the issue: it is closed with the tables and the conclusion, the branch is abandoned, and a note goes on #181.

The decision is the user's, after reading the report.

**Phase 1: rollout.** Only after the gate passes, these follow: ADR 0025, the remaining 9 operations with the implementation that won, the benches, the documentation and the changeset (§1–§10). The other 9 operations repeat comparisons A and B in their benches (`property` group). A regression found there goes back to the user before the merge.

### 1. Types

`src/types/keysOfType.ts`, exported from `src/types/index.ts`, with JSDoc and `@since next`:

```ts
/**
 * The keys of `T` whose value is assignable to `V`.
 */
export type KeysOfType<T, V> = { [P in keyof T]-?: T[P] extends V ? P : never }[keyof T];
```

An optional property `price?: number` has the value type `number | undefined`, which is not assignable to `number`. So `sum('price')` must not compile, as `sum(o => o.price)` does not compile today. A type test pins this. If `-?` strips `undefined` from `T[P]` before the conditional, the definition changes until that test passes.

### 2. Utilities

`src/utils/selector.ts`, exported from `src/utils/index.ts`. `toSelector` was a candidate of §0; it lost to the inline read and is not in the library.

```ts
export function isPropertyKey(value: unknown): value is PropertyKey {
	const type = typeof value;
	return type === 'string' || type === 'symbol' || type === 'number';
}
```

`src/utils/validations.ts` gets this helper:

```ts
export function throwIfNotSelector(value: unknown, name: string, operation: string) {
	if (!isFunction(value) && !isPropertyKey(value))
		throw libraryError(operation, `The "${name}" must be a function or a property key`);
}
```

### 2a. Signatures

Raw functions are shown below. `IIterableLinqBase` repeats them without the `iterable`, and returns `IIterableLinq<…>` for the Transformations.

```ts
// map
map<T, R>(iterable: Iterable<T>, mapper: Mapper<T, R>): Iterable<R>;
map<T, P extends keyof T>(iterable: Iterable<T>, key: P): Iterable<T[P]>;

// flatMap
flatMap<T, R>(iterable: Iterable<T>, mapper: Mapper<T, Iterable<R>>): Iterable<R>;
flatMap<T, P extends KeysOfType<T, Iterable<unknown>>>(iterable: Iterable<T>, key: P): Iterable<T[P] extends Iterable<infer R> ? R : never>;

// sum (average: same shape, returns number | undefined)
sum(iterable: Iterable<number>): number;
sum<T>(iterable: Iterable<T>, selector: Mapper<T, number> | undefined): number;
sum<T>(iterable: Iterable<T>, key: KeysOfType<T, number>): number;

// groupBy
groupBy<T, K>(iterable: Iterable<T>, keySelector: Mapper<T, K>): Iterable<[K, T[]]>;
groupBy<T, P extends keyof T>(iterable: Iterable<T>, key: P): Iterable<[T[P], T[]]>;

// distinct (except, intersect, union: same, after `other`)
distinct<T, K>(iterable: Iterable<T>, keySelector?: Mapper<T, K>): Iterable<T>;
distinct<T>(iterable: Iterable<T>, key: keyof T): Iterable<T>;

// collectToMap: key/value as function or key
collectToMap<T, K>(iterable, keySelector: Mapper<T, K>): Map<K, T>;
collectToMap<T, P extends keyof T>(iterable, key: P): Map<T[P], T>;
collectToMap<T, K, V>(iterable, keySelector: Mapper<T, K>, valueSelector: Mapper<T, V> | undefined): Map<K, V>;
collectToMap<T, K, Q extends keyof T>(iterable, keySelector: Mapper<T, K>, valueKey: Q): Map<K, T[Q]>;
collectToMap<T, P extends keyof T, V>(iterable, key: P, valueSelector: Mapper<T, V> | undefined): Map<T[P], V>;
collectToMap<T, P extends keyof T, Q extends keyof T>(iterable, key: P, valueKey: Q): Map<T[P], T[Q]>;

// innerJoin (groupJoin: same, with result: (outer: T, inners: I[]) => R)
innerJoin<T, I, K, R>(iterable, inner, outerKey: Mapper<T, K>, innerKey: Mapper<I, K>, result): Iterable<R>;
innerJoin<T, I, PO extends keyof T, R>(iterable, inner, outerKey: PO, innerKey: Mapper<I, T[PO]>, result): Iterable<R>;
innerJoin<T, I, K, PI extends KeysOfType<I, K>, R>(iterable, inner, outerKey: Mapper<T, K>, innerKey: PI, result): Iterable<R>;
innerJoin<T, I, PO extends keyof T, PI extends KeysOfType<I, T[PO]>, R>(iterable, inner, outerKey: PO, innerKey: PI, result): Iterable<R>;
```

The function overload stays first, so a lambda gets its parameter contextually typed as today. Overload order and the exact generic constraints may change during implementation if the type tests require it.

### 3. Operations

Each operation applies the same change:

1. It adds the overloads from §2a to `src/functions/<op>.ts`, and widens the implementation signature to `Mapper<T, K> | PropertyKey`.
2. It replaces `throwIfNotFunction(selector, …)` with `throwIfNotSelector(selector, …)`, then, when `isPropertyKey(selector)`, reads `value[key]` inline: in an iterator class for the key (Transformations), or in a function of its own (Actions, where the loop of the selector also gets its own function: a `return` before a loop, in the same function, slowed that loop by 14%). Optional selectors (`distinct`, `except`, `intersect`, `union`) and the `sum`/`average` without a selector keep their `undefined` branch.
3. It adds the same overloads to `IIterableLinqBase` (`src/types/iterableLinq.ts`) and to the delegating method in `src/linqIterable.ts`, with the overloads next to each other.
4. It adds JSDoc to every overload: a summary, `@operation`, `@param`, `@returns`, `@throws`, `@example` with a key, and `@since next` on the new overloads ([ADR 0012](../../decisions/0012-trunk-based-releases-with-changesets.md)).

`InnerLookupIterator` and `OtherKeysIterator` (`src/iterators/`) keep receiving a `Mapper`.

### 4. Errors

* An invalid selector (`null`, an object, a boolean) is rejected when the operation is called, with `[iterable-linq-utility/<op>] The "<name>" must be a function or a property key` ([ADR 0020](../../decisions/0020-error-messages-of-the-library.md)).
* An element that is `null` or `undefined` makes `v[key]` throw a `TypeError` inside the existing `try`/`catch` around the callback. In the Transformations, `closeAfterCallbackError()` closes the source. In the Actions, `for…of` closes it. The error propagates unchanged.

### 5. Tests

These follow [ADR 0018](../../decisions/0018-shared-test-sources.md) and [ADR 0019](../../decisions/0019-full-test-coverage-of-the-library.md).

* `test/utils/selector.spec.ts` covers `isPropertyKey`.
* `test/functions/<op>.spec.ts`, for each operation in scope:
  * a key gives the same result as the equivalent lambda;
  * a `symbol` key and a `number` key work;
  * a `null` element throws a `TypeError` and closes the source;
  * an invalid selector gives the full message.
* `test/linqIterableWrapper/<op>.spec.ts` checks the delegation with a key.
* Type tests (`expectTypeOf`, or `@ts-expect-error`):
  * `map('name')` is `Iterable<string>`;
  * `groupBy('team')` gives the key type;
  * `sum('name')` and `sum` on an optional `number` do not compile;
  * `innerJoin` with keys of different value types does not compile;
  * `flatMap('children')` gives the element type.
* A source of objects used by several specs goes in `test/_helpers/generators/`, with its own spec.
* `pnpm test:coverage` stays at 100%.

### 6. Benchmarks and measurement

* The bench of each operation in scope gets a `property` group. It compares the key variant with a native `for…of` that reads `v[key]`, registered as described in `.agents/skills/operation/references/bench.md` and `test/bench/helpers.ts` ([ADR 0021](../../decisions/0021-benchmark-standards.md), [ADR 0022](../../decisions/0022-benchmark-scenarios-in-practice.md)).
* The standalone measurement and the gate are those of §0.
* The prototype's script stays in the scratchpad unless the user asks to add it to the repository (see the open point of #181 about `scripts/bench-isolate.ts`).
* The tables of comparisons A and B, and the decision, go in the pull request, with a comment on #181.

### 7. Documentation

* `documentation/docs/api-reference/`: the key overload and an example on the page of each of the 13 operations ([ADR 0013](../../decisions/0013-documentation-versions-between-releases.md)).
* `documentation/docs/basic-concepts.md` gets a new `## Selectors` section that covers:
  * a function or a property key, with `key` equivalent to `v => v[key]`;
  * the index, which is not passed;
  * `null` elements;
  * where keys are not accepted;
  * the link to `Comparer` for `min` and `max`.
* `KeysOfType` is in the API reference of the types, if a page lists them.

### 8. ADR 0025: property keys as selectors

The ADR is written through the `adr` skill, in MADR format. It records:

* the rule: a selector that reads a value from the element also accepts a property key, with `key` equivalent to `v => v[key]`. The key keeps the equality of the keys ([ADR 0024](../../decisions/0024-equality-of-the-operations-that-compare-values.md)), the errors of [ADR 0008](../../decisions/0008-error-handling-and-source-closing.md), and does not receive the index;
* the relation to `Comparer<T>`, the precedent: a key there compares with `<`, here it reads a value;
* where the rule does not apply: predicates, reducers, taps, `forEach`, `equals`, the `result` of the joins;
* the typing with separate overloads, primitive element types allowed, and `KeysOfType`;
* the implementation, resolved at the call, with inline loops only when measured;
* the compatibility with #167 (an options object after the selectors is not a property key, so the overloads stay unambiguous) and with #114 (a data-last `map('name')` has one argument, data-first has two);
* the rejected options from the Decisions table above.

### 9. Instructions in sync

These follow the "Keeping the instructions in sync" section of `AGENTS.md`:

* `AGENTS.md` gets a Rules line: a selector that reads a value from the element also accepts a property key, read inline with its own iterator class or loop function, and validated with `throwIfNotSelector` (ADR 0025).
* `.agents/skills/operation/SKILL.md` and its `references/` (`jsdoc.md` and `tests.md`, if they show selectors) get the same rule.
* `documentation/docs/how-to-contribute.md` gets the same rule.

### 10. Release

A `minor` changeset that lists:

* the new overloads;
* `KeysOfType`;
* the changed validation messages of the operations in scope.

## Done when

* [ ] Prototype of `map`, `sum`, `groupBy` and `distinct`, comparisons A and B, the gate passed and the user's decision to go on. If the gate fails: the issue is closed with the numbers, and nothing below applies.
* [ ] ADR 0025 accepted, and listed in `docs/decisions/README.md`
* [ ] Overloads, JSDoc and validation for the 13 operations, on the raw functions and on the chain
* [ ] Specs (raw and chain), type tests, coverage at 100%
* [ ] A `property` bench group per operation, and the standalone measurement reported in the pull request
* [ ] The API reference, Basic Concepts › Selectors, and the instructions in sync
* [ ] A `minor` changeset
* [ ] Every check of `AGENTS.md` green in the devcontainer
