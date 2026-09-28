/**
 * Options of `memoize`.
 * @since 0.1.0
 */
export interface IMemoizeOptions {
	/** `true` (default): the cache fills as far as consumers read. `false`: the first read drains the whole source. */
	allowPartialMemoization?: boolean;
}
