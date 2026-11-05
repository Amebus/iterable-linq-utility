# A second sample for the length of the runs

* Status: accepted
* Deciders: Amebus
* Date: 2026-11-05

Technical Story: https://github.com/Amebus/iterable-linq-utility/issues/207

Amends: [ADR 0031](0031-operations-recognise-the-sort-before-them.md)

## Context and Problem Statement

[ADR 0031](0031-operations-recognise-the-sort-before-them.md) sorts in full when a sample of adjacent pairs says that the values are sorted or nearly sorted in either direction, because the native sort is about linear there. It left one negative consequence: the share of descents cannot tell long runs from short ones. Records by `score = (i * 7919) % 1000` are in runs of about 12 values: 246 of 256 pairs descend, so they look almost reversed and take the full sort, although the native sort costs about `n log(n / run)` on them. Against `toSorted().slice(…)` the first 10 values went from +192% with the first rule of ADR 0031 to −22%.

How does the rule tell short runs from long ones, without making anything slower than today?

## Decision Drivers

* Never slower than today, the driver of ADR 0031: the quickselect does two to four times the comparisons of the full sort on data in runs of 128 values and more, so it is slower on a page and with an expensive comparison, and sorted data must stay almost free of extra comparisons
* The same result as the full sort, whatever the path
* Deterministic: the same input takes the same path
* Little new machinery

## Considered Options

* A: a second sample of pairs `(i, i + 32)`, read only when the first one looks nearly sorted, with the full sort below a third of the pairs
* A10: the same, with the threshold of the first sample, a tenth of the pairs
* B: a second sample of elements at random positions, the same whether they are set aside while reading the source or drawn from the array afterwards
* C: at each sampled position, follow the run for up to 32 values
* D: keep the rule of ADR 0031

## Decision Outcome

Chosen option: "A: a second sample of pairs `(i, i + 32)`, with the full sort below a third of the pairs".

* The first sample, the quarter, the minimum of 8 pairs, the quickselect and its budget do not change.
* When the first sample looks nearly sorted in either direction, `min(d, sample - d) < sample / 10`, and the sizes allow a partial sort, and only then, a second sample reads as many pairs `(i, i + 32)`, one per stride of `floor((n - 32) / sample)` values, at an offset drawn by the same generator with another seed. With `d32` its descents, the full sort runs when `min(d32, sample - d32) < sample / 3`; otherwise the quickselect.
* 32 is the scale of the minimum run of the native sort (32 to 64 values). In runs at unrelated levels, shorter than that, most of the pairs straddle two runs and about half descend. In ascending runs of length `L` in descending order, every pair that straddles two runs descends, so `d32` is about `sample * 32 / L`.
* The second sample uses the order of the pairs of the first one, which reads only the values and keys of the two indices: with one key, a sort that ends in the full sort reads at most `4 * sample` more keys than the full sort alone; with a list of keys, up to that many for each key that a tie reaches. Random data never reads it.

The threshold comes from the shapes below. The quickselect against the full sort, on 100,000 values, by a compare function, in a process that has first run the quickselect with 8 other comparisons, as an application would (the `min` is of the second sample of the code, out of 256, seed 1):

| data | `min(d32, 256 - d32)` | path | first 10 | page 20,000 + 10 | first 25,000 |
| --- | --- | --- | --- | --- | --- |
| records by score, runs of about 12 | 105 | quickselect | +560% | +110% | +67% |
| clustered, runs of 64 | 110 | quickselect | +300% | +17% | +3% |
| ascending runs of 8, at random levels | 117 | quickselect | +314% | +84% | +68% |
| ascending runs of 16 | 128 | quickselect | +348% | +103% | +63% |
| ascending runs of 32 | 122 | quickselect | +147% | +15% | −1% |
| descending runs of 12 | 121 | quickselect | +232% | +65% | +42% |
| **ascending runs of 64 in descending order** | 121 | quickselect | +44% | +13% | −2% |
| descending runs of 64 | 63 | full sort | +88% | +10% | −8% |
| ascending runs of 64 | 58 | full sort | +129% | +11% | −9% |
| ascending runs of 128 in descending order | 60 | full sort | +42% | −20% | −27% |
| blocks of 64 repeated values | 60 | full sort | +104% | −29% | −32% |
| swapped blocks of 128 | 35 | full sort | +34% | −32% | −47% |
| sawtooth of ramps of 317 | 34 | full sort | +213% | +5% | −15% |
| ascending runs of 200 in descending order | 34 | full sort | −8% | −27% | −26% |
| ascending runs of 128, at random levels | 28 | full sort | +55% | −8% | −15% |
| ascending runs of 316 in descending order | 28 | full sort | +31% | −38% | −39% |
| ascending runs of 1,000 in descending order | 7 | full sort | +10% | −28% | −33% |

