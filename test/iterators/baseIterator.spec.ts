import { describe, expect, test } from 'vitest';

import { BaseIterator } from '@/iterators';
import { getContinueIteratorResult, getDoneIteratorResult } from '@/utils';

class CountTo3 extends BaseIterator<number> {
	returnCalls = 0;
	returnValues: unknown[] = [];
	private current = 0;

	protected advance(): IteratorResult<number> {
		this.current++;
		return this.current <= 3 ? getContinueIteratorResult(this.current) : getDoneIteratorResult();
	}

	protected override onReturn(value?: unknown): void {
		this.returnCalls++;
		this.returnValues.push(value);
	}
}

describe('BaseIterator', () => {

	test('done is sticky', () => {
		const it = new CountTo3();
		expect([it.next(), it.next(), it.next()].map(r => r.value)).toEqual([1, 2, 3]);
		expect(it.next().done).toBe(true);
		for (let i = 0; i < 3; i++)
			expect(it.next()).toEqual({ done: true, value: undefined });
	});

	test('return() is idempotent', () => {
		const it = new CountTo3();
		it.next();
		expect(it.return('x')).toEqual({ done: true, value: 'x' });
		it.return('y');
		expect(it.returnCalls).toBe(1);
		expect(it.next().done).toBe(true);
	});

	test('return() after natural completion does not call onReturn', () => {
		const it = new CountTo3();
		Array.from({ length: 4 }, () => it.next());
		it.return();
		expect(it.returnCalls).toBe(0);
	});

	test('is its own iterable', () => {
		const it = new CountTo3();
		expect(it[Symbol.iterator]()).toBe(it);
	});

	test('return(value) passes the value to onReturn', () => {
		const it = new CountTo3();
		it.next();
		it.return('x');
		expect(it.returnValues).toEqual(['x']);
	});

	test('has no throw method', () => {
		expect('throw' in new CountTo3()).toBe(false);
	});

});
