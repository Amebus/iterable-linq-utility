import { Unit } from './unit';

/**
 * Callback of `tap` and `tapChain`: observes a value without changing it.
 * @param value - the current value (for `tapChain`, the upstream `Iterable`)
 * @param index - the position of `value` in the chain, starting from 0 (for `tapChain`, always 0)
 * @since 0.0.13
 */
export type Tapper<T> = (value: T, index: number) => Unit;
