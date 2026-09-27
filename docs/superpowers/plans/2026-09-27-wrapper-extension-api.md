# Wrapper Extension API Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hide the `IterableLinqWrapper` class and expose `isIterableLinq`, `extend` and `override` as the supported way to recognise and extend chains.

**Architecture:**
* A new module, `src/extension.ts`, owns the brand symbol and the three public functions. It writes to the prototype of the internal `IterableLinqWrapper` class.
* `src/index.ts` stops exporting the class and exports the three functions.
* Users type their additions with module augmentation of `IIterableLinq`. This was verified to work through the `export *` re-export chain of `src/types`, generics included.

**Tech Stack:** TypeScript 6.0, Vitest 5 (`expectTypeOf`, `@ts-expect-error` checked by `pnpm typecheck`), ESLint 10, MkDocs Material docs.

**Spec:** `docs/superpowers/specs/2026-09-27-wrapper-extension-api-design.md` (ADR: `docs/decisions/0003-extension-api-instead-of-public-wrapper-class.md`)

## Global Constraints

- Run every command in the devcontainer, or from the host with `docker run --rm -v "$PWD":/w -w /w node-alpine:24.20.0 sh -c '<command>'`.
- Every task ends with `pnpm lint && pnpm typecheck && npx tsc -p tsconfig.build.json --noEmit && pnpm test` green.
- Brand: `Symbol.for('iterable-linq-utility.IIterableLinq')`.
- Validation errors are `Error`, thrown through `Validations` in `src/utils/validations.ts`.
- Extended and overridden methods are defined with `{ enumerable: false, writable: false, configurable: true }`.
- `keyof IIterableLinq<unknown>` constrains the `name` of `extend`/`override`.
- `IterableLinqWrapper` must not be reachable from `src/index.ts`.
- Commits are in English, end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`, go on `chore/modernize-deps-and-test-helpers`, with no push.

## Review Focus

1. `extend` called with a name that exists only on `Object.prototype` (`hasOwnProperty`, `valueOf`) must throw, not shadow it. Test in Task 2.
2. `override` must not accept a name that exists only on `Object.prototype` (for example `toString`), even though `name in prototype` is true. The check uses own properties. Test in Task 3.
3. An extension that returns a chain built with `from(...)` must itself pass `isIterableLinq`, and be further chainable. Test in Task 2.
4. `tapChainCreation` passes `this` to the user callback. After this change the callback still receives an object for which `isIterableLinq` is `true`. Test in Task 1.
5. Overriding a library method must not change the behaviour of other library methods that do not call it (for example `filter` after `override('map')`). Test in Task 3.

---

### Task 1: Brand, `isIterableLinq`, class no longer exported

**Files:**
- Create: `src/extension.ts`, `src/iterableLinqBrand.ts`
- Modify: `src/linqIterable.ts`, `src/index.ts`, `test/from.spec.ts`
- Test: `test/extension.spec.ts`

**Interfaces:**
- Produces:
  - `export const iterableLinqBrand: unique symbol = Symbol.for('iterable-linq-utility.IIterableLinq')`, internal, in its own module `src/iterableLinqBrand.ts`. Both `linqIterable.ts` and `extension.ts` import it, so there is no import cycle;
  - `export function isIterableLinq(value: unknown): value is IIterableLinq<unknown>` (public);
  - `function wrapperPrototype(): object` (internal, in `src/extension.ts`), which returns `IterableLinqWrapper.prototype`.
- `IterableLinqWrapper.prototype[iterableLinqBrand] === true` is set in `src/linqIterable.ts`, right after the class declaration, with `Object.defineProperty(…, { value: true, enumerable: false, writable: false, configurable: false })`. `linqIterable.ts` must not import `extension.ts`.

- [ ] **Step 1: Write the failing tests**

`test/extension.spec.ts`, `describe('isIterableLinq')`:
- `test.each` over `from([1])`, `fromRange(3)`, `repeat(1, 2)`, `empty()`, `from([1]).map(v => v)`: `expect(isIterableLinq(chain)).toBe(true)`;
- `test.each` over `[]`, `null`, `undefined`, `{}`, `'abc'`, `(function* () {})()`, `new Set([1])`: `false`;
- `tapChainCreation passes a chain`: inside `from([1]).tapChainCreation(c => { seen = isIterableLinq(c); return unit(); })`, `seen === true`;
- `not exported`: `expect('IterableLinqWrapper' in IterableLinq).toBe(false)`, with `import * as IterableLinq from '@/index'`.

In `test/from.spec.ts`, the two `expect(r).toBeInstanceOf(IterableLinq.IterableLinqWrapper)` become `expect(IterableLinq.isIterableLinq(r)).toBe(true)`.

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run test/extension.spec.ts test/from.spec.ts`. Expected: FAIL (`isIterableLinq` is not a function, and `IterableLinqWrapper` is still exported).

