import { unfold } from '../iterators';
import { Validations } from '../utils';

export function repeat<T>(value: T, count: number): Iterable<T> {
	Validations.throwIfNotNonNegativeInteger(count, 'count');
	return unfold(count, left => left > 0 ? [value, left - 1] as const : undefined);
}
