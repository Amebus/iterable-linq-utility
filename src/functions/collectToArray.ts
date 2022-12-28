export function collectToArray<T>(iterable: Iterable<T>): T[] {
	return Array.from(iterable);
}