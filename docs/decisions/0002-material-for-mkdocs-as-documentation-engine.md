# Material for MkDocs as documentation engine

* Status: accepted
* Deciders: Amebus
* Date: 2023-03-11

Technical Story: https://github.com/Amebus/iterable-linq-utility/issues/2

## Context and Problem Statement

Project documentation

## Decision Drivers

* Allows users to search for content
* Allows to section the documentations by topics
* Allows to show examples code
* Easy to use

## Considered Options

* Git hub wiki
* Material for MkDocs

## Decision Outcome

Chosen option: "Material for MkDocs", because comes out best.

### Positive Consequences

* Allow documentation versioning
* Can be used with git hub pages with a simple git hub action
* Rich Markdown syntax
* Allows users to search for content

### Negative Consequences

* Markdown dialect
* Need some steup to publish it

## Pros and Cons of the Options

### Git hub wiki

* Good, because Simple
* Good, because No need of external tools
* Good, because No need of deploy
* Good, because Markdown Based
* Bad, because Bad navigation experience

### Material for MkDocs

* Good, because Based on MkDocs
* Good, because A lot of plugins to help improve the documentation quality
* Good, because Allow documentation versioning
* Good, because Can be used with git hub pages with a simple git hub action
* Good, because Rich Markdown syntax
* Bad, because Needs to be compiled before being published
* Bad, because The bigger the documentation is the higher is the time needed to compile it
