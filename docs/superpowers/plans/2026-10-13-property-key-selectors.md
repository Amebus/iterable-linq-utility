# Property keys as selectors — implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every selector that reads a value from the element also accepts a property key (`map('name')`, `sum('price')`, `groupBy('team')` and so on). This lands only if a key is no slower than the equivalent lambda, and the lambda is no slower than on `main`.

**Architecture:** The work is in two phases with a go/no-go gate between them.

* **Phase 0** prototypes `map`, `sum`, `groupBy` and `distinct`, measures them outside Vitest, and **stops for the user's decision**.
* **Phase 1** runs only on "go". It covers ADR 0025, the remaining 9 operations, the benches, the docs and the changeset.

A key is resolved either once into `v => v[key]` (`toSelector`) or read inline. The prototype picks the faster one per operation.

**Tech Stack:** TypeScript 6, Vitest 5 (specs and benches), pnpm, Node 24 in the devcontainer, plain Node scripts for the standalone measurement.

**Spec:** `docs/superpowers/specs/2026-10-13-property-key-selectors-design.md`

## Global Constraints

- Run every `pnpm`/`node` command **inside the devcontainer** (`.devcontainer/`), never on the host. Copy scripts into the container with `docker cp`.
- **No commit, push or PR without the user's explicit OK** (AGENTS.md). The "Commit" steps below are ready-made messages to run once the user has authorised commits. Use Conventional Commits with a body, plus `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Branch: `feat/property-key-selectors`, created from `main`.
- A property key is `typeof` `'string' | 'symbol' | 'number'`, with no other check.
- The validation message is exactly `The "<name>" must be a function or a property key`, with the `[iterable-linq-utility/<op>]` prefix. Use `<name>` as today: `mapper`, `selector`, `keySelector`, `valueSelector`, `outerKey`, `innerKey`.
- `key` ≡ `v => v[key]`:
  - the index is not passed;
  - a `null`/`undefined` element throws the native `TypeError` unchanged, and the source is closed;
  - key equality is `SameValueZero`.
- The function overload comes first. The key overloads come right after it, both on the raw function and on `IIterableLinqBase`.
- JSDoc on every new overload: summary, `@operation`, `@param`, `@returns`, `@throws`, `@example` with a key, `@since next`.
- `pnpm test:coverage` stays at 100%.
- Do not change `version`, `CHANGELOG.md`, dependencies or the toolchain.
- Gate: on each operation, for both comparisons A (key against lambda) and B (lambda, branch against `main`), no loss beyond the noise measured between repeated runs.

## Review Focus

1. **Key `0`**: `map(pairs, 0)` and `distinct(xs, 0)` must use the key, not treat it as "no selector". Never test a selector for truthiness. Owned by Tasks 1, 2 and 5.
2. **Keys on the prototype chain and getters**: `map(sets, 'size')` and a class getter must work, as `v[key]` does. Owned by Task 2.
3. **`sum(xs, undefined)`** still means "no selector", and `sum` of numbers is unchanged. Owned by Task 3.
4. **A `null` element in an Action** (`sum`) closes the source through `for…of`, and in a Transformation through `closeAfterCallbackError`. Owned by Tasks 2–5.
5. **The lambda path must not slow down** because of the new branch or a now-polymorphic call site. Owned by Task 6 (comparison B, and both forms in one process).

---

## Phase 0: prototype and gate

### Task 0: Branch

- [ ] **Step 1:** `git switch -c feat/property-key-selectors main`. Expected: the branch is created, and the tree is clean apart from the untracked spec and plan.

### Task 1: `KeysOfType`, selector utilities, `throwIfNotSelector`, a generic `closableSource`

**Files:**
- Create: `src/types/keysOfType.ts`, `src/utils/selector.ts`, `test/utils/selector.spec.ts`, `test/types/keysOfType.spec.ts`
- Modify: `src/types/index.ts`, `src/utils/index.ts`, `src/utils/validations.ts`, `test/utils/validations.spec.ts`, `test/_helpers/generators/closableSource.ts` (+ its spec)

