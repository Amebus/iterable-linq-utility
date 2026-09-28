/**
 * Callback of `map` and `flatMap`: turns a value into a new one.
 * @param value - the current value
 * @param index - the position of `value` in the chain, starting from 0
 * @returns the new value
 * @since 0.0.13
 */
export type Mapper<T, R> = (value: T, index: number) => R;
