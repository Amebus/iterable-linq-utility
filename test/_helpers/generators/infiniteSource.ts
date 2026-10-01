/**
 * Test-only infinite source: every iteration yields 0, 1, 2, …
 * `stats.reads` counts the values read across iterations; reading more than `maxReads` throws,
 * so a test whose operation does not stop fails instead of hanging.
 * @param maxReads the number of reads after which the source throws
 */
export function infiniteSource(maxReads = 1000): { stats: { reads: number }; iterable: Iterable<number> } {
	const stats = { reads: 0 };
	const iterable = {
		*[Symbol.iterator]() {
			let value = 0;
			while (true) {
				if (++stats.reads > maxReads)
					throw new Error(`infiniteSource: read more than ${maxReads} values`);
				yield value++;
			}
		}
	};
	return { stats, iterable };
}
