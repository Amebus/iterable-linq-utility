import { describe, expect, test } from 'vitest';

import { LinkedListCollection } from '@/genericCollections';

const { from, LinkedList, LinkedListIterator } = LinkedListCollection;

describe('LinkedList', () => {

	test('new LinkedList()', () => {
		const list = new LinkedList<number>();

		expect(list).instanceof(LinkedList);
		expect(list.size()).toEqual(0);
		expect(list[Symbol.iterator]).instanceOf(Function);
		expect(list[Symbol.iterator]()).instanceOf(LinkedListIterator);

	});

	test.each([
		{input: [1,2,3,4,5,6,7,8,9]},
		{input: [-1,-2,-3,-4,-5,-6,-7,-8,-9]},
		{input: [1,2,3,4]},
		{input: [-3,-5,-8,1,2,3,4]},
	])('addFirst | $input', ({ input }) => {
		const list = new LinkedList<number>();
		
		let size = 0;
		for(const item of input) {
			list.addFirst(item);
			expect(list.size()).toEqual(++size);
		}
		
		expect([...list]).toEqual(input.reverse());
	});

	test.each([
		{input: [1,2,3,4,5,6,7,8,9]},
		{input: [-1,-2,-3,-4,-5,-6,-7,-8,-9]},
		{input: [1,2,3,4]},
		{input: [-3,-5,-8,1,2,3,4]},
	])('addLast | $input', ({ input }) => {
		const list = new LinkedList<number>();
		
		let size = 0;
		for(const item of input) {
			list.addLast(item);
			expect(list.size()).toEqual(++size);
		}
		
		expect([...list]).toEqual(input);
	});

	test.each([
		{input: [1,2,3,4,5,6,7,8,9]},
		{input: [-1,-2,-3,-4,-5,-6,-7,-8,-9]},
		{input: [1,2,3,4]},
		{input: [-3,-5,-8,1,2,3,4]},
	])('from($input)', ({ input }) => {
		const list = from(input);

		expect(list).instanceof(LinkedList);
		expect(list.size()).toEqual(input.length);

		let idx = 0;
		for(const item of list) {
			expect(item).toEqual(input[idx]);
			idx++;
		}
	});

});