/**
 * Test-only infinite source: every iteration yields 0, 1, 2, …
 * `stats.reads` counts the values read across iterations; reading more than `maxReads` throws,
 * so a test whose operation does not stop fails instead of hanging. `stats.closed` becomes true when an iteration ends: closed by the consumer, or past `maxReads`.
 * @param maxReads the number of reads after which the source throws
 */
export function infiniteSource(maxReads = 1000): { stats: { reads: number; closed: boolean }; iterable: Iterable<number> } {
	const stats = { reads: 0, closed: false };
	const iterable = {
		*[Symbol.iterator]() {
			let value = 0;
			try {
				while (true) {
					if (++stats.reads > maxReads)
						throw new Error(`infiniteSource: read more than ${maxReads} values`);
					yield value++;
				}
			} finally {
				stats.closed = true;
			}
		}
	};
	return { stats, iterable };
}
