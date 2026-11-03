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
* The rule, at each run: read the source into an array (`n` values), `m = min(a + b, n)`. Sort in full, as ADR 0029, and take the window, when: `m > n / 4`; or the sample is smaller than 8 pairs; or, with `d = min(descents, sample - descents)` the distance of the sample from sorted in either direction, `d < sample / 10`, whatever `m` is: fewer than 1 pair in 10 out of order, or fewer than 1 in 10 in order. The native sort finds the ascending and the descending runs there, and reverses a descending run in linear time. The sample is `min(256, n >> 5)` adjacent pairs `(i, i + 1)`, stratified: one pair in each stride of `floor((n - 1) / sample)` values, at an offset drawn by a pseudo-random generator seeded from `n`, so the same input takes the same path. A fixed stride aliases with periodic data: at `n = 100,000` the stride is 390, a multiple of 10, so on records with `group = g${i % 10}` every sampled pair was `(g0, g1)`, no descent was seen and the bench groups of a list of keys never took the partial sort; with the offsets drawn in each stride, such period-10 data shows 29 descents in 256 pairs. The sample compares its pairs with an order that reads only the values and keys of the two indices (about `2 · sample` key reads, with the rules of the comparison below); the order of every index, which reads every key first, is built only when the rule picks the quickselect, so a sort by a key that ends in the full sort reads no key more than the full sort alone.
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

A second spike measured strings, two keys with 5% missing, getter keys, nearly sorted data, sorted data with one late inversion and 1,000 values. A full pass that checks "already sorted" doubles the cost on sorted and nearly sorted data, where the native sort is linear (up to −80% with quickselect, −11% to −30% even falling back to the full sort), while the sample costs almost nothing. With the first rule of the spike, against today's full sort: +100% to +800% from the first 10 to 25% of `n` on random numbers, strings, records by a key or a function, getter keys, two keys with missing values and 10 distinct values; 1,000 values: within the noise; 50% of `n`: 0%.

That first rule sent reversed data to the quickselect (every sampled pair descends) and kept it for nearly sorted data when `m <= n / 100`. The final review measured both slower than today, which breaks the driver "never slower than today": reversed data −22% to −49% (records ascending by date read with `sort((a, b) => b.date - a.date).take(10)`: 2.92 ms against 1.96 ms; strings with `localeCompare` −49%; `sort('date', { descending: true })` −6% to −29%; ascending runs of 1,000 to 5,000 laid out in descending order −12% to −35%), and nearly sorted data with a compare function or strings −8% to −17%. Hence the symmetric rule above, without the exception for `m <= n / 100`: the native sort is about linear on data sorted or almost sorted in either direction, whatever the window.

The bench of the library (`sort/take10`, `sort/take1000`, `sort/page`, 100,000 values, `pnpm bench:report functions/sort`) is the gate: no group may be slower than the full sort of the same data, beyond its noise. Chain against `toSorted(compare).slice(…)`:

| window | random | by a key | by a list of keys | by a function |
| --- | --- | --- | --- | --- |
| first 10 | +442% | −22% | +128% | −14% |
| first 1,000 | +332% | −18% | +115% | −13% |
| page 20,000 + 10 | +114% | −20% | +9% | −13% |

The full sort of the same data is −10%, −26%, −23% and −18% of the native reference (the run of commit 359aa3b). The groups by a key and by a function sort records by `score = (i * 7919) % 1000`: each value is 81 below the one before, except about 1 pair in 12. The sample sees fewer than 1 pair in 10 in order and takes the full sort, as fast as today (−18% to −22% and −13% to −14% against −26% and −18% for the full sort), where the first rule of the spike took the quickselect (+192% and +237%). The native sort is not linear there (runs of about 12 values), so these windows give up a gain to keep the rule simple and never slower on reversed and nearly sorted data, which the sample cannot tell apart from them.

The groups on data sorted or almost sorted in either direction compare the window with today, the same sort hidden by a `map` and read in full (`sort(…).map(same).skip(a).take(b)`), at 100,000 values: reversed numbers by a function, reversed records by a key, reversed strings with `localeCompare`, records ascending by `id` read with the latest first by a function and by `('id', { descending: true })`, and a sorted copy with 1% of the values in a swapped adjacent pair, by a function in both directions. All 21 groups are within the noise of today: the time of the window is between 5% below and 3.7% above the time of today's full sort, the largest gap being the first 1,000 reversed strings (5.36 ms against 5.17 ms, with an rme of ±2.7% and ±2.5%), and the page is 2% to 5% faster; the rme of the groups is ±2.1% to ±4.7%. On already sorted data the sample finds no descent and the full sort runs: it stays slower than the linear `toSorted().slice(…)` (−72% for each of the three windows, 4.71 to 4.78 ms against 1.36 to 1.38 ms), but not slower than today's full sort: `sort/direct` takes 5.85 ms in the same run. Measured in pairs, the window against the same sort behind a `map` (today's path) is within ±3.6% on sorted numbers and records over three rounds, once the code is warm.

### Positive Consequences

* `sort(…).take(10)` and a page are several times faster on random data, with the calls users already write and no new API
* The full sort is unchanged, and a source sorted or almost sorted in either direction, where the native sort is about linear, takes the full sort and is not slower than today (still slower than a native `toSorted().slice(…)`, which only moves the window)
* The result is the same as the full sort for any consistent order; the rule is deterministic, so the same input always takes the same path

### Negative Consequences

* `sort` returns a class of the library, and three operations know it
* A pipeline with an operation between `sort` and `take` (`sort().map(f).take(10)`) gets no gain
* With an inconsistent comparer the window can differ from the one of the full sort, and the compare function can be called a different number of times
* A rule with thresholds (a quarter, a tenth either way, a sample, a budget) to maintain, and tests for each branch
* Data whose sample looks almost reversed but whose runs are short (records by `(i * 7919) % 1000`) takes the full sort: as fast as today, without the gain of the quickselect

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
