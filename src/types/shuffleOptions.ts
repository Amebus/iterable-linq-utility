/**
 * Options of `shuffle`, in two forms:
 * - `{ seed? }`: `Math.random`, or with `seed` the generator of the library. The `seed` is an integer, of which 32 bits are
 * used, and it repeats the order at every iteration.
 * - `{ seed, random }`: `random` is called with `seed` once per iteration and returns the generator: a function called once
 * per value that returns a number from 0 up to, but not including, 1. The order repeats only if `random` creates a new
 * generator from the seed at each call. The `seed` can be omitted only if `random` accepts `undefined`, which it then receives.
 * @since next
 */
export type IShuffleOptions<TSeed = number> =
	| { seed?: number; random?: undefined }
	| ({ seed?: TSeed; random: (seed: TSeed) => () => number } & (undefined extends TSeed ? unknown : { seed: TSeed }));
