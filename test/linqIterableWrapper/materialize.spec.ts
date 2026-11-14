import { describe, expect, test, vi } from 'vitest';
import { expectAction } from '../_helpers/operationKind';

import { LinkedListCollection } from '@/collections';
import * as IterableLinq from '@/index';
import { Functions } from '@/index';

describe('IterableLinq.materialize', () => {

	const rangeIterableItemCount = 50;
	const generatedRange = IterableLinq.fromRange(rangeIterableItemCount);
	const linkedList = LinkedListCollection.from(generatedRange);
	const stringIterable = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.';
	const stringIterableItemCount = stringIterable.length;

	test.each([
		{ iterable: generatedRange },
		{ iterable: linkedList },
		{ iterable: stringIterable }
	])('IterableLinq.from($iterable).materialize() generate new iterable with same data', ({ iterable }) => {
		const materialized = IterableLinq
			.from(iterable as any)
			.materialize();
		expect(materialized).not.toBe(iterable);
		expect([...materialized]).toEqual([...iterable]);

		const materialized2 = IterableLinq.from(iterable as any).materialize();
		expect(materialized2).not.toBe(materialized);
		expect([...materialized2]).toEqual([...materialized]);
	});

	test.each([
		{ iterable: generatedRange, iterableItemCount: rangeIterableItemCount , filterPredicate: v => v % 4 === 0 },
		{ iterable: linkedList, iterableItemCount: linkedList.size() , filterPredicate: v => v % 4 === 0 },
		{ iterable: stringIterable, iterableItemCount: stringIterableItemCount , filterPredicate: v => v === 'm' }
	])('IterableLinq.from($iterable).materialize() imediatly iterate the source iterable', ({ iterable, iterableItemCount, filterPredicate }) => {

		const filterPredicateSpy = vi.fn(filterPredicate);
		const filtered =  IterableLinq
			.from(iterable as any)
			.filter(filterPredicateSpy);
		expect(filterPredicateSpy).not.toHaveBeenCalled();
		filtered.materialize();
		expect(filterPredicateSpy).toHaveBeenCalledTimes(iterableItemCount);

	});

	test.each([
		{ iterable: generatedRange, iterableItemCount: rangeIterableItemCount , filterPredicate: v => v % 4 === 0 },
		{ iterable: linkedList, iterableItemCount: linkedList.size() , filterPredicate: v => v % 4 === 0 },
		{ iterable: stringIterable, iterableItemCount: stringIterableItemCount , filterPredicate: v => v === 'm' }
	])('IterableLinq.from($iterable).materialize() does not itarate the source iterable multiple time', ({ iterable, iterableItemCount, filterPredicate }) => {

		const filterPredicateSpy = vi.fn(filterPredicate);
		const filtered = IterableLinq
			.from(iterable as any)
			.filter(filterPredicateSpy);
		const materialized = filtered.materialize();
		const filterResult1 = materialized.collectToArray();
		expect(filterPredicateSpy).toHaveBeenCalledTimes(iterableItemCount);
		const filterResult2 = materialized.collectToArray();
		expect(filterPredicateSpy).toHaveBeenCalledTimes(iterableItemCount);

		expect(filterResult1).toEqual(filterResult2);

	});

	test('IterableLinq.materialize is action', () => {
		expectAction(source => IterableLinq.from(source).materialize());
	});

	test('the Actions after materialize read the stored values without iterating them', () => {
		const materialized = IterableLinq.from([1, 5, 2, 5]).map(v => v * 10).materialize();
		const iterator = vi.spyOn(Object.getPrototypeOf(Functions.materialize([])), Symbol.iterator);
		try {
			expect(materialized.count()).toBe(4);
			expect(materialized.at(-1)).toBe(50);
			expect(materialized.lastIndexOf(50)).toBe(3);
			expect(iterator).not.toHaveBeenCalled();
		} finally {
			iterator.mockRestore();
		}
	});

});