- [ ] **Step 3: Implement**

- Brand on the prototype as described in Interfaces.
- `isIterableLinq`: `typeof value === 'object' && value !== null && (value as any)[iterableLinqBrand] === true`.
- `src/index.ts`:
  - remove `IterableLinqWrapper` from the export block;
  - add `export { isIterableLinq } from './extension';`.
- JSDoc on `isIterableLinq`: what it checks, and why not `instanceof`.

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm lint && pnpm typecheck && npx tsc -p tsconfig.build.json --noEmit && pnpm test`. Expected: all green. `grep -n IterableLinqWrapper dist/index.d.ts` after `pnpm build` gives nothing.

- [ ] **Step 5: Commit**

Message: `feat!: hide IterableLinqWrapper, add isIterableLinq`. The body contains `BREAKING CHANGE: IterableLinqWrapper is no longer exported; use isIterableLinq instead of instanceof.`

---

### Task 2: `extend`

**Files:**
- Modify: `src/extension.ts`, `src/utils/validations.ts`, `src/index.ts`
- Test: `test/extension.spec.ts`

**Interfaces:**
- Consumes: `wrapperPrototype()`, `isIterableLinq` (Task 1).
- Produces:
  - `export function extend<K extends keyof IIterableLinq<unknown>>(name: K, implementation: (this: IIterableLinq<unknown>, ...args: any[]) => unknown): void`, exported from the root;
  - `Validations.throwIfNotNonEmptyString(value: unknown, name: string)`, with message `` `The "${name}" parameter must be a non-empty string` ``;
  - internal `function defineChainMethod(name: string, implementation: Function): void` in `src/extension.ts`, which applies the descriptor from Global Constraints. It is reused by Task 3.

- [ ] **Step 1: Write the failing tests**

At the top of `test/extension.spec.ts`, the module augmentation for the test methods:

```ts
declare module '@/types' {
	interface IIterableLinq<T> {
		chunk(size: number): IIterableLinq<T[]>;
		double(): IIterableLinq<number>;
		twice(): IIterableLinq<number>;
	}
}
```

Isolation:
- `const proto = Object.getPrototypeOf(from([]))`;
- `afterEach(() => { for (const name of ['chunk', 'double', 'twice']) if (Object.prototype.hasOwnProperty.call(proto, name)) delete proto[name]; })`.

`describe('extend')`:
- `adds a method to chains created before and after`: `const before = from([1, 2])`, then `extend('double', function () { return from(this).map(v => (v as number) * 2); })`. Both `before.double().collectToArray()` and `from([3]).double().collectToArray()` give `[2, 4]` and `[6]`.
- `chunk example`: the spec's implementation; `from([1, 2, 3, 4, 5]).chunk(2).collectToArray()` equals `[[1, 2], [3, 4], [5]]`.
- `the result is still a chain` (Review Focus 3): `isIterableLinq(from([1]).double())` is `true`, and `from([1]).double().map(v => v + 1).collectToArray()` equals `[3]`.
- `throws for a library method`: `expect(() => extend('map', function () { return this; })).toThrow(Error)`.
- `throws for a second registration`: `extend('double', …)` twice; the second one throws.
- `throws for Object.prototype members` (Review Focus 1): `extend('toString' as any, …)` and `extend('hasOwnProperty' as any, …)` throw.
- `throws for invalid input`: `extend('' as any, …)` and `extend('double', 42 as any)` throw.
- `extended methods are not enumerable and not writable`: after `extend('double', …)`, `Object.getOwnPropertyDescriptor(proto, 'double')` matches `{ enumerable: false, writable: false, configurable: true }`.
- Type test: `// @ts-expect-error 'notDeclared' is not a key of IIterableLinq` on `extend('notDeclared', function () { return this; })`, wrapped in `if (false)` so it never runs.

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run test/extension.spec.ts` and `pnpm typecheck`. Expected:
- FAIL: `extend` is not exported;
- typecheck: an error on the missing import.

- [ ] **Step 3: Implement**

- First validate with `throwIfNotNonEmptyString(name, 'name')` and `throwIfNotFunction(implementation, 'implementation')`.
- Then the existence check: `name in proto`. It covers the whole prototype chain, including `Object.prototype`. When the name exists, throw `` Error(`"${name}" already exists on IIterableLinq: use override() to replace it`) ``.
- Finally `defineChainMethod`.
- Export `extend` from `src/index.ts`.
- JSDoc following the spec: augmentation first, register once at start-up, `this` typed as `IIterableLinq<unknown>`.

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm lint && pnpm typecheck && npx tsc -p tsconfig.build.json --noEmit && pnpm test`. Expected: all green, the `@ts-expect-error` used.

- [ ] **Step 5: Commit**

Message: `feat: extend() adds methods to every chain`.

---

### Task 3: `override`

