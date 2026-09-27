import type { IIterableLinq } from './iterableLinq';

/**
 * Implementation of a method added with `extend` or `override`. `this` is the chain the method is called on.
 */
export type ChainMethod = (this: IIterableLinq<unknown>, ...args: any[]) => unknown;
