/**
 * Callback of `filter` and `some`: tests a value.
 * @param value - the current value
 * @param index - the position of `value` in the chain, starting from 0
 * @returns `true` if `value` satisfies the condition
 * @since 0.0.13
 */
export type Predicate<T> = (value: T, index: number) => boolean;
