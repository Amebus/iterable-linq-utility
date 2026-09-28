# Folder structure based on topics

* Status: accepted
* Deciders: Amebus
* Date: 2023-03-11

Technical Story: https://github.com/Amebus/iterable-linq-utility/issues/13

## Context and Problem Statement

How should the code be structured? Where should features, utility functions and types go?

## Decision Drivers

* Immediately identify how and where to add new code
* Easy merges and pull requests
* Isolate each feature from the others
* Allow extensibility in projects that use the library, through TypeScript module augmentation
* Separate types from implementations

## Considered Options

* Every file at the root folder level
* One module per feature
* One module per topic, one file per feature inside the module

## Decision Outcome

Chosen option: "One module per topic, one file per feature inside the module", because it isolates the features and still lets them share the core and common utilities.

Today the topics are `src/functions` (one file per operation), `src/types`, `src/iterators`, `src/utils` and `src/collections`.

### Positive Consequences

* Easier to reason about the code
* Easier to manage branch merges and pull requests
* Each feature is isolated
* Modules can be augmented: [ADR 0003](0003-extension-api-instead-of-public-wrapper-class.md) builds the extension API on this

### Negative Consequences

* High coupling between the utility modules
* Relative imports across topics (for example `../functions`) are harder to read. The tests avoid them with the `@/` alias.

## Pros and Cons of the Options

### Every file at the root folder level

`src/map.ts`, `src/linkedList.ts`, `src/linqIterable.ts`, `src/types.ts`, …

* Good, because import statements are easy to reason about
* Good, because code is easy to reuse
* Good, because it is highly testable: almost every function, class and type is exported
* Bad, because the root folder soon becomes too crowded to navigate
* Bad, because the chances of merge conflicts are high

### One module per feature

Each feature has its own folder, for example `src/map/index.ts`, `src/map/mapIterable.ts`, `src/map/utils.ts`, `src/map/collections.ts`.

* Good, because every module is isolated from the others
* Good, because every import points only to files inside the same folder
* Good, because it is highly testable: almost every function, class and type is exported
* Good, because the chances of merge conflicts are low
* Good, because a new feature does not touch the other features
* Bad, because of high code duplication: the same utility may be duplicated in each module

### One module per topic, one file per feature inside the module

Each topic has its own module, and each feature is isolated in its own file. Each file exports only the feature and the types needed to use it.

* Good, because code duplication is low
* Good, because the chances of merge conflicts are low
* Good, because a new feature does not touch the other features
* Good, because the private code of a feature does not need to be exported
* Bad, because it may be difficult to test every single aspect of a feature
* Bad, because import statements are not easy to reason about