**Files:**
- Modify: `src/extension.ts`, `src/index.ts`
- Test: `test/extension.spec.ts`

**Interfaces:**
- Consumes: `defineChainMethod`, `wrapperPrototype()`, `Validations.throwIfNotNonEmptyString` (Tasks 1–2).
- Produces: `export function override<K extends keyof IIterableLinq<unknown>>(name: K, implementation: (this: IIterableLinq<unknown>, ...args: any[]) => unknown): void`, exported from the root.

- [ ] **Step 1: Write the failing tests**

Isolation for library methods:
- `let savedMap: PropertyDescriptor | undefined` and `let savedFilter`, saved with `Object.getOwnPropertyDescriptor(proto, 'map' | 'filter')` in `beforeEach`;
- restored with `Object.defineProperty(proto, 'map', savedMap!)` in `afterEach`.

`describe('override')`:
- `replaces a library method on chains created before and after`: `const before = from([1, 2])`, then `override('map', function () { return from(['overridden']); })`. `before.map(v => v).collectToArray()` and `from([3]).map(v => v).collectToArray()` both equal `['overridden']`.
- `Functions.map is unaffected`: after the same override, `Functions.collectToArray(Functions.map([1], v => v + 1))` equals `[2]`.
- `other methods are unaffected` (Review Focus 5): after overriding `map`, `from([1, 2, 3]).filter(v => v > 1).collectToArray()` equals `[2, 3]`.
- `replaces a method added by extend`: `extend('twice', …)` then `override('twice', function () { return from([42]); })`; `from([1]).twice().collectToArray()` equals `[42]`.
- `throws for a name that does not exist`: `override('chunk', …)` without a previous `extend` throws, and the message contains `extend`.
- `throws for Object.prototype members` (Review Focus 2): `override('toString' as any, …)`, `override('constructor' as any, …)` and `override('hasOwnProperty' as any, …)` throw.
- `throws for invalid input`: `override('' as any, …)` and `override('map', 42 as any)` throw.
- Type test: `// @ts-expect-error` on `override('notDeclared', …)`, inside `if (false)`.

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run test/extension.spec.ts`. Expected: FAIL, because `override` is not exported.

- [ ] **Step 3: Implement**

- After the same validations as `extend`, the existence check: `Object.prototype.hasOwnProperty.call(proto, name) && name !== 'constructor'`. Own properties only, so `Object.prototype` members are rejected. Do not use `Object.hasOwn`: it is ES2022 and the build targets ES2019.
- When the name is missing, throw `` Error(`"${name}" is not a method of IIterableLinq: use extend() to add it`) ``.
- Then `defineChainMethod`.
- Export from `src/index.ts`. JSDoc: the migration case, and "only the fluent API changes, not `Functions`".

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm lint && pnpm typecheck && npx tsc -p tsconfig.build.json --noEmit && pnpm test`. Expected: all green, with the tests after the override tests still seeing the original `map` (restoration works).

- [ ] **Step 5: Commit**

Message: `feat: override() replaces existing chain methods`.

---

### Task 4: Documentation

**Files:**
- Create: `documentation/docs/advanced-concepts/extending.md`
- Modify: `documentation/mkdocs.yml` (nav), `documentation/docs/advanced-concepts/index.md` (a link), `docs/decisions/0003-extension-api-instead-of-public-wrapper-class.md` (`Status: accepted`), `docs/superpowers/specs/2026-09-27-wrapper-extension-api-design.md` (`Status: implemented`)

- [ ] **Step 1: Write `extending.md`**

Sections:
- "Recognising a chain": `isIterableLinq`, and why not `instanceof`.
- "Adding an operator": the augmentation with `declare module 'iterable-linq-utility'` plus the `extend` example with `chunk` from the spec.
- "Replacing an operator": `override`, the migration case where the library adds a method you had already added, and "only the fluent API, not `Functions`".
- "Rules and limits":
  - register once, at start-up (HMR);
  - `this` is `IIterableLinq<unknown>`;
  - the compiler does not check that the implementation matches the augmented signature;
  - extensions are global to the process.

- [ ] **Step 2: Nav and link**

- In `mkdocs.yml`, under `Advanced Concepts`, add `- Extending the API: advanced-concepts/extending.md`.
- In `advanced-concepts/index.md`, add a `## Extending the API` section with a one-line link to the page.

- [ ] **Step 3: Statuses and verification**

- ADR 0003 goes to `accepted`, and the spec goes to `implemented`.
- Run: `pnpm lint && pnpm typecheck && pnpm test && pnpm build`. Expected: green.
- `grep -n "IterableLinqWrapper" dist/index.d.ts` finds nothing.
- `grep -n "isIterableLinq\|extend\|override" dist/index.d.ts` finds all three.

- [ ] **Step 4: Commit**

Message: `docs: extending the fluent API with extend and override`.
