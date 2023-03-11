import { Validations } from "../utils";

export function collectToArray<T>(iterable: Iterable<T>): T[] {
	Validations.throwIfNotIterable(iterable);
	return Array.from(iterable);
}