# Wrapper extension API — design

* Status: proposed
* Date: 2026-09-27
* Branch: `chore/modernize-deps-and-test-helpers`
* Release: 0.1.0 (breaking)
* Decision record: `docs/decisions/0003-extension-api-instead-of-public-wrapper-class.md`

## Context

`src/index.ts` exports the class `IterableLinqWrapper`, the implementation behind every `IIterableLinq` chain. Exporting it causes three problems:

* It bypasses validation. `from()` validates its input, but the constructor does not, so `new IterableLinqWrapper(null)` builds a chain that fails later with an unclear `TypeError`.
* It freezes the implementation. `instanceof IterableLinqWrapper`, subclasses and prototype edits make the class name and shape part of the public contract. Renaming it, splitting it (for example into sync and async wrappers when `AsyncIterable` support arrives), or generating its methods becomes a breaking change.
* It leaks internals. The published `.d.ts` shows its private members.

The class is also today's only extension point. ADR 0001 and ADR 0002 list "extensibility into projects using the library thanks to typescript module augmentation" as a decision driver, and adding a method to every chain means writing to the class prototype.

Release 0.1.0 is unpublished and already breaking, so hiding the class now costs one more line in the release notes. Hiding it later would be a separate breaking release.

## Goals

* Chains can be created only through the factories (`from`, `fromRange`, `repeat`, `empty`), so validation always runs.
* A supported, explicit way to add operators to every chain, keeping the module augmentation workflow.
* A way to recognise a chain that does not depend on `instanceof` or on a single copy of the library.
* The class becomes an internal detail that can change without breaking users.

## Non-goals

* Removing or overriding extensions. There is no `unextend` and no override option.
* Typing the element type `T` inside an extension's implementation (see "Typing limits").
* Changing the fluent API.

## Public API

Both functions live in a new module, `src/extension.ts`, and are exported from the library root.

### `isIterableLinq`

```ts
export function isIterableLinq(value: unknown): value is IIterableLinq<unknown>;
```

* It returns `true` when `value` carries the brand `Symbol.for('iterable-linq-utility.IIterableLinq')`, which is set on the wrapper prototype.
* `Symbol.for` uses the global symbol registry, so the check also works when two copies of the library are installed. `instanceof` fails in that case.
* It returns `false` for `null`, `undefined`, primitives, arrays, plain objects and iterables that are not chains.

### `extend`

```ts
export function extend<K extends keyof IIterableLinq<unknown>>(
	name: K,
	implementation: (this: IIterableLinq<unknown>, ...args: any[]) => unknown
): void;
```

* It adds `implementation` as the method `name` of every chain, including chains created before the call.
* Constraining `K` to `keyof IIterableLinq` means the user must augment the interface first; a name that was not declared is a compile error. The intended use:

  ```ts
  import { extend, from, type IIterableLinq } from 'iterable-linq-utility';

  declare module 'iterable-linq-utility' {
  	interface IIterableLinq<T> {
  		chunk(size: number): IIterableLinq<T[]>;
  	}
  }

  extend('chunk', function (size: number) {
  	const source = this;
  	return from({
  		*[Symbol.iterator]() {
  			let chunk: unknown[] = [];
  			for (const value of source) {
  				chunk.push(value);
  				if (chunk.length === size) {
  					yield chunk;
  					chunk = [];
  				}
  			}
  			if (chunk.length > 0)
  				yield chunk;
  		}
  	});
  });

  from([1, 2, 3, 4, 5]).chunk(2).collectToArray(); // [[1, 2], [3, 4], [5]]
  ```

* Runtime checks. Each one throws an `Error` through `Validations`:
  * `name` must be a non-empty string;
  * `implementation` must be a function;
  * `name` must not already exist on a chain. This rejects the built-in methods (`map`, `filter`, …), a name registered earlier and members of `Object.prototype` (`toString`, `constructor`, …).
* The method is defined on the internal prototype as a non-enumerable, non-writable, configurable property. Unlike class methods it is not writable, so a plain assignment cannot silently replace it; being configurable lets the tests remove it.

### Removed export

* `IterableLinqWrapper` is no longer exported. It stays in `src/linqIterable.ts` as an internal class. Its prototype receives the brand symbol and the extended methods.

### Unchanged

* `IIterableLinq` stays in `src/types` and is exported from the root.
* The factories and the `Functions` namespace do not change.

## Typing limits

* Inside `implementation`, `this` is `IIterableLinq<unknown>`. A function registered by name cannot carry the chain's element type `T`, so the implementation works with `unknown` values.
* The method as seen by callers is typed by the user's augmentation and keeps its generics. In the example above, `from([1, 2]).chunk(2)` is `IIterableLinq<number[]>`.
* The compiler does not check that `implementation` matches the augmented signature. That responsibility stays with the user, as with any prototype extension.

## Behaviour to document

* Registering the same name twice throws. This includes a module that is evaluated twice (hot module replacement, test runners that re-import modules), so extensions should be registered once, at application start-up.
* Extensions are global to the library instance: every chain in the process gets them.

## Testing

A new file, `test/extension.spec.ts`:

* `extend` adds a method visible on chains created before and after the call;
* the `chunk` example works in a chain and gives `[[1, 2], [3, 4], [5]]`;
* `extend` throws for a built-in name (`map`), for a second registration of the same name, and for `toString`;
* `extend` throws for an empty name and for an `implementation` that is not a function;
* `isIterableLinq` is `true` for the results of `from`, `fromRange`, `repeat`, `empty` and of a transformation (`map`), and `false` for `[]`, `null`, `{}`, a string and a generator;
* a type test: `extend('notDeclared', …)` under `// @ts-expect-error`. `pnpm typecheck` fails if the constraint is lost.

Test isolation: an extension lives for the whole test process. Each test uses a unique name, and an `afterEach` deletes the added names from the prototype. It reaches the prototype through `Object.getPrototypeOf(from([]))`, so no test-only export is needed.

`test/from.spec.ts` uses `isIterableLinq` instead of `toBeInstanceOf(IterableLinq.IterableLinqWrapper)`.

## Documentation

* A new page, `documentation/docs/advanced-concepts/extending.md`, with the augmentation + `extend` example, the typing limits and the "register once" rule. It is linked from `documentation/docs/advanced-concepts/index.md`.
* ADR `docs/decisions/0003-extension-api-instead-of-public-wrapper-class.md` records the options and the decision.
* JSDoc on `extend` and `isIterableLinq`.

## Breaking change (0.1.0)

`IterableLinqWrapper` is no longer exported:
* use `isIterableLinq(x)` instead of `x instanceof IterableLinqWrapper`;
* use `extend(name, implementation)` instead of editing the prototype.
