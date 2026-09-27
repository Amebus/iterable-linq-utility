type ComparerFunction<T> = (a: T, b: T) => number;
type ComparingProps<T> = keyof T | Array<keyof T>;

/**
 * How `min` and `max` compare two values. One of:
 * - a compare function `(a, b) => number`: negative if `a` comes before `b`, 0 if they are equal, positive if `a` comes after `b`;
 * - a key: the values are compared by that property, with `<`;
 * - a list of keys: the values are compared by the first key, ties are broken by the next one, and so on.
 * @example
 * ```ts
 * IterableLinq.from(people).max((a, b) => a.age - b.age);
 * IterableLinq.from(people).max('age');
 * IterableLinq.from(people).min(['lastName', 'firstName']);
 * ```
 * @since 0.0.13
 */
export type Comparer<T> = ComparerFunction<T> | ComparingProps<T>;
