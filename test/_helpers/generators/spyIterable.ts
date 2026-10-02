export interface ISpyIterableStats {
	/** Number of times `[Symbol.iterator]` has been called */
	iterations: number;
	/** Number of values read from the source */
	reads: number;
}

export interface ISpyIterable<T> extends Iterable<T> {
	readonly stats: ISpyIterableStats;
}

/**
 * Test-only source that records how it is consumed
 * @param values the values yielded on every iteration
 */
export function spyIterable<T>(values: T[]): ISpyIterable<T> {
	const stats: ISpyIterableStats = { iterations: 0, reads: 0 };
	return {
		stats,
		*[Symbol.iterator]() {
			stats.iterations++;
			for (const value of values) {
				stats.reads++;
				yield value;
			}
		}
	};
}