**Interfaces:**
- Produces:
  - `export type KeysOfType<T, V>`: the keys of `T` whose value type is assignable to `V`. An optional `number` property is **not** a `KeysOfType<T, number>`.
  - `isPropertyKey(value: unknown): value is PropertyKey`
  - `toSelector<T, R>(selector: Mapper<T, R> | PropertyKey): Mapper<T, R>`: the function unchanged, or `(value) => value[key]`.
  - `Validations.throwIfNotSelector(value: unknown, name: string, operation: string): void`
  - `closableSource<T>(values: T[]): { state: { closed: boolean }; iterable: Iterable<T> }` (generic now; the existing callers are unchanged).

- [ ] **Step 1: Write the failing tests.**
  - `selector.spec.ts`:
    - `isPropertyKey` is true for `'a'`, `''`, `0`, `1.5`, `NaN`, `Symbol()`;
    - `isPropertyKey` is false for `undefined`, `null`, `{}`, `true`, `() => 1`, `10n`;
    - `toSelector(fn)` returns the same function (`toBe`);
    - `toSelector('a')({ a: 1 })` is `1`;
    - `toSelector(0)(['x'])` is `'x'`;
    - `toSelector(sym)({ [sym]: 2 })` is `2`;
    - `toSelector('size')(new Set([1, 2]))` is `2`;
    - `toSelector('a')(null)` throws `TypeError`.
  - `validations.spec.ts`, `describe('throwIfNotSelector')`:
    - it accepts an arrow function, `'id'`, `''`, `0` and `Symbol()`;
    - it rejects `undefined`, `null`, `{}`, `true` and `10n` with `prefixed('op', 'The "keySelector" must be a function or a property key')`.
  - `test/types/keysOfType.spec.ts`, with `type R = { id: number; name: string; price?: number; tags: string[] }`:
    - `KeysOfType<R, number>` is `'id'`;
    - `KeysOfType<R, string>` is `'name'`;
    - `KeysOfType<R, Iterable<unknown>>` is `'name' | 'tags'` (a string is iterable).
  - `closableSource.spec.ts`: `closableSource([{ a: 1 }])` yields the object and sets `closed` on `return()`.
- [ ] **Step 2:** Run `pnpm vitest run test/utils test/types test/_helpers`. Expected: FAIL (modules or functions missing).
- [ ] **Step 3: Implement.**
  - Write the three exports with the signatures above, following spec §1–2. Export `KeysOfType` with JSDoc and `@since next`.
  - If the `price?` assertion fails with `-?` in the mapped type, change the definition until it passes. For example, test `T[P] extends V` on `{ [P in keyof T]: … }[keyof T]` and `Exclude` the `undefined`.
  - Make `closableSource` generic.
- [ ] **Step 4:** Run `pnpm vitest run test/utils test/types test/_helpers && pnpm typecheck && pnpm lint`. Expected: PASS.
- [ ] **Step 5: Commit** with `feat(utils): add property key selectors helpers`. The body names `KeysOfType`, `toSelector`, `throwIfNotSelector` and refs #185.

### Task 2: `map` with a key

**Files:**
- Modify: `src/functions/map.ts`, `src/types/iterableLinq.ts` (`map` on `IIterableLinqBase`), `src/linqIterable.ts`, `test/functions/map.spec.ts`, `test/linqIterableWrapper/map.spec.ts`, `test/bench/functions/map.bench.ts`

**Interfaces:**
- Consumes: `toSelector` and `throwIfNotSelector` (Task 1), `closableSource<T>` (Task 1).
- Produces:
  - `map<T, P extends keyof T>(iterable: Iterable<T>, key: P): Iterable<T[P]>`
  - chain: `map<P extends keyof T>(key: P): IIterableLinq<T[P]>`

