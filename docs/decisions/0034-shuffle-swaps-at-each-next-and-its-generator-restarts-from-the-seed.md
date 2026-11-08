# shuffle swaps at each next, and its generator restarts from the seed

* Status: accepted
* Deciders: Amebus
* Date: 2026-11-05

Technical Story: https://github.com/Amebus/iterable-linq-utility/pull/220

## Context and Problem Statement

`shuffle` yields the values in random order. It is the first operation of the library that uses randomness, and a Transformation is re-runnable (ADR 0004), so one chain can be read several times. Some users want a new order at every run, others the same order, for example in their tests or to replay a game. A generator with its own state continues from where it stopped, so a plain `random: () => number` cannot give the same order twice. The tests of the library also need a known order.

`take(k)` after `shuffle` is the natural way to get k random values, so how much it costs decides whether a `sample` operation is needed.

How does `shuffle` shuffle, and where do its random numbers come from?

## Decision Drivers

* The order must be uniform.
* Every run gives a new order by default, and the same order on request, with a seed of any type a generator accepts.
* A wrong value must never be yielded without an error.
* `shuffle().take(k)` should not pay for a full shuffle.
* No dependencies.

## Considered Options

For the shuffle:

* A: Fisher-Yates, one swap per `next()`
* B: Fisher-Yates, everything on the first `next()`
* C: `sort` with random keys

For the generator:

* D: `random(seed)` returns the generator, with a generator inside the library for a numeric seed
* E: a plain `random: () => number`
* F: `random(seed)` called at each step
* G: only a numeric seed

## Decision Outcome

Chosen options: "A: Fisher-Yates, one swap per `next()`" and "D: `random(seed)` returns the generator".

* The whole source is read on the first `next()`, because the last value must be able to come first. Then each `next()` picks one remaining value.
* The type of the options does not let a `random` that needs a seed omit it. Without a seed, `random` receives `undefined`.
* `shuffle(x)` uses `Math.random`, and every run gives a new order. `shuffle(x, { seed })` needs an integer, uses mulberry32 from `src/utils/mulberry32.ts`, not exported, and repeats the order. `shuffle(x, { seed, random })` calls `random(seed)` once per run, after the source is read, and the seed can be of any type.
* The order of a seed with the library generator is a promise: changing mulberry32 or the loop of `ShuffleIterator` is a breaking change. The specs pin it.
* `random` not returning a function, and a value of the generator that is not a number from 0 up to, but not including, 1, throw through `libraryError`. The errors of `random` and of the generator propagate unchanged (ADR 0008).
* There is no `sample` operation: k random values are `shuffle().take(k)`.

### Positive Consequences

* `shuffle().take(k)` does k swaps and k calls to the generator, with no change to `take` and no recognition like the one of ADR 0031. In a spike, option B was 14% to 46% slower with `take`.
* A factory that creates a new generator from the seed at each call restarts at every run, so it repeats the order, with a generator of any library. A factory that shares one generator continues from where it stopped, and the order changes.
* A generator that returns `1`, `NaN` or `false` throws, instead of yielding `undefined` or a biased order.

### Negative Consequences

* `shuffle` does not end on an infinite source, and it keeps the whole source in memory, also for `take(k)`. It reads through the iterator, so on 100,000 numbers `shuffle().take(10)` is 91% slower than the hand-written loop on an array: most of the time goes in reading the source.
* mulberry32 and the shuffle loop cannot change without a breaking change.
* `{ random: Math.random }` is not valid: it is written `{ random: () => Math.random }`, and the wrong form throws at the first read.
* An error of the generator can come in the middle of the sequence, after some values were yielded.
* The order is uniform only as far as the generator allows: a seed has 32 bits, so from 13 values up it cannot reach every order, and neither `Math.random` nor the seed is suitable for security.
* The seed costs time: on the 100,000 numbers the chain reads 235 ops/s with a seed and 281 without, against 395 to 403 for the hand-written loop.

## Pros and Cons of the Options

### A: Fisher-Yates, one swap per `next()`

* Good, because `take(k)` does k swaps.
* Good, because the order is uniform in O(n).
* Bad, because an error of the generator can come after some values.

### B: Fisher-Yates, everything on the first `next()`

* Good, because an error of the generator comes before the first value.
* Good, because the generator always consumes n values, whatever is read.
* Bad, because `take(k)` always pays n swaps. A spike measured it 14% to 46% slower with `take`, and between 1% and 3% faster on a full read, which may be noise.
* Bad, because avoiding that cost needs a recognition in `take`.

It gives the same order as A with the same generator, so an option between the two would change only the moment of the work, at the cost of more code, tests and benches.

### C: `sort` with random keys

* Good, because it reuses `sort`.
* Bad, because it is O(n log n), where Fisher-Yates is O(n).

### D: `random(seed)` returns the generator

* Good, because a factory that creates a new generator restarts at every run, with a seed of any type.
* Good, because many seeded generators already have this form.
* Bad, because `{ random: Math.random }` does not work.

### E: a plain `random: () => number`

* Good, because `{ random: Math.random }` works.
* Bad, because a generator with state cannot restart, so it cannot repeat the order.

### F: `random(seed)` called at each step

* Good, because the seed reaches the function directly.
* Bad, because a pure function returns the same number every time, which does not shuffle.

### G: only a numeric seed

* Good, because the options are simpler.
* Bad, because a seed of another type, or another generator, is impossible.
