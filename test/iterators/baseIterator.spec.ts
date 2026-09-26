import { describe, expect, test } from 'vitest';

import { BaseIterator } from '../../src/iterators';
import { getContinueIteratorResult, getDoneIteratorResult } from '../../src/utils';

class CountTo3 extends BaseIterator<number> {
	returnCalls = 0;
	private current = 0;

	protected advance(): IteratorResult<number> {
		this.current++;
		return this.current <= 3 ? getContinueIteratorResult(this.current) : getDoneIteratorResult();
	}

	protected override onReturn(): void {
		this.returnCalls++;
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

});
