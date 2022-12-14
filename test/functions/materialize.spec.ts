import { beforeEach, describe, expect, test } from "vitest";

import { 
	filter,
	materialize,
	range
} from "@/functions";
import { LinkedListCollection } from "@/genericCollections";

describe('materialize', () => {
	
	const rangeIterableItemCount = 50;
	const generatedRange = range(rangeIterableItemCount);
	const linkedList = LinkedListCollection.from(generatedRange);
	const stringIterable = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.';
	const stringIterableItemCount = stringIterable.length;

	let filtersCount = 0;

	beforeEach(() => {
		filtersCount = 0;
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
		expect([...materialized]).toEqual([...iterable]);

		const materialized2 = materialize(iterable as any);
		expect(materialized2).not.toBe(materialized);
		expect(materialized2).toEqual(materialized);
		expect([...materialized2]).toEqual([...materialized]);
	});

	test.each([
		{ iterable: generatedRange },
		{ iterable: linkedList },
		{ iterable: stringIterable }
	])('materialize($iterable) doesn\'t generate new iterable from itself', ({ iterable }) => {
		const materialized = materialize(iterable as any);
		const materialized2 = materialize(materialized);
		expect(materialized2).toBe(materialized);
	});

	test.each([
		{ iterable: generatedRange, iterableItemCount: rangeIterableItemCount , filterPredicate: v => { filtersCount++;	return v % 4 === 0;	} },
		{ iterable: linkedList, iterableItemCount: linkedList.size() , filterPredicate: v => { filtersCount++;	return v % 4 === 0;	} },
		{ iterable: stringIterable, iterableItemCount: stringIterableItemCount , filterPredicate: v => { filtersCount++;	return v === 'm'; } }
	])('materialize($iterable) imediatly iterate the source iterable', ({ iterable, iterableItemCount, filterPredicate }) => {

		const filtered = filter(iterable, filterPredicate);
		expect(filtersCount).toBe(0);
		materialize(filtered);
		expect(filtersCount).toBe(iterableItemCount);
	});

	test.each([
		{ iterable: generatedRange, iterableItemCount: rangeIterableItemCount , filterPredicate: v => { filtersCount++;	return v % 4 === 0;	} },
		{ iterable: linkedList, iterableItemCount: linkedList.size() , filterPredicate: v => { filtersCount++;	return v % 4 === 0;	} },
		{ iterable: stringIterable, iterableItemCount: stringIterableItemCount , filterPredicate: v => { filtersCount++;	return v === 'm'; } }
	])('materialize($iterable) do not itarate the source iterable multiple time', ({ iterable, iterableItemCount, filterPredicate }) => {

		const filtered = filter(iterable, filterPredicate);
		const materialized = materialize(filtered);
		const filterResult1 = [...materialized];
		expect(filtersCount).toBe(iterableItemCount);
		const filterResult2 = [...materialized];
		expect(filtersCount).toBe(iterableItemCount);
		
		expect(filterResult1).toEqual(filterResult2);
	});

});