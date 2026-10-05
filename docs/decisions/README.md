# Architecture Decision Records

Each file records one decision: its context, the options considered and the consequences. The format is [MADR](https://adr.github.io/madr/).

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
| [0014](0014-instructions-for-ai-coding-agents.md) | Instructions for AI coding agents | accepted |
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

## Adding a decision

1. Copy the structure of an existing ADR: Context and Problem Statement, Decision Drivers, Considered Options, Decision Outcome (with the positive and negative consequences), Pros and Cons of the Options.
2. Name the file with the next number and a short title in kebab case, for example `0012-my-decision.md`.
3. Link the issue or the pull request in `Technical Story`, and add the ADR to the table above.
4. A decision that replaces an older one does not edit it: set the old one to `superseded by [ADR NNNN](…)`. A decision that corrects or completes part of an older one sets it to `accepted, amended by [ADR NNNN](…)`, and links it with `Amends:`.
