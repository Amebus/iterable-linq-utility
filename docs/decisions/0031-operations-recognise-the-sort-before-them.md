# Operations recognise the sort before them

* Status: accepted
* Deciders: Amebus
* Date: 2026-11-03

Technical Story: https://github.com/Amebus/iterable-linq-utility/issues/203

Amends: [ADR 0029](0029-sorting-with-the-native-sort.md)

## Context and Problem Statement

[ADR 0029](0029-sorting-with-the-native-sort.md) chose a full native sort and left one negative consequence: reading only the first values costs a full sort, so `sort('score').take(10)` on 100,000 values is as slow as `sort('score')`. Who sorts and then reads only the first values, or a page (`sort('date').skip(20).take(10)`), should not pay for the whole order, and without a new API: the calls users already write should get faster by themselves.

Which operations take part, how do they know that their source is a sort, and how is the part sorted?

## Decision Drivers

* No new public API
* Exactly the result of the full sort followed by the same operation: order, stability, missing values last, every kind of `Comparer`, `descending`
* Never slower than today: the full sort, and `sort().take(k)` with a large `k`, must not get slower
* Deferred and re-runnable as today
* Little new machinery: the recognition in the operations that already exist

## Considered Options

Recognition:

* A: `sort` returns a `SortedIterable`, which `skip`, `take` and `slice` recognise with `instanceof`
* B: a protocol: a symbol method that `skip`, `take` and `slice` call when an iterable has it
* C: a sort always incremental (heap or incremental quicksort), for every use

Partial sort: quickselect, and the native sort of the first values; a bounded heap; a full pass that checks whether the values are already sorted.

## Decision Outcome

Chosen option: "A: `sort` returns a `SortedIterable`, recognised with `instanceof`", with a quickselect chosen by a rule.

* `SortedIterable` is a `DeferredIterable` that also keeps the source, the comparer, `descending` and an offset. `skip`, `take` and `slice` check it after validating their arguments, as `memoize` and `materialize` recognise their own iterables.
* The forms, with `S` the iterable returned by `sort` and non-negative integers `a`, `b`, `c`, `d`: `take(S, b)` reads the window `[0, b)` of the sorted order; `slice(S, c, d)` with `d > c`, `[c, d)`; `take(skip(S, a), b)`, `[a, a + b)`; `slice(skip(S, a), c, d)`, `[a + c, a + d)`. `skip(S, a)` and `slice(S, a)` give a `SortedIterable` with an offset; read alone they sort everything and skip, as today. An empty window yields nothing, and `take(S, 0)` does not read the source, as today.
* Anything else is a full sort, as today: an operation between `sort` and `take` (`map`, `filter`…), a negative index, `skip` alone, `takeLast`, `find`, `at`. The window that results is not recognised again.
* A window that starts past the end of the values, and `skip(S, a)` or `slice(S, a)` read alone with `a >= n`, yield nothing without sorting, so a compare function that would throw is not called there.
* The rule, at each run: read the source into an array (`n` values), `m = min(a + b, n)`. Sort in full, as ADR 0029, and take the window, when: `m > n / 4`; or the sample is smaller than 8 pairs; or the sample finds no pair out of order; or it finds fewer than 1 pair in 10 out of order and `m > n / 100`. The sample is `min(256, n >> 5)` adjacent pairs `(i, i + 1)`, stratified: one pair in each stride of `floor((n - 1) / sample)` values, at an offset drawn by a pseudo-random generator seeded from `n`, so the same input takes the same path. A fixed stride aliases with periodic data: at `n = 100,000` the stride is 390, a multiple of 10, so on records with `group = g${i % 10}` every sampled pair was `(g0, g1)`, no descent was seen and the bench groups of a list of keys never took the partial sort; with the offsets drawn in each stride, such period-10 data shows 29 descents in 256 pairs.
* Otherwise a quickselect on an array of indices, with a pseudo-random pivot (deterministic, seeded from `n`) and ties broken by the index, until the first `m` indices are the `m` smallest; then the native sort of those `m` indices, with the same comparison. Past a budget of `8n` partitioned values the quickselect gives up and the full sort runs: a consistent order measured at most `4.96n` on 10 shapes of data, and `4.55n` on 18 more shapes probed in review.
* The comparison of two indices follows ADR 0029 for each kind of `Comparer`: the order, the missing values last in both directions, `descending` inverting only the present values, equal values by source index.
* Consistency: the result is the same as the full sort for a comparison that is a consistent order (numbers, strings, keys of one type, any sensible compare function). With an inconsistent comparer (values `<` cannot order, a random or non-antisymmetric function) the window can differ, as the result of `Array.prototype.sort` is not defined for it, and the compare function or a getter can be called a different number of times, in a different order, so an error thrown only for some pairs may or may not be thrown. The `sort` page of the API reference says so.
* An error of the compare function or of a key read closes the iterator and propagates, as in `sort`; a new run sorts again.