- [ ] **Step 1: Write the failing tests** in `test/functions/map.spec.ts`.
  - `map(objs, 'name')` equals `map(objs, o => o.name)`.
  - `map([['a', 1]], 0)` gives `['a']`.
  - `map([new Set([1, 2])], 'size')` gives `[2]`.
  - A class with `get full()` works with `map(xs, 'full')`.
  - A symbol key works.
  - `map(closableSource([{ a: 1 }, null]).iterable, 'a')`, collected, throws `TypeError` and leaves `state.closed === true`.
  - `map(xs, true as any)` throws `[iterable-linq-utility/map] The "mapper" must be a function or a property key`.
  - In the existing "map without mapper" table, remove nothing. `{}` and `null` still throw.
  - Wrapper spec: `from(objs).map('name').collectToArray()`, and `expectTypeOf(from(objs).map('name')).toEqualTypeOf<IIterableLinq<string>>()`.
- [ ] **Step 2:** Run `pnpm vitest run test/functions/map.spec.ts test/linqIterableWrapper/map.spec.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.**
  - Add the overloads, plus the JSDoc of the key overload (`@since next`), to the raw function and the chain.
  - In the implementation, use `throwIfNotSelector(mapper, 'mapper', 'map')`, then pass `toSelector(mapper)` to the existing iterator. The candidate with the inline read is built later, in Task 6.
- [ ] **Step 4: Add the `map/property` bench** in `map.bench.ts`. Name the cases `native` (`records.map(r => r.group)`), `lambda` (`Functions.map(records, r => r.group)`, collected) and `key` (`Functions.map(records, 'group')`, collected), using `cases(bench, 'map/property')`.
- [ ] **Step 5:** Run `pnpm vitest run test/functions/map.spec.ts test/linqIterableWrapper/map.spec.ts && pnpm typecheck && pnpm check:structure && pnpm check:since`. Expected: PASS.
- [ ] **Step 6: Commit** with `feat(map): accept a property key as mapper`. The body refs #185.

### Task 3: `sum` with a key

**Files:**
- Modify: `src/functions/sum.ts`, `iterableLinq.ts` (`sum`), `linqIterable.ts`, `test/functions/sum.spec.ts`, `test/linqIterableWrapper/sum.spec.ts`, `test/bench/functions/sum.bench.ts`

**Interfaces:**
- Produces:
  - `sum<T>(iterable: Iterable<T>, key: KeysOfType<T, number>): number`
  - chain: `sum(key: KeysOfType<T, number>): number`

- [ ] **Step 1: Write the failing tests.**
  - `sum(objs, 'price')` equals `sum(objs, o => o.price)`.
  - `sum([1, 2], undefined)` is `3`.
  - A `null` element throws `TypeError` and closes `closableSource`.
  - An invalid selector (`{}`) gives the full message with `"selector"`.
  - Types:
    - `// @ts-expect-error` on `sum(objs, 'name')`;
    - `// @ts-expect-error` on a `price?: number` key;
    - chain `expectTypeOf(from(objs).sum('price')).toEqualTypeOf<number>()`.
- [ ] **Step 2:** Run the two specs. Expected: FAIL.
- [ ] **Step 3: Implement.**
  - Add the overload and its JSDoc.
  - After the `selector === undefined` branch, use `throwIfNotSelector`, then `toSelector`.
- [ ] **Step 4: Add the `sum/property` bench.** Name the cases `native` (a `for…of` summing `r.score`), `lambda` (`Functions.sum(records, r => r.score)`) and `key` (`Functions.sum(records, 'score')`).
- [ ] **Step 5:** Run the specs, `typecheck` and `check:structure`. Expected: PASS.
- [ ] **Step 6: Commit** with `feat(sum): accept a property key as selector`.

### Task 4: `groupBy` with a key

**Files:**
- Modify: `src/functions/groupBy.ts`, `iterableLinq.ts`, `linqIterable.ts`, the two `groupBy` specs, `test/bench/functions/groupBy.bench.ts`

