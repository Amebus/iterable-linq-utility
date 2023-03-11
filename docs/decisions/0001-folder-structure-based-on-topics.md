# Folder structure based on topics

* Status: accepted
* Deciders: Amebus
* Date: 2023-03-11

Technical Story: https://github.com/Amebus/iterable-linq-utility/issues/13

## Context and Problem Statement

How should we strcutture the code? Where should we put features and utility methods and types?
Each macro area might have it's own folder/module to

## Decision Drivers

* Immediately identify how and where to enter new code
* Merges and Pull requests management
* Isolate each feature from the others
* Allow for extensibility into projects using the library thanks to typescript module augmentation
* Separate types from implementations

## Considered Options

* Every file at the root folder level
* One module per feature
* One module per topic, one file per feature into the module

## Decision Outcome

Chosen option: "One module per topic, one file per feature into the module", because Isolations of features and code reausability with reagards to core and commons utility

### Positive Consequences

* Easier to reason about the code
* Easier to manage branch merges and pull requests
* Each feature is isolated
* Module can be augmented

### Negative Consequences

* High coupling between utility modules
* Importing a module ends up in specifying not easy to reason about relative paths e.g.: ../../functions

## Pros and Cons of the Options

### Every file at the root folder level

src/map.ts, src/linkedList.ts, src/linqIterable.ts, src/types.ts ...

* Good, because Import statements are easy to reason about
* Good, because Allows reuse of code easily
* Good, because highly testable, almost every funtion, class and type will be exported
* Bad, because It will sooon ends up in
* Bad, because Chances are high to get merge conflicts

### One module per feature

Each fatures should have it's own folter e.g.: src/map/index.ts, src/map/mapIterable.ts, src/map/utils.ts, src/map/collectons.ts

* Good, because every module is isolated from each others
* Good, because every import statement is simple and points onlyt to files inside the same folder
* Good, because highly testable, almost every funtion, class and type will be exported
* Good, because Chances are low to get merge conflicts
* Good, because Easy to add new features without touchig other features
* Bad, because high code duplication, same utility might be duplicated into each module

### One module per topic, one file per feature into the module

Each topic should have it's own module, each feature should be isolated from each others and have it's own file. Each file should export only the feature and the types to allow users to use that feature.

* Good, because Code duplication is low
* Good, because Chances are low to get merge conflicts
* Good, because Easy to add new features without touchig other features
* Good, because Private code to each feature needs not to be exported
* Bad, because It may be difficult to test every single aspect of a feature
* Bad, because Import statements are not easy to reason about