Measured with Node 24 on 100,000 values (spikes of #203), against copy, native sort and slice:

| first `a + b` values | quickselect + native sort of the first `a + b` | bounded heap |
| --- | --- | --- |
| 10 | +250% to +690%; sorted data −20% | random +2,400%, reversed +36% |
| 1,000 | +190% to +640%; sorted −21% | random +850%, reversed −67% |
| page 20,000 + 10 | +70% to +180%; sorted −39% | 0% to −79% |
| 25% of `n` | +50% to +130%; sorted −32% | −15% to −83% |
| 50% of `n` | +4% to +17% | −42% to −91% |
| 90% of `n` | −31% to −42% | −48% to −95% |

(Percentages are the change in speed against the full sort: positive is faster, negative is slower.)

A second spike measured strings, two keys with 5% missing, getter keys, nearly sorted data, sorted data with one late inversion and 1,000 values. A full pass that checks "already sorted" doubles the cost on sorted and nearly sorted data, where the native sort is linear (up to −80% with quickselect, −11% to −30% even falling back to the full sort), while the sample costs almost nothing. With the rule, against today's full sort: +100% to +800% from the first 10 to 25% of `n` on random numbers, strings, records by a key or a function, getter keys, two keys with missing values, reversed data and 10 distinct values; +135% to +195% for the first 10 to 1,000 on nearly sorted data and 0% above; 1,000 values: within the noise; 50% of `n`: 0%.

The bench of the library (`sort/take10`, `sort/take1000`, `sort/page`, 100,000 values, `pnpm bench:report functions/sort`) is the gate: no group may be slower than the full sort of the same data. Chain against `toSorted(compare).slice(…)`:

| window | random | by a key | by a list of keys | by a function |
| --- | --- | --- | --- | --- |
| first 10 | +453% | +192% | +131% | +237% |
| first 1,000 | +328% | +160% | +126% | +214% |
| page 20,000 + 10 | +97% | +49% | +12% | +67% |

The full sort of the same data is −13%, −26%, −27% and −19% of the native reference. On already sorted data the sample finds no descent and the full sort runs: it stays slower than the linear `toSorted().slice(…)` (−73%, −76% and −72% for the three windows), but not slower than today's full sort (3.1 to 3.6 ms against 3.7 ms for `sort/direct` in the same run).

### Positive Consequences

* `sort(…).take(10)` and a page are several times faster, with the calls users already write and no new API
* The full sort is unchanged, and a sorted source, where the native sort is linear, takes the full sort and is not slower than today (still slower than a native `toSorted().slice(…)`, which only moves the window)
* The result is the same as the full sort for any consistent order; the rule is deterministic, so the same input always takes the same path

### Negative Consequences

* `sort` returns a class of the library, and three operations know it
* A pipeline with an operation between `sort` and `take` (`sort().map(f).take(10)`) gets no gain
* With an inconsistent comparer the window can differ from the one of the full sort, and the compare function can be called a different number of times
* A rule with thresholds (a quarter, a hundredth, a tenth, a sample, a budget) to maintain, and tests for each branch

## Pros and Cons of the Options

### A: `SortedIterable` and `instanceof`

* Good, because it follows what `memoize` and `materialize` already do, with no new mechanism
* Good, because the recognition lives in four operations and the rest of the library is untouched
* Bad, because every new operation that could take part must be added by hand

### B: a protocol

* Good, because `map` or an operation added with `extend` could take part later
* Bad, because it is a new internal contract for one use case

### C: a sort always incremental

* Good, because `find` and `at` get faster too
* Bad, because ADR 0029 measured the full sort 36–94% slower, the worst on sorted data

### The bounded heap

* Good, because it is faster still on random data (+2,400% for the first 10 values)
* Bad, because it breaks the rule "never slower than today": −67% on reversed data for 1,000 values, up to −79% on a page and −95% for 90% of `n`, where the native sort of the quickselect is linear or the full sort wins

### A full pass that checks "already sorted"

* Good, because it recognises sorted data exactly
* Bad, because it doubles the cost on sorted and nearly sorted data, where the native sort is linear; the sample of adjacent pairs costs almost nothing
