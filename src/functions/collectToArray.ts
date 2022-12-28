export function collectToArray<T>(iterable: Iterable<T>): T[] {
	if (iterable == null)
		throw 'The source "iterable" must be provided';
	return Array.from(iterable);
}