**Interfaces:**
- Produces:
  - `groupBy<T, P extends keyof T>(iterable: Iterable<T>, key: P): Iterable<[T[P], T[]]>`
  - chain: `groupBy<P extends keyof T>(key: P): IIterableLinq<[T[P], T[]]>`

- [ ] **Step 1: Write the failing tests.**
  - `groupBy(objs, 'team')` deep-equals `groupBy(objs, o => o.team)`.
  - A `NaN` key groups together (`SameValueZero`).
  - A `null` element throws `TypeError` and closes the source.
  - An invalid selector gives the full message with `"keySelector"`.
  - The chain's type is `IIterableLinq<[string, T[]]>`.
- [ ] **Step 2:** Run the two specs. Expected: FAIL.
- [ ] **Step 3: Implement.** Use `throwIfNotSelector`, then `toSelector`, then the existing `GroupByIterator`.
- [ ] **Step 4: Add a `key` case** to the existing `groupBy: key` bench test: `Functions.groupBy(records, 'group')`, next to the lambda case.
- [ ] **Step 5:** Run the specs, `typecheck` and `check:structure`. Expected: PASS.
- [ ] **Step 6: Commit** with `feat(groupBy): accept a property key as keySelector`.

### Task 5: `distinct` with a key

**Files:**
- Modify: `src/functions/distinct.ts`, `iterableLinq.ts`, `linqIterable.ts`, the two `distinct` specs, `test/bench/functions/distinct.bench.ts`

**Interfaces:**
- Produces:
  - `distinct<T>(iterable: Iterable<T>, key: keyof T): Iterable<T>`
  - chain: `distinct(key: keyof T): IIterableLinq<T>`

- [ ] **Step 1: Write the failing tests.**
  - `distinct(objs, 'email')` equals the lambda version.
  - `distinct([[1, 'a'], [1, 'b']], 0)` keeps 1 element, so key `0` is not "no selector".
  - `distinct(xs)` and `distinct(xs, undefined)` are unchanged.
  - A `null` element throws `TypeError` and closes the source.
  - An invalid selector gives the full message.
- [ ] **Step 2:** Run the two specs. Expected: FAIL.
- [ ] **Step 3: Implement.** Keep `keySelector !== undefined` as the only "is there a selector" test. Then use `throwIfNotSelector` and `toSelector`.
- [ ] **Step 4: Add a `key` case** to the existing `distinct/key` bench.
- [ ] **Step 5:** Run `pnpm test:coverage && pnpm typecheck && pnpm lint && pnpm check:structure && pnpm check:since`. Expected: PASS at 100%.
- [ ] **Step 6: Commit** with `feat(distinct): accept a property key as keySelector`.

### Task 6: Standalone measurement and the inline candidate

**Files:**
- Create (scratchpad only, not in the repo): `<scratchpad>/bench-185/measure.mjs`, `<scratchpad>/bench-185/variants.mjs`, `<scratchpad>/bench-185/report.md`

**Interfaces:**
- Consumes: the built library of the branch and of `main`.
- Produces: `report.md` with the tables of comparisons A and B per operation, the noise, the trace summary, and a verdict per operation.

- [ ] **Step 1: Build both versions in the devcontainer.**
  - Run `pnpm build` on the branch, then `cp -r dist /tmp/ilu-branch`.
  - Run `git stash -u` if needed, then `git switch main && pnpm build && cp -r dist /tmp/ilu-main && git switch -`, then `git stash pop` if needed.
  - Expected: both `/tmp/ilu-*/iterable-linq-utility.js` exist.
- [ ] **Step 2: Write `variants.mjs`.** For each of `map`, `sum`, `groupBy` and `distinct`, export these variants:

  | Variant | Code |
  | --- | --- |
  | `main-lambda` | `Functions.<op>(records, r => r.group)` from `/tmp/ilu-main` (`r.score` for `sum`) |
  | `branch-lambda` | the same, from `/tmp/ilu-branch` |
  | `branch-key` | `Functions.<op>(records, 'group')` from `/tmp/ilu-branch` |
  | `inline-key` | a plain-JS copy of the branch's operation with the key read as `value[key]` in the loop or iterator, no closure |

  Use the `records` shape of `test/bench/helpers.ts` (`id`, `group`, `score`, `tags`). Collect each Transformation fully, and check every result against the expected value, so nothing is optimised away.
