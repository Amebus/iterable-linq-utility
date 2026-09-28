/**
 * Callback of `reduce`: combines the accumulator with a value.
 * @param acc - the accumulator: the seed for the first value, then the result of the previous call
 * @param value - the current value
 * @param index - the position of `value` in the chain, starting from 0
 * @returns the new accumulator
 * @since 0.0.13
 */
export type Reducer<T, R> = (acc: R, value: T, index: number) => R;
