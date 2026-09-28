# Transition tables instead of switch statements

* Status: accepted
* Deciders: Amebus
* Date: 2026-09-28

Technical Story: https://github.com/Amebus/iterable-linq-utility/pull/21

## Context and Problem Statement

Some iterators have more than two states. `flatMap` reads the source (`outer`), reads an inner iterable (`inner`), and, since 0.1.0, reads an inner array by index (`array`). Before 0.1.0 such states were implemented by swapping functions stored in fields, which [ADR 0007](0007-iterator-base-classes-with-explicit-state.md) removes.

How should an iterator with several states choose what to do at each step?

## Decision Drivers

* The state is explicit data, visible in the debugger and in the types
* Each state's logic is small and separate from the others
* Adding a state must not touch the existing ones
* No closures per instance, and no casts

## Considered Options

* A: a `switch` on the state inside `advance()`
* B: swapped functions stored on the instance (the previous pattern)
* C: an explicit `state` field and a static transition table: one step function per state

## Decision Outcome

Chosen option: "C: an explicit `state` field and a static transition table".

* The iterator has a field `state` typed as a union (`'outer' | 'inner' | 'array'`).
* A static, read-only table, typed `Record<State, Step>`, holds one step per state. The `Record` type makes the compiler check that every state has a step.
* `advance()` loops `steps[this.state](this)` until a step returns a result. A step returns `undefined` when it only changed state.
* The table is static, so the steps receive the iterator as an argument (`it`). Static members cannot use the class's type parameters (TypeScript error TS2302), so the step type is a generic function (`<T, R>(it: FlatMapIterator<T, R>) => …`). When a step must name one of those types, the code goes into a generic static method (`mapNext`, `nextInner`).

### Positive Consequences

* A new state is a new union member and a new row in the table: adding `array` to `flatMap` did not change the other steps
* The state is one field, and the table is shared by every instance: no closures per instance
* The compiler catches a state without a step

### Negative Consequences

* A step cannot name the class's type parameters, so some logic moves to generic static helpers
* It is less familiar than a `switch`, and the control flow goes through the table
* The table lookup is an indirect call; on hot paths (an array inside `flatMap`), the steps should return a value directly instead of changing state and looping again

## Pros and Cons of the Options

### A: `switch`

* Good, because it is familiar and needs no extra types
* Bad, because every state shares one long method, and the compiler does not check that every state is handled unless an exhaustiveness check is added

### B: swapped functions

* Good, because each state is its own function
* Bad, because the state is hidden in which function is stored, and each instance allocates its closures
* Bad, because missed transitions go unnoticed (the `range` restart bug)

### C: transition table

* Good, because the state is data, and the steps are separate and checked
* Bad, because of the TS2302 limitation on static members
