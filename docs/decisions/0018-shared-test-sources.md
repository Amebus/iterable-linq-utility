# Shared test sources

* Status: accepted
* Deciders: Amebus
* Date: 2026-10-02

Technical Story: https://github.com/Amebus/iterable-linq-utility/issues/91

## Context and Problem Statement

The specs check how an operation reads its source: whether it closes it, how many values it reads, whether it stops on an infinite source, what it does when the source throws ([ADR 0008](0008-error-handling-and-source-closing.md)). For that they need sources that record how they are consumed. Some were shared (`closableSource`, `spyIterable`, `infiniteSource`), in different places and without tests of their own; others were written again by hand in several specs, each a little different. Where do the test sources live, when does one become shared, and how do we know that they do what the tests expect?

## Decision Drivers

* A spec reads as the behaviour it checks, not as the plumbing of its source
* An agent or a contributor finds the existing sources before writing a new one
* A broken helper must not make wrong tests pass
* No source shared before it is needed

## Considered Options

* A: one folder, `test/_helpers/generators/`, one file and one spec per source, shared from the second spec that needs it
* B: shared sources without specs of their own
* C: every spec writes its own sources

## Decision Outcome

Chosen option: "A: one folder, one file and one spec per source, shared from the second spec that needs it".

* The shared test sources live in `test/_helpers/generators/`, one file per source, named after the function. A source is an iterable built for a test that records how it is consumed: `closableSource`, `spyIterable`, `infiniteSource`, `throwingSource`.
* A source becomes shared when a second spec needs it. Until then it stays local to its spec.
* Every shared source has its spec next to it, `<name>.spec.ts`, which checks the behaviour the tests rely on: the values, the counters, when it closes, when it throws.
* The instructions (AGENTS.md, the `operation` skill, How to contribute) point to the folder and name the sources with their use, so that they are found before a new one is written.

### Positive Consequences

* The specs use the same sources for the same checks, with the same counters
* A change to a source that breaks what the tests rely on fails its own spec, not dozens of others
* The folder is the one place to look for an existing source

### Negative Consequences

* A new shared source costs a spec and a line in the instructions
* A source used by one spec only stays inline, so the folder does not list every source of the tests

## Pros and Cons of the Options

### A: one folder, one spec per source, shared from the second use

* Good, because the sources are found in one place and checked on their own
* Bad, because it adds a spec for every source

### B: shared sources without specs

* Good, because it is less code
* Bad, because a wrong counter or a source that never closes makes the tests that use it pass or fail for the wrong reason, and the cause is hard to find

### C: every spec writes its own sources

* Good, because each spec is self-contained
* Bad, because the same source is written again, a little differently each time, and is never checked