- [ ] **Step 3: Write `measure.mjs <op> <variant…>`.**
  - Warm up for 0.5 s.
  - Count the calls over 2 s.
  - Print the ns per value for sizes 1,000 and 100,000.
- [ ] **Step 4: Run, one process per variant, 3 repetitions.** Do it with `docker cp` and `node measure.mjs <op> <variant>`. Expected: ns per value per variant, and the noise as the spread between repetitions.
- [ ] **Step 5: Run with all variants in one process, in both orders.** This covers comparison A with both forms present, which is the polymorphic case. Use 3 repetitions.
- [ ] **Step 6: Run `node --trace-opt --trace-deopt`** on `branch-lambda`, `branch-key` and `inline-key` together. Filter with `grep 'JSFunction <hot fn>' | sort | uniq -c`.
- [ ] **Step 7: Run `pnpm bench:report functions/map functions/sum functions/groupBy functions/distinct`** on the branch, as the Vitest view.
- [ ] **Step 8: Write `report.md`.** For each operation:
  - table A: `branch-key` and `inline-key` against `branch-lambda`;
  - table B: `branch-lambda` against `main-lambda`;
  - the noise;
  - the verdict on whether `inline-key` beats `branch-key` beyond the noise.

### Task 7: Apply the inline candidate where it wins (conditional)

Skip this task for an operation where `inline-key` does not beat `branch-key` beyond the noise.

**Files:**
- Modify: `src/functions/<op>.ts` for each winning operation (and its iterator, if it has one).

- [ ] **Step 1:** Add the inline key path. Read `value[key]` in the loop, or in a dedicated iterator class, keeping the `try`/`catch` + `closeAfterCallbackError()` around the read (ADR 0008). The function path must stay byte-for-byte the same code as on `main`.
- [ ] **Step 2:** Run `pnpm test:coverage`. Expected: PASS at 100%. The specs of Tasks 2–5 already pin the key behaviour.
- [ ] **Step 3:** Repeat Task 6 Steps 1, 4, 5 and 8 for that operation. Expected: the verdict confirmed, with B still within the noise.
- [ ] **Step 4: Commit** with `perf(<op>): read the property key inline`. The body carries the numbers.

### Task 8: GATE: report to the user and STOP

- [ ] **Step 1:** Show the user the tables of `report.md` and the verdict per operation against the gate (A and B within the noise for each of `map`, `sum`, `groupBy` and `distinct`).
- [ ] **Step 2: STOP.** Wait for the user's decision.
  - **Go**: continue with Phase 1.
  - **Retry `<op>`**: return to Task 7 for that operation.
  - **Reject**: with the user's OK, comment on #185 with the tables and close it, add a note on #181, and abandon the branch. Nothing below applies.

---

## Phase 1: rollout (only after "go")

Every operation task below follows the pattern of Tasks 2–5:

1. failing specs: key equals lambda, `null` element gives `TypeError` and closes the source, invalid selector gives the full message, chain delegation and type;
2. overloads and JSDoc on the raw function and on the chain;
3. `throwIfNotSelector`, then the implementation that won in Phase 0 for that kind (Transformation, Action, `Map`/`Set` keys);
4. a `property` (or `key`) bench case next to the lambda;
5. specs, typecheck and `check:structure` green;
6. commit `feat(<op>): accept a property key as <selector>`.

Any bench of these operations where the key or the lambda falls outside the noise goes back to the user before the PR.

### Task 9: ADR 0025 and the instructions

