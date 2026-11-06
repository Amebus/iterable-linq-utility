/**
 * Creates a seeded generator of numbers in `[0, 1)`: the same seed always gives the same values. It uses 32 bits of the seed.
 * The order of `shuffle(x, { seed })` depends on these values, and it is a promise: changing this function is a breaking change.
 * @param seed - an integer
 * @returns a function that returns the next value at each call
 */
export function mulberry32(seed: number): () => number {
	let state = seed | 0;
	return () => {
		state = (state + 0x6D2B79F5) | 0;
		let t = Math.imul(state ^ (state >>> 15), 1 | state);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}
