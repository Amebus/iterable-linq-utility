import { Validations } from "../utils";

/**
 * Collect the data of the input `Iterable` into an `Array`
 * @param iterable input iterable
 * @returns the array generated from the input iterable
 */
export function collectToArray<T>(iterable: Iterable<T>): T[] {
	Validations.throwIfNotIterable(iterable);
	return Array.from(iterable);
}