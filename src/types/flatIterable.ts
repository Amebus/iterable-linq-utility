/**
 * The type of the values of `flat` with `Depth` levels: like `FlatArray`, for any `Iterable` except strings.
 * A `Depth` of type `number` (for example `Infinity`) gives a wide type, as `FlatArray` does.
 * @since next
 */
export type FlatIterable<T, Depth extends number> = {
	done: T;
	// eslint-disable-next-line @typescript-eslint/no-wrapper-object-types -- a String object is iterable, and flat does not flatten it either
	recur: T extends string | String
		? T
		: T extends Iterable<infer U>
			? FlatIterable<U, [-1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20][Depth]>
			: T;
}[Depth extends 0 ? 'done' : 'recur'];