The slower shapes leave at most 63 pairs on the side of the minority, those where the quickselect gains at least 105, except the row in bold: a third of the pairs, 85.3, is in the middle of that gap. Shapes on the full sort take today's path, so they lose the gain on small windows, not speed.

A10 was the first version of this rule, and the review of the branch rejected it: with a tenth of the pairs the runs of 128 to 316 values take the quickselect, and the first measure of those boundary shapes, in a process that had run nothing else, showed them faster (+50% to +439%), where in a warm process, or with `localeCompare`, a page is −20% to −50%. The state of the JIT changes these numbers more than the rule does, so a boundary measured only in a clean process proves nothing.

B measures the global order, with pairs about `n / 256` apart, not the length of the runs: in a shared process, ascending runs of 1,000 in descending order read as a page took the quickselect at −24%, and sorted data was down to −9%, as the positions have to be sorted. Setting the elements aside while reading the source would add a random number per value, for the same sample that the array gives for free.

The bench of the library is the gate (`pnpm bench:report functions/sort`, commit 620601f). Chain against `toSorted(compare).slice(…)`:

| window | by a key, ADR 0031 → now | by a function, ADR 0031 → now |
| --- | --- | --- |
| first 10 | −22% → +192% | −14% → +219% |
| first 1,000 | −18% → +122% | −13% → +220% |
| page 20,000 + 10 | −20% → +43% | −13% → +66% |

Every group on data sorted or nearly sorted in either direction, and the new groups on ascending runs of 200 and of 1,000 in descending order, is within the noise of today, the same sort hidden by a `map`, except the first 10 reversed strings: 5.42 ms against 5.15 ms, with an rme of ±2.5% and ±2.4%. Three rounds in pairs of `main` and this change, at 2,000 ms a case, show that the gap is not the second sample: the window took 4.71, 4.78 and 4.84 ms on `main`, 4.82, 4.77 and 4.71 ms with it. These shapes take the same path with either threshold.

### Positive Consequences

* The negative consequence of ADR 0031 on short runs is gone: `sort('score').take(10)` on the records of the bench is several times faster, with the calls users already write
* More data takes the quickselect and gains: clustered data, short runs at unrelated levels, and random data sorted only at the positions of the first sample
* Data in long runs takes the full sort as before, with 256 more comparisons at most

### Negative Consequences

* **Ascending runs of about 64 values in descending order are slower than today on large windows, the one exception to "never slower".** The second sample cannot tell them from short runs at unrelated levels: `d32` is near half in both, and the first 10 gain +44%. The first 25,000 are −2% above, and a page with `localeCompare` −6%; a warm-up with more kinds of comparer measured −11% to −26% on a page and on the first 25,000. Accepted: such data gains on small windows, and telling it apart would need a third sample, more comparisons and another threshold, which this decision does not add
* A second threshold, gap and seed to maintain, and the positions to write again in the test helpers
* Runs of 64 to 128 values at unrelated levels, and a sawtooth of ramps of `sqrt(n)`, take the full sort and lose the gain on small windows

## Pros and Cons of the Options

### A: pairs `(i, i + 32)`, a third of the pairs

* Good, because it measures at the scale that decides the cost of the native sort
* Good, because it costs 256 comparisons, only when the first sample looks nearly sorted
* Good, because the threshold is in the middle of a gap between the shapes, so the noise of the sample does not move them across it
* Bad, because it gives up the gain on runs of 64 to 128 values, and one shape stays slower on large windows

### A10: a tenth of the pairs

* Good, because it is the same threshold as the first sample, and it gains on more shapes on small windows
* Bad, because it takes the quickselect on runs of 128 to 316 values, where a page is slower in a warm process, and its boundary falls in the middle of those shapes

### B: elements at random positions

* Good, because it costs as little as A, and it gains on sawtooth data
* Bad, because long runs read as a page take the quickselect (−24%) and runs of 64 lose the gain
* Bad, because the positions have to be sorted, and sorted data is measurably slower (down to −9%)

### C: follow the runs

* Good, because it measures the length of the runs directly
* Bad, because it costs up to 8,000 comparisons, against 256; not measured for that reason

### D: keep the rule

* Good, because it needs no change
* Bad, because the records of the bench stay slower than the native sort, where a partial sort is several times faster
