---
name: operation
description: Use when adding a new operation to iterable-linq-utility (a raw function in src/functions and its chain method) or changing the signature or behaviour of an existing one, for example a new overload.
---

# Add or change an operation

The rules and their reasons are in [How to contribute](../../../documentation/docs/how-to-contribute.md#adding-an-operation) and in the ADRs listed in `AGENTS.md`. This skill is the checklist; the templates are in `references/`.

## Decide first

- **Transformation or Action?** A Transformation returns a new chain and runs nothing until an Action runs the chain. An Action runs the chain and returns a value.
- **Signatures**: the raw function takes the iterable as its first argument; the chain method takes the other arguments. For a new operation, they should be agreed in an issue.

## Checklist

Do every step, in this order. For a change to an existing operation, do the steps its change touches: a new overload needs JSDoc, tests, a bench case, the documentation site and a changeset.

1. **Raw function** in `src/functions/<name>.ts`.
    - Validate the inputs with `Validations` (`throwIfNotIterable`, `throwIfNotFunction`, …).
    - Transformation: return `new DeferredIterable(() => new <Name>Iterator(…))`, with a `SourceIterator` subclass that implements `advance()`. Copy `src/functions/map.ts`.
    - Callbacks: `try`/`catch` only around the callback call; in the `catch`, `this.closeAfterCallbackError()` then rethrow.
    - Action: a `for…of` over the iterable closes the source on an early stop. Copy `src/functions/some.ts`.
2. **Export** it from `src/functions/index.ts`, in alphabetical order.
3. **Chain**: declare the method on `IIterableLinqBase` (`src/types/iterableLinq.ts`) and implement it in `IterableLinqWrapper` (`src/linqIterable.ts`): `return toChain(<name>(this.iterable, …));` for a Transformation, `return <name>(this.iterable, …);` for an Action. The import from `./functions`, the class methods and the members of `IIterableLinqBase` are in alphabetical order, and the overloads of an operation stay next to each other.
4. **JSDoc** on both, with `@since next`: [references/jsdoc.md](references/jsdoc.md).
5. **Tests**: `test/functions/<name>.spec.ts` and `test/linqIterableWrapper/<name>.spec.ts`: [references/tests.md](references/tests.md). Write them first and watch them fail.
6. **Documentation site**: a row in the TLDR table and a section in `documentation/docs/api-reference/`: [references/docs-page.md](references/docs-page.md).
7. **Bench**: `test/bench/functions/<name>.bench.ts` against a native reference: [references/bench.md](references/bench.md).
8. **Changeset**: `pnpm changeset`, `minor` for a new operation, with a note for the users in the format of the [`pull-request` skill](../pull-request/SKILL.md#2-changeset). Before 1.0 a breaking change is a `minor` too, and goes in the migration guide.

## Check

```bash
pnpm lint && pnpm typecheck && pnpm check:since && pnpm check:structure && pnpm test:coverage
pnpm bench functions/<name>
```

`check:structure` fails when a spec, the bench, the export, the chain method or a JSDoc tag is missing, or when an operation is out of alphabetical order in the exports, the chain or the API reference. `lint` fails when the imports of a spec or a bench are out of order; `pnpm lint-fix` sorts them. `test:coverage` fails when a line or a branch of `src/` is not tested ([ADR 0019](../../../docs/decisions/0019-full-test-coverage-of-the-library.md)): add the missing test, or `/* istanbul ignore next -- <reason> */` on code that no test can reach. Nothing checks the content of the documentation site or the changeset: check those yourself.
