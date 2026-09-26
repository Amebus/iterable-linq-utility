import { unfold } from '../iterators';

export function empty<T>(): Iterable<T> {
	return unfold<undefined, T>(undefined, () => undefined);
}
