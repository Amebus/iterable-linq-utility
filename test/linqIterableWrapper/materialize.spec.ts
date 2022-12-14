import { beforeEach, describe, expect, test } from "vitest";

import * as LinqIterable from '../../src';

import { LinkedListCollection } from "@/genericCollections";

describe('materialize', () => {
	
	const rangeIterableItemCount = 50;
	const generatedRange = LinqIterable.fromRange(rangeIterableItemCount);
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
	])('LinqIterable.from($iterable).materialize() generate new iterable with same data', ({ iterable }) => {
		const materialized = LinqIterable
			.from(iterable as any)
			.materialize();
		expect(materialized).not.toBe(iterable);
		expect([...materialized]).toEqual([...iterable]);

		const materialized2 = LinqIterable.from(iterable as any).materialize();
		expect(materialized2).not.toBe(materialized);
		expect([...materialized2]).toEqual([...materialized]);
	});

	test.each([
		{ iterable: generatedRange, iterableItemCount: rangeIterableItemCount , filterPredicate: v => { filtersCount++;	return v % 4 === 0;	} },
		{ iterable: linkedList, iterableItemCount: linkedList.size() , filterPredicate: v => { filtersCount++;	return v % 4 === 0;	} },
		{ iterable: stringIterable, iterableItemCount: stringIterableItemCount , filterPredicate: v => { filtersCount++;	return v === 'm'; } }
	])('LinqIterable.from($iterable).materialize() imediatly iterate the source iterable', ({ iterable, iterableItemCount, filterPredicate }) => {

		const filtered =  LinqIterable
			.from(iterable as any)
			.filter(filterPredicate);
		expect(filtersCount).toBe(0);
		filtered.materialize();
		expect(filtersCount).toBe(iterableItemCount);
	});

	test.each([
		{ iterable: generatedRange, iterableItemCount: rangeIterableItemCount , filterPredicate: v => { filtersCount++;	return v % 4 === 0;	} },
		{ iterable: linkedList, iterableItemCount: linkedList.size() , filterPredicate: v => { filtersCount++;	return v % 4 === 0;	} },
		{ iterable: stringIterable, iterableItemCount: stringIterableItemCount , filterPredicate: v => { filtersCount++;	return v === 'm'; } }
	])('LinqIterable.from($iterable).materialize() do not itarate the source iterable multiple time', ({ iterable, iterableItemCount, filterPredicate }) => {

		const filtered = LinqIterable
			.from(iterable as any)
			.filter(filterPredicate);
		const materialized = filtered.materialize();
		const filterResult1 = [...materialized];
		expect(filtersCount).toBe(iterableItemCount);
		const filterResult2 = [...materialized];
		expect(filtersCount).toBe(iterableItemCount);
		
		expect(filterResult1).toEqual(filterResult2);
	});

});