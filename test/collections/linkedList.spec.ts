import { describe, expect, test } from 'vitest';

import { LinkedListCollection } from './_collections';

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
	])('addFirst($input)', ({ input }) => {
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
	])('addLast($input)', ({ input }) => {
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

	test.each([
		{ },
		{input: undefined},
		{input: null},
	])('from($noInput) -> throws exception', ({ input }) => {
		expect(() => from(input)).toThrowError();
	});


	test.each([
		{input: [1,2,3,4], returnValue: 'a value'},
		{input: [1,2,3,4], returnValue: 123},
		{input: [1,2,3,4], returnValue: null},
		{input: [-3,-5,-8,1,2,3,4], returnValue: 'a value'},
		{input: [-3,-5,-8,1,2,3,4], returnValue: 123},
		{input: [-3,-5,-8,1,2,3,4], returnValue: null},
	])('from($input)[Symbol.iterator]().return() closes the iterator', ({ input, returnValue }) => {
		const iterable = from(input);

		const iterator = iterable[Symbol.iterator]();
		const r = iterator.return!(returnValue);
		expect(r).toEqual({ done: true, value: returnValue });
		const next = iterator.next();
		expect(next.done).toBe(true);

		const iterator2 = iterable[Symbol.iterator]();
		iterator2.next();
		iterator2.next();
		const r2 = iterator.return!(returnValue);
		expect(r2).toEqual({ done: true, value: returnValue });
		const next2 = iterator.next();
		expect(next2.done).toBe(true);

		const iterator3 = iterable[Symbol.iterator]();
		iterator3.next();
		iterator3.next();
		iterator3.next();
		const r3 = iterator.return!(returnValue);
		expect(r3).toEqual({ done: true, value: returnValue });
		const next3 = iterator.next();
		expect(next3.done).toBe(true);
	});

});