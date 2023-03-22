import { describe, expect, test, vi } from 'vitest';
import { withoutInputIterableThrowsException } from './functionsTestUtility';

import { 
	collectToArray,
	filter,
	materialize,
	range
} from './_functions';
import { LinkedListCollection } from "./_collections";

describe('materialize', () => {
	
	const rangeIterableItemCount = 50;
	const generatedRange = range(rangeIterableItemCount);
	const linkedList = LinkedListCollection.from(generatedRange);
	const stringIterable = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.';
	const stringIterableItemCount = stringIterable.length;

	test('materialize without input iterable -> throw exception', () => {
		withoutInputIterableThrowsException(materialize);
	});

	test.each([
		{ iterable: generatedRange },
		{ iterable: linkedList },
		{ iterable: stringIterable }
	])('materialize($iterable) generate new iterable with same data', ({ iterable }) => {
		const materialized = materialize(iterable as any);
		expect(materialized).not.toBe(iterable);
		expect(materialized['source']).not.toBe(iterable);
		expect(materialized).not.toEqual(iterable);
		expect(collectToArray(materialized)).toEqual(collectToArray(iterable as any));

		const materialized2 = materialize(iterable as any);
		expect(materialized2).not.toBe(materialized);
		expect(materialized2).toEqual(materialized);
		expect(collectToArray(materialized2)).toEqual(collectToArray(materialized));
	});

	test.each([
		{ iterable: generatedRange },
		{ iterable: linkedList },
		{ iterable: stringIterable }
	])('materialize($iterable) generate new iterable with same data', ({ iterable }) => {
		const data = collectToArray(iterable as any);
		const originalDataLength = data.length;
		
		const materialized = materialize(data as any);
		expect(collectToArray(materialized).length).toEqual(originalDataLength);
		
		data.push(...data);
		const newDataLength = data.length;
		expect(collectToArray(materialized).length).toEqual(originalDataLength);

		// to be sure that data has changed correctly, if we change some code in the previous lines the next one might break
		expect(newDataLength).toEqual(originalDataLength * 2);
	});

	test.each([
		{ iterable: generatedRange },
		{ iterable: linkedList },
		{ iterable: stringIterable }
	])('materialize($iterable) does not generate new iterable from itself', ({ iterable }) => {
		const materialized = materialize(iterable as any);
		const materialized2 = materialize(materialized);
		expect(materialized2).toBe(materialized);
	});

	test.each([
		{ iterable: generatedRange, iterableItemCount: rangeIterableItemCount , filterPredicate: v => v % 4 === 0 },
		{ iterable: linkedList, iterableItemCount: linkedList.size() , filterPredicate: v => v % 4 === 0 },
		{ iterable: stringIterable, iterableItemCount: stringIterableItemCount , filterPredicate: v => v === 'm' }
	])('materialize($iterable) immediatly iterate the source iterable', ({ iterable, iterableItemCount, filterPredicate }) => {

		const filterPredicateSpy = vi.fn(filterPredicate);
		const filtered = filter<string | number>(iterable, filterPredicateSpy);
		expect(filterPredicateSpy).not.toHaveBeenCalled();
		materialize(filtered);
		expect(filterPredicateSpy).toHaveBeenCalledTimes(iterableItemCount);
	});

	test.each([
		{ iterable: generatedRange, iterableItemCount: rangeIterableItemCount , filterPredicate: v => v % 4 === 0 },
		{ iterable: linkedList, iterableItemCount: linkedList.size() , filterPredicate: v => v % 4 === 0 },
		{ iterable: stringIterable, iterableItemCount: stringIterableItemCount , filterPredicate: v => v === 'm' }
	])('materialize($iterable) do not iterate the source iterable multiple time', ({ iterable, iterableItemCount, filterPredicate }) => {

		const filterPredicateSpy = vi.fn(filterPredicate);
		const filtered = filter<string | number>(iterable, filterPredicateSpy);
		const materialized = materialize(filtered);
		const filterResult1 = collectToArray(materialized);
		expect(filterPredicateSpy).toHaveBeenCalledTimes(iterableItemCount);
		const filterResult2 = collectToArray(materialized);
		expect(filterPredicateSpy).toHaveBeenCalledTimes(iterableItemCount);
		
		expect(filterResult1).toEqual(filterResult2);
	});

});