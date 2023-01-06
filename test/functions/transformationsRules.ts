import { expect, vi } from 'vitest';
import { Mapper, Predicate, Tapper, unit, Unit } from './_types';

import { collectToArray, range } from './_functions';

import {
	filter,
	flatMap,
	tap,
	tapChain
} from './_functions';

import { map } from './_functions';

type FnT<T> = Predicate<T> | Tapper<T> | Tapper<Iterable<T>>;
type FnTR<T,R> = Mapper<T,R> | Mapper<T, Iterable<T>>;

type Transformation = 
	typeof filter | typeof flatMap |
	typeof map |
	typeof tap | typeof tapChain
;

export function isTransformation<T>(transformation: Transformation,	fnToSpy: FnT<T>): Unit;
export function isTransformation<T,R>(transformation: Transformation,	fnToSpy: FnTR<T,R>): Unit;
export function isTransformation<T,R>(transformation: Transformation,	fnToSpy: FnT<T> | FnTR<T,R>): Unit {

	[
		range(0,20),
		range(10,30),
		range(-10,10),
		range(10,-10),
		range(10,-30)
	].forEach(iterable => {
		const spy = vi.fn(fnToSpy as any) as FnT<T> | FnTR<T,R>;
		const transform = transformation as any;
		const transformed = transform(iterable, spy);

		expect(spy).not.toHaveBeenCalled();
		collectToArray(transformed);
		expect(spy).toHaveReturned();
	});

	return unit();
}
