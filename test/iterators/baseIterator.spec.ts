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

/** Calls `callback` on each value, closing like the operations do when it throws. */
class WithCallback extends CountTo3 {
	constructor(private readonly callback: (it: WithCallback) => void, private readonly onReturnError?: Error) {
		super();
	}

	protected override advance(): IteratorResult<number> {
		const result = super.advance();
		try {
			this.callback(this);
		} catch (error) {
			this.closeAfterCallbackError();
			throw error;
		}
		return result;
	}

	protected override onReturn(value?: unknown): void {
		super.onReturn(value);
		if (this.onReturnError)
			throw this.onReturnError;
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

	describe('closeAfterCallbackError', () => {

		test('ends the iterator and calls onReturn once', () => {
			const error = new Error('callback');
			const it = new WithCallback(() => { throw error; });
			expect(() => it.next()).toThrow(error);
			expect(it.returnCalls).toBe(1);
			expect(it.next().done).toBe(true);
			it.return();
			expect(it.returnCalls).toBe(1);
		});

		test('does not call onReturn again when the callback already called return()', () => {
			const error = new Error('callback');
			const it = new WithCallback(self => {
				self.return();
				throw error;
			});
			expect(() => it.next()).toThrow(error);
			expect(it.returnCalls).toBe(1);
		});

		test('the callback error wins over an error of onReturn', () => {
			const error = new Error('callback');
			const it = new WithCallback(() => { throw error; }, new Error('onReturn'));
			expect(() => it.next()).toThrow(error);
			expect(it.returnCalls).toBe(1);
		});

	});

});
