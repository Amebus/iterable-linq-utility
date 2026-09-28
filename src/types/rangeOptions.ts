/**
 * Options of `range`.
 * @since 0.1.0
 */
export interface IRangeOptions {
	/** Distance between two values; defaults to 1. Only its absolute value is used: the direction comes from `start` and `end`. */
	step?: number;
	/** Yields the same values in reverse order; defaults to `false`. */
	reverse?: boolean;
}
