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

* Never slower than today, the driver of ADR 0031: long runs read as a page are slower with the quickselect (−24% on runs of 1,000), and sorted data must stay almost free of extra comparisons
* The same result as the full sort, whatever the path
* Deterministic: the same input takes the same path
* Little new machinery

## Considered Options

* A: a second sample of pairs `(i, i + 32)`, read only when the first one looks nearly sorted
* B: a second sample of elements at random positions, the same whether they are set aside while reading the source or drawn from the array afterwards
* C: at each sampled position, follow the run for up to 32 values
* D: keep the rule of ADR 0031

## Decision Outcome

Chosen option: "A: a second sample of pairs `(i, i + 32)`".

* The first sample, the quarter, the minimum of 8 pairs, the quickselect and its budget do not change.
* When the first sample looks nearly sorted in either direction, `min(d, sample - d) < sample / 10`, and the sizes allow a partial sort, and only then, a second sample reads as many pairs `(i, i + 32)`, one per stride of `floor((n - 32) / sample)` values, at an offset drawn by the same generator with another seed. The full sort runs when it is nearly sorted too, by the same measure; otherwise the quickselect.
* 32 is the scale of the minimum run of the native sort (32 to 64 values). In runs of length `L` much longer than that, about `32 / L` of the pairs straddle two runs, so they go the same way as the adjacent pairs; in shorter runs most of them straddle two runs, at unrelated levels, and about half descend.
* The second sample uses the order of the pairs of the first one, which reads only the values and keys of the two indices, so a sort that ends in the full sort reads at most `4 * sample` more keys than the full sort alone. Random data never reads it.
* The boundary is around runs of 160 values, where the sample is about a tenth, and the same data can fall on either side with another seed: the quickselect measured +50% to +439% against the full sort at runs of 128 to 256 and on a sawtooth of ramps of 317, so on this boundary neither path is slower than today.

Measured with Node 24 on 100,000 values, the whole window against the full sort of the same data (spike of #207; the values of runs at random levels):

| data | A | B | D |
| --- | --- | --- | --- |
| records by score, first 10 | +482% | +477% | −1% |
| records by score, first 1,000 | +451% | +433% | +1% |
| records by score, page 20,000 + 10 | +81% | +71% | −1% |
| runs of 8 to 128 values, and descending runs of 12 and 64 | +11% to +580% | +8% to +566% | −2% to +1% |
| ascending runs of 64 in descending order, first 10 and page | +44%, +16% | −3%, +1% | 0%, +1% |
| ascending runs of 1,000 in descending order, page | −1% | **−24%** | 0% |
| sorted, reversed, 1% of swaps both ways, reversed strings, records latest first | −5% to +2% | −8% to +1% | −4% to +3% |

B measures the global order, with pairs about `n / 256` apart, not the length of the runs, which is what the native sort pays for: it breaks the driver "never slower than today". Setting the elements aside while reading the source would add a random number per value, for the same sample that the array gives for free.

The bench of the library is the gate (`pnpm bench:report functions/sort`, commit ffe5952). Chain against `toSorted(compare).slice(…)`:

| window | by a key, ADR 0031 → now | by a function, ADR 0031 → now |
| --- | --- | --- |
| first 10 | −22% → +185% | −14% → +236% |
| first 1,000 | −18% → +126% | −13% → +221% |
| page 20,000 + 10 | −20% → +46% | −13% → +67% |

Every group on data sorted or nearly sorted in either direction, and the new group on ascending runs of 1,000 in descending order, is within the noise of today, the same sort hidden by a `map`, except the first 10 reversed strings: 5.22 ms against 4.98 ms, with an rme of ±1.8% and ±1.9%. Three rounds in pairs of `main` and this change, at 2,000 ms a case, show that the gap is not the second sample: the window took 4.71, 4.78 and 4.84 ms on `main`, 4.82, 4.77 and 4.71 ms with it.

### Positive Consequences

* The negative consequence of ADR 0031 on short runs is gone: `sort('score').take(10)` on the records of the bench is several times faster, with the calls users already write
* More data takes the quickselect and gains: clustered data, short runs in either direction, and random data sorted only at the positions of the first sample
* Data in long runs takes the full sort as before, with 256 more comparisons at most

### Negative Consequences

* A second threshold, gap and seed to maintain, and the positions to write again in the test helpers
* Near runs of 160 values the path depends on the positions of the sample; it is deterministic for the same input, but two similar inputs can take different paths, both not slower than today
* A sawtooth of ramps of `sqrt(n)` and similar data can stay on the full sort, without the gain, depending on the same positions

## Pros and Cons of the Options

### A: pairs `(i, i + 32)`

* Good, because it measures at the scale that decides the cost of the native sort
* Good, because it costs 256 comparisons, only when the first sample looks nearly sorted
* Bad, because the boundary is a threshold on a sample, with some noise around it

### B: elements at random positions

* Good, because it costs as little as A, and it gains on sawtooth data
* Bad, because long runs read as a page take the quickselect (−24%) and runs of 64 lose the gain
* Bad, because the positions have to be sorted, and sorted data is measurably slower (down to −9%)

### C: follow the runs

* Good, because it measures the length of the runs directly
* Bad, because it costs up to 8,000 comparisons, against 256, for the same answer on the shapes measured; not measured for that reason

### D: keep the rule

* Good, because it needs no change
* Bad, because the records of the bench stay slower than the native sort, where a partial sort is several times faster
