# Architecture Decision Records

Each file records one decision: its context, the options considered and the consequences. The format is [MADR](https://adr.github.io/madr/).

## Current decisions

What holds today, one row per decision, with the amendments merged in. The reasons are in the ADRs; the decisions replaced are in [All records](#all-records) and in git.

| Decision | ADR |
| --- | --- |
| The code is split by topic, one file per feature: `src/functions` (one file per operation), `src/types`, `src/iterators`, `src/utils` and `src/collections`. | [0001](0001-folder-structure-based-on-topics.md) |
| The documentation site is Material for MkDocs, in `documentation/`, deployed to GitHub Pages with mike, one version per minor; the JSDoc is the reference inside the editor. | [0002](0002-material-for-mkdocs-as-documentation-engine.md) |
| The chain class is not exported: the library exposes `extend()`, `override()` and `isIterableLinq()`, and a later `extend` of a name added by `extend` replaces its implementation on every chain. | [0003](0003-extension-api-instead-of-public-wrapper-class.md), [0023](0023-re-registering-an-extension.md) |
| A chain is deferred and re-runnable: a Transformation returns a `DeferredIterable`, every Action runs the chain again from the source, and `memoize` or `materialize` store the values on request. | [0004](0004-re-runnable-deferred-chains.md) |
| Each operation is a raw function in `src/functions`, exported as `Functions`, with the iterable as first argument; the chain method only delegates to it, and the validation, the laziness and the error handling live in the function. | [0005](0005-fluent-chain-and-raw-functions.md) |
| The library keeps its own implementation on iterables, and follows the semantics of the native Iterator Helpers where they overlap (index passed to the callbacks, closing on a callback error). | [0006](0006-position-against-the-native-iterator-helpers.md) |
| The iterators extend `BaseIterator` (an explicit `done`) and `SourceIterator` (one upstream iterator and an `index`); `DeferredIterable` creates a new iterator at each iteration. | [0007](0007-iterator-base-classes-with-explicit-state.md) |
| Only the callback call is in a `try`/`catch`, which calls `closeAfterCallbackError()` and rethrows; an error of the source propagates without closing it, and an Action that stops early closes the source. | [0008](0008-error-handling-and-source-closing.md) |
| An iterator with more than two states keeps them in a `state` field with a static transition table typed `Record<State, Step>`, not in a `switch`. | [0009](0009-transition-tables-instead-of-switch-statements.md) |
| The package ships ESM and UMD, with one bundled declaration file per format (`index.d.ts`, `index.d.cts`), checked with arethetypeswrong by `pnpm check:package`. | [0010](0010-package-formats-and-type-declarations.md) |
| The benchmarks run locally with Vitest against the built bundle and a saved baseline, never in CI; each bench has the standard scenarios (`direct`, `small`, after a `map` and a `filter`, the early exits) against a native reference, and a pull request pastes the output of `pnpm bench:report`. | [0011](0011-local-benchmarks-with-a-saved-baseline.md), [0021](0021-benchmark-standards.md), [0022](0022-benchmark-scenarios-in-practice.md) |
| Releases are trunk-based with changesets: a pull request that changes `src/` adds one, new APIs use `@since next`, Prepare release opens the release pull request, and merging it publishes; `main` and the release tags are protected by the rulesets of `.github/rulesets/`, without a bypass, and `main` requires the `build` check. | [0012](0012-trunk-based-releases-with-changesets.md), [0015](0015-checks-on-the-release-pull-request.md), [0016](0016-protection-rules-for-main-and-release-tags.md) |
| Every push to `main` that changes the documentation, `src/` or the changesets deploys the `next` version of the site, with a banner and an Upcoming page built from the pending changesets; a release deploys its minor and moves `latest`. | [0013](0013-documentation-versions-between-releases.md), [0017](0017-state-of-the-next-documentation.md) |
| The instructions for agents are in three levels: the CI checks, `AGENTS.md` and the skills of `.agents/skills/`; the decisions in force are summarised in this section, which `pnpm check:instructions` keeps in sync with the ADRs. | [0014](0014-instructions-for-ai-coding-agents.md), [0027](0027-current-decisions-in-the-adr-index.md) |
| The shared test sources live in `test/_helpers/generators/`, one file and one spec each, and a source moves there when a second spec needs it. | [0018](0018-shared-test-sources.md) |
| The tests cover 100% of `src/`, enforced by Vitest; Codecov only informs, and unreachable code gets `/* istanbul ignore next -- <reason> */`. | [0019](0019-full-test-coverage-of-the-library.md) |
| Every error the library creates starts with `[iterable-linq-utility/<operation>]`, through `libraryError` or a `Validations` helper; the errors of the source and of the callbacks propagate unchanged. | [0020](0020-error-messages-of-the-library.md) |
| An operation with a native counterpart uses its equality (`indexOf` `===`, `includes` `SameValueZero`); every other one uses `SameValueZero`, and a different equality is a callback. | [0024](0024-equality-of-the-operations-that-compare-values.md) |
| A selector that reads a value from the element also accepts one property key, never an array, read inline without slowing the function form; predicates, reducers and taps take functions only. | [0025](0025-property-keys-as-selectors.md), [0026](0026-arrays-of-keys-are-not-selectors.md) |

## All records

| ADR | Title | Status |
| --- | --- | --- |
| [0001](0001-folder-structure-based-on-topics.md) | Folder structure based on topics | accepted |
| [0002](0002-material-for-mkdocs-as-documentation-engine.md) | Material for MkDocs as documentation engine | accepted |
| [0003](0003-extension-api-instead-of-public-wrapper-class.md) | Extension API instead of a public wrapper class | accepted, amended by [0023](0023-re-registering-an-extension.md) |
| [0004](0004-re-runnable-deferred-chains.md) | Re-runnable deferred chains | accepted |
| [0005](0005-fluent-chain-and-raw-functions.md) | Fluent chain and raw functions | accepted |
| [0006](0006-position-against-the-native-iterator-helpers.md) | Position against the native Iterator Helpers | accepted |
| [0007](0007-iterator-base-classes-with-explicit-state.md) | Iterator base classes with explicit state | accepted |
| [0008](0008-error-handling-and-source-closing.md) | Error handling and source closing | accepted |
| [0009](0009-transition-tables-instead-of-switch-statements.md) | Transition tables instead of switch statements | accepted |
| [0010](0010-package-formats-and-type-declarations.md) | Package formats and type declarations | accepted |
| [0011](0011-local-benchmarks-with-a-saved-baseline.md) | Local benchmarks with a saved baseline | accepted, amended by [0021](0021-benchmark-standards.md) |
| [0012](0012-trunk-based-releases-with-changesets.md) | Trunk-based releases with changesets | accepted, amended by [0015](0015-checks-on-the-release-pull-request.md) |
| [0013](0013-documentation-versions-between-releases.md) | Documentation versions between releases | accepted, amended by [0017](0017-state-of-the-next-documentation.md) |
| [0014](0014-instructions-for-ai-coding-agents.md) | Instructions for AI coding agents | accepted, amended by [0027](0027-current-decisions-in-the-adr-index.md) |
| [0015](0015-checks-on-the-release-pull-request.md) | Checks on the release pull request | accepted, amended by [0016](0016-protection-rules-for-main-and-release-tags.md) |
| [0016](0016-protection-rules-for-main-and-release-tags.md) | Protection rules for main and the release tags | accepted |
| [0017](0017-state-of-the-next-documentation.md) | State of the next documentation | accepted |
| [0018](0018-shared-test-sources.md) | Shared test sources | accepted |
| [0019](0019-full-test-coverage-of-the-library.md) | Full test coverage of the library | accepted |
| [0020](0020-error-messages-of-the-library.md) | Error messages of the library | accepted |
| [0021](0021-benchmark-standards.md) | Benchmark standards | accepted, amended by [0022](0022-benchmark-scenarios-in-practice.md) |
| [0022](0022-benchmark-scenarios-in-practice.md) | Benchmark scenarios in practice | accepted |
| [0023](0023-re-registering-an-extension.md) | Re-registering an extension | accepted |
| [0024](0024-equality-of-the-operations-that-compare-values.md) | Equality of the operations that compare values | accepted |
| [0025](0025-property-keys-as-selectors.md) | Property keys as selectors | accepted, amended by [0026](0026-arrays-of-keys-are-not-selectors.md) |
| [0026](0026-arrays-of-keys-are-not-selectors.md) | Arrays of keys are not selectors | accepted |
| [0027](0027-current-decisions-in-the-adr-index.md) | Current decisions in the ADR index | accepted |

## Adding a decision

1. Copy the structure of an existing ADR: Context and Problem Statement, Decision Drivers, Considered Options, Decision Outcome (with the positive and negative consequences), Pros and Cons of the Options.
2. Name the file with the next number and a short title in kebab case, for example `0012-my-decision.md`.
3. Link the issue or the pull request in `Technical Story`, and add the ADR to the table above.
4. A decision that replaces an older one does not edit it: set the old one to `superseded by [ADR NNNN](…)`. A decision that corrects or completes part of an older one sets it to `accepted, amended by [ADR NNNN](…)`, and links it with `Amends:`.
