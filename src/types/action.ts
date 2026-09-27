import { Unit } from './unit';

/**
 * Callback of `forEach`: a side effect run on each value. It returns `unit()` because it has nothing to return.
 * @param value - the current value
 * @param index - the position of `value` in the chain, starting from 0
 * @since 0.0.13
 */
export type Action<T> = (value: T, index: number) => Unit;

/**
 * Callback of `forEachAsync`: an async side effect run on each value.
 * @param value - the current value
 * @param index - the position of `value` in the chain, starting from 0
 * @returns a promise of `unit()`; a rejection stops `forEachAsync`
 * @since 0.0.13
 */
export type AsyncAction<T> = (value: T, index: number) => Promise<Unit>;
