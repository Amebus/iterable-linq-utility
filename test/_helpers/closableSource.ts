/**
 * Test-only source backed by a generator: `state.closed` becomes true when the generator is closed.
 */
export function closableSource(values: number[]): { state: { closed: boolean }; iterable: Iterable<number> } {
	const state = { closed: false };
	const iterable = {
		*[Symbol.iterator]() {
			try {
				yield* values;
			} finally {
				state.closed = true;
			}
		}
	};
	return { state, iterable };
}