**Files:**
- Create: `docs/decisions/0025-property-keys-as-selectors.md`
- Modify: `docs/decisions/README.md`, `AGENTS.md` (Rules), `.agents/skills/operation/SKILL.md` (and `references/jsdoc.md`/`tests.md` if they show selectors), `documentation/docs/how-to-contribute.md`

- [ ] **Step 1:** Write the ADR with the `adr` skill, as described in spec §8. Include the Phase 0 numbers as evidence for the chosen implementation.
- [ ] **Step 2: Add the rule line in the three instruction places.** Text: "A selector that reads a value from the element also accepts a property key, validated with `throwIfNotSelector` (ADR 0025)."
- [ ] **Step 3:** Run `pnpm check:instructions`. Expected: PASS.
- [ ] **Step 4: Commit** with `docs(adr): record property keys as selectors`.

### Task 10: `average` and `flatMap`

- `average<T>(iterable: Iterable<T>, key: KeysOfType<T, number>): number | undefined`, the same shape as `sum`.
- `flatMap<T, P extends KeysOfType<T, Iterable<unknown>>>(iterable: Iterable<T>, key: P): Iterable<T[P] extends Iterable<infer R> ? R : never>`. Type test: `flatMap(records, 'tags')` is `Iterable<string>`.
- Bench: `average/property` and `flatMap/property` (on `tags`).

### Task 11: `except`, `intersect` and `union`

- Each gets `<op><T>(iterable: Iterable<T>, other: Iterable<T>, key: keyof T): Iterable<T>`.
- `OtherKeysIterator` keeps receiving a `Mapper`, unless Phase 0 found that the inline read wins for `Set` keys (the `distinct` result).
- Test key `0` and `undefined`, as in `distinct`.

### Task 12: `innerJoin` and `groupJoin`

- Add the 3 extra overloads per operation of spec §2a: key/fn, fn/key and key/key. Use `PI extends KeysOfType<I, T[PO]>` and `innerKey: Mapper<I, T[PO]>`.
- Type tests: `@ts-expect-error` on keys of different value types, and on `innerKey` a key of `T` instead of `I`.
- Validate both `outerKey` and `innerKey` with `throwIfNotSelector`. `result` keeps `throwIfNotFunction`.

### Task 13: `collectToMap`

- Add the 4 extra overloads of spec §2a.
- `valueSelector: undefined` keeps its meaning (the element).
- Type test: `collectToMap(records, 'id', 'group')` is `Map<number, string>`.

### Task 14: Documentation and changeset

**Files:**
- Modify: `documentation/docs/api-reference/` (the page of each of the 13 operations), `documentation/docs/basic-concepts.md` (new `## Selectors` after `## Equality`, with the content of spec §7)
- Create: a changeset (`pnpm changeset`, `minor`)

- [ ] **Step 1:** Write the docs, with a key example per operation.
- [ ] **Step 2:** Run the strict mkdocs build in Docker (`python:3.12-slim`). Expected: no warnings.
- [ ] **Step 3: Write the changeset.** Text: "Selectors that read a value from the element accept a property key (`map('name')`, `sum('price')`, `groupBy('team')`, …), and `KeysOfType` is exported. The validation messages of these operations become `The "<name>" must be a function or a property key`."
- [ ] **Step 4: Commit** with `docs: property keys as selectors`.

### Task 15: Final verification and PR preparation

- [ ] **Step 1:** In the devcontainer, run `pnpm lint && pnpm typecheck && pnpm check:since && pnpm check:structure && pnpm check:instructions && pnpm check:changeset && pnpm check:commits && pnpm build && pnpm check:package && pnpm test:coverage`. Expected: all PASS, coverage at 100%.
- [ ] **Step 2:** Run `pnpm bench:report` on the 13 operations. Expected: no `property` case outside the noise against its lambda.
- [ ] **Step 3: Prepare the PR description** with the `pull-request` skill. Include:
  - the Phase 0 tables (A, B, trace);
  - the bench report;
  - `Closes #185`.

  Push and open the PR **only when the user asks**.
