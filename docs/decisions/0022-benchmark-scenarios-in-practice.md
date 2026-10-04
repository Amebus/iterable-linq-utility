# Benchmark scenarios in practice

* Status: accepted
* Deciders: Amebus
* Date: 2026-10-04

Technical Story: https://github.com/Amebus/iterable-linq-utility/issues/156

Amends: [ADR 0021](0021-benchmark-standards.md)

## Context and Problem Statement

Moving the 42 benches to the scenarios of ADR 0021 showed what it left open:

* the native reference of an operation without an equivalent array method: `reduce` for `sum` is about ten times slower than a `for…of`, so `+875%` says more about `reduce` than about the library;
* for an operation that can stop early, the `direct` group and the `none` group read the whole source the same way;
* some operations with an optional callback read nothing useful without it: `some()` reads one value, `single()` throws at the second one;
* `empty` has no size, so it has no `small` group;
* the same four groups, written by hand in 41 files, are about 2 000 lines that can drift apart.

How are these cases measured?

## Decision Drivers

* The tables stay comparable between operations
* A difference from native says something about the library
* A bench says what is specific to its operation, not the scenarios

## Considered Options

* Native reference: the array method only; a hand-written loop only; both
* Early exit: `direct`, `start`, `middle` and `none`; `direct` reads the whole source, plus `start` and `middle`
* Writing the groups: by hand in each file; with a helper that registers the standard groups

## Decision Outcome

**Native and loop.** The `native` case is the array method a user would write. When it is not the same algorithm as the operation (`reduce` for `sum`, `filter(…).length` for `count`, `findIndex` and `slice` for `takeWhile`), a `loop` case, a hand-written `for…of`, follows it. When no array method exists (`forEachAsync`, `tap`, `flatMap` of a generator), the `native` case is the loop. `vs native` is still computed on the `native` case.

**Early exit.** For an operation that can stop early, `direct` reads the whole source: its match is `missing`, its index or count is beyond the source. The early exits are `<name>/start` and `<name>/middle`; there is no `<name>/none`. The operations that always read the whole source, while the array method reads from the end (`findLast`, `findLastIndex`, `lastIndexOf`), have `<name>/end` and `<name>/middle` groups.

**Callbacks that the source needs.** When an operation without its callback does not read the source (`some` reads one value, `single` throws at the second one), the standard groups use the callback, and the group without it is `<name>/without-<callback>`.

**No size.** `empty` has no `small` group, and the chains that are only built, never read (`tapChainCreation`), have no `small`, `map` and `filter` groups.

**Helpers.** `scenarios(name, variants)` of `test/bench/helpers.ts` registers the four standard groups, and `group(name, id, variants)` one more group on `numbers` (an early exit, a callback). Each variant receives the source of the scenario: `native` and `loop` an array, `chain` a chain, `Functions` an iterable, and the name of the scenario. The upstream `map` or `filter` runs inside the measured function. The groups that need other data (`records`, a type guard, ten arrays) are written with `cases`.

`check:structure` checks that the bench of each operation has the `direct` and `small` groups, as strings or through `scenarios()`.

### Positive Consequences

* A bench lists only what is specific to its operation: the four standard groups come from one place
* The `loop` row shows the overhead of the library against the cheapest code, and `native` against the usual code
* No group repeats another one

### Negative Consequences

* The groups are registered by a function, so the bench files are less explicit than the cases they replace
* A `loop` row makes some tables a third longer

## Pros and Cons of the Options

### Native reference

* the array method only: good, because it is what users write; bad, because a slow method (`reduce`) inflates the difference
* a loop only: good, because it is the cheapest reference; bad, because it is not what users write
* both: good, because both comparisons are visible; bad, because the tables are longer

### Early exit

* four groups: good, because it follows ADR 0021 to the letter; bad, because `direct` and `none` measure the same thing
* `direct` with `start` and `middle`: good, because every group measures something different

### Writing the groups

* by hand: good, because each file shows all its cases; bad, because 41 copies of the same four groups drift apart, which is how the benches got here
* a helper: good, because the scenarios, the callbacks and the names come from one place; bad, because the cases are one step away from the file
