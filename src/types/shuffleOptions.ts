/**
 * Options of `shuffle`.
 * @since next
 */
export interface IShuffleOptions<TSeed = number> {
	/** Repeats the same order at every iteration. Without `random` it is an integer, of which 32 bits are used. */
	seed?: TSeed;
	/**
	 * Called with `seed` once per iteration, returns the generator: a function called once per value that returns a number
	 * from 0 up to, but not including, 1. Default: `Math.random`, or the generator of the library with a `seed`.
	 */
	random?: (seed: TSeed) => () => number;
}
