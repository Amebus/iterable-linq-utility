# Material for MkDocs as documentation engine

* Status: accepted
* Deciders: Amebus
* Date: 2023-03-11

Technical Story: https://github.com/Amebus/iterable-linq-utility/issues/2

## Context and Problem Statement

Project documentation

## Decision Drivers

* Immediately identify how and where to enter new code
* Merges and Pull requests management
* Isolate each feature from the others
* Allow for extensibility into projects using the library thanks to typescript module augmentation
* Separate types from implementations

## Considered Options

* Git hub wiki
* Material for MkDocs

## Decision Outcome

Chosen option: "Material for MkDocs", because comes out best.

### Positive Consequences

* Easier to reason about the code
* Easier to manage branch merges and pull requests
* Each feature is isolated
* Module can be augmented

### Negative Consequences

* High coupling between utility modules
* Importing a module ends up in specifying not easy to reason about relative paths e.g.: ../../functions

## Pros and Cons of the Options

### Git hub wiki

* Good, because Import statements are easy to reason about
* Good, because Allows reuse of code easily
* Good, because highly testable, almost every funtion, class and type will be exported
* Bad, because It will sooon ends up in
* Bad, because Chances are high to get merge conflicts

### Material for MkDocs

* Good, because every module is isolated from each others
* Good, because every import statement is simple and points onlyt to files inside the same folder
* Good, because highly testable, almost every funtion, class and type will be exported
* Good, because Chances are low to get merge conflicts
* Good, because Easy to add new features without touchig other features
* Bad, because high code duplication, same utility might be duplicated into each module
