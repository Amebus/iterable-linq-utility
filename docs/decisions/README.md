# Architecture Decision Records

Each file records one decision: its context, the options considered and the consequences. The format is [MADR](https://adr.github.io/madr/).

| ADR | Title | Status |
| --- | --- | --- |
| [0001](0001-folder-structure-based-on-topics.md) | Folder structure based on topics | accepted |
| [0002](0002-material-for-mkdocs-as-documentation-engine.md) | Material for MkDocs as documentation engine | accepted |
| [0003](0003-extension-api-instead-of-public-wrapper-class.md) | Extension API instead of a public wrapper class | accepted |
| [0004](0004-re-runnable-deferred-chains.md) | Re-runnable deferred chains | accepted |
| [0005](0005-fluent-chain-and-raw-functions.md) | Fluent chain and raw functions | accepted |
| [0006](0006-position-against-the-native-iterator-helpers.md) | Position against the native Iterator Helpers | accepted |
| [0007](0007-iterator-base-classes-with-explicit-state.md) | Iterator base classes with explicit state | accepted |
| [0008](0008-error-handling-and-source-closing.md) | Error handling and source closing | accepted |
| [0009](0009-transition-tables-instead-of-switch-statements.md) | Transition tables instead of switch statements | accepted |
| [0010](0010-package-formats-and-type-declarations.md) | Package formats and type declarations | accepted |
| [0011](0011-local-benchmarks-with-a-saved-baseline.md) | Local benchmarks with a saved baseline | accepted |

## Adding a decision

1. Copy the structure of an existing ADR: Context and Problem Statement, Decision Drivers, Considered Options, Decision Outcome (with the positive and negative consequences), Pros and Cons of the Options.
2. Name the file with the next number and a short title in kebab case, for example `0012-my-decision.md`.
3. Link the issue or the pull request in `Technical Story`, and add the ADR to the table above.
4. A decision that replaces an older one does not edit it: set the old one to `superseded by [ADR NNNN](…)`.
