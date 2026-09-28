import { describe, expect, test, vi } from 'vitest';
import { closableSource } from '../_helpers/closableSource';

import { filter, flatMap, map, tap } from '@/functions';
import { unit } from '@/types';

const boom = new Error('boom');

function throwOn2(v: number): void {
	if (v === 2)
		throw boom;
}

const operations = [
	{ name: 'map', apply: (it: Iterable<number>) => map(it, v => (throwOn2(v), v)) },
	{ name: 'filter', apply: (it: Iterable<number>) => filter(it, v => (throwOn2(v), true)) },
	{ name: 'tap', apply: (it: Iterable<number>) => tap(it, v => (throwOn2(v), unit())) },
	{ name: 'flatMap', apply: (it: Iterable<number>) => flatMap(it, v => (throwOn2(v), [v])) }
];

/**
 * A source whose `next()` throws on the second call, and records the `return()` calls.
 */
function throwingSource(): { returnSpy: ReturnType<typeof vi.fn>; iterable: Iterable<number> } {
	const returnSpy = vi.fn(() => ({ done: true as const, value: undefined }));
	let calls = 0;
	const iterator: Iterator<number> = {
		next: () => {
			if (++calls === 2)
				throw boom;
			return { done: false, value: calls };
		},
		return: returnSpy
	};
	return { returnSpy, iterable: { [Symbol.iterator]: () => iterator } };
}

describe('errors thrown while iterating', () => {

	test.each(operations)('$name: a throwing callback closes the source', ({ apply }) => {
		const { state, iterable } = closableSource([1, 2, 3, 4]);
		const iterator = apply(iterable)[Symbol.iterator]();

		expect(iterator.next()).toEqual({ done: false, value: 1 });
		expect(() => iterator.next()).toThrow(boom);
		expect(state.closed).toBe(true);
	});

	test.each(operations)('$name: after a throwing callback the iterator is done', ({ apply }) => {
		const { iterable } = closableSource([1, 2, 3, 4]);
		const iterator = apply(iterable)[Symbol.iterator]();

		iterator.next();
		expect(() => iterator.next()).toThrow(boom);
		expect(iterator.next()).toEqual({ done: true, value: undefined });
	});

	test.each(operations)('$name: a throwing source is not closed', ({ apply }) => {
		const { returnSpy, iterable } = throwingSource();
		const iterator = apply(iterable)[Symbol.iterator]();

		iterator.next();
		expect(() => iterator.next()).toThrow(boom);
		expect(returnSpy).not.toHaveBeenCalled();
	});

	// Unlike the ECMAScript Iterator Helpers, the chain leaves the state after a source error to the source:
	// marking the chain as done would need a try/catch around every read of the source.
	test.each(operations)('$name: after a source error, next() asks the source again', ({ apply }) => {
		const { iterable } = throwingSource();
		const iterator = apply(iterable)[Symbol.iterator]();

		iterator.next();
		expect(() => iterator.next()).toThrow(boom);
		expect(iterator.next()).toEqual({ done: false, value: 3 });
	});

	test.each(operations)('$name: a throwing generator source ends the chain', ({ apply }) => {
		const source: Iterable<number> = {
			*[Symbol.iterator]() {
				yield 1;
				throw boom;
			}
		};
		const iterator = apply(source)[Symbol.iterator]();

		iterator.next();
		expect(() => iterator.next()).toThrow(boom);
		expect(iterator.next()).toEqual({ done: true, value: undefined });
	});

	test.each(operations)('$name: an error thrown while closing the source does not hide the callback error', ({ apply }) => {
		const source: Iterable<number> = {
			[Symbol.iterator]: () => {
				let i = 0;
				return {
					next: () => ({ done: false, value: ++i }),
					return: () => {
						throw new Error('close');
					}
				};
			}
		};
		const iterator = apply(source)[Symbol.iterator]();

		iterator.next();
		expect(() => iterator.next()).toThrow(boom);
	});

	test('flatMap: a throwing inner iterable closes the outer source, not the inner one', () => {
		const outer = closableSource([1, 2, 3]);
		const innerReturn = vi.fn(() => ({ done: true as const, value: undefined }));
		const inner: Iterable<number> = {
			[Symbol.iterator]: () => ({
				next: () => {
					throw boom;
				},
				return: innerReturn
			})
		};
		const iterator = flatMap(outer.iterable, () => inner)[Symbol.iterator]();

		expect(() => iterator.next()).toThrow(boom);
		expect(outer.state.closed).toBe(true);
		expect(innerReturn).not.toHaveBeenCalled();
		expect(iterator.next()).toEqual({ done: true, value: undefined });
	});

});
