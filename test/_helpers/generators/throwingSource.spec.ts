import { describe, expect, test } from 'vitest';

import { throwingSource } from './throwingSource';

describe('throwingSource', () => {

	test('yields the number of the call, and throws at the failAt-th call', () => {
		const error = new Error('boom');
		const it = throwingSource(3, error).iterable[Symbol.iterator]();
		expect(it.next()).toEqual({ done: false, value: 1 });
		expect(it.next()).toEqual({ done: false, value: 2 });
		expect(() => it.next()).toThrow(error);
	});

	test('can be read again after the error', () => {
		const error = new Error('boom');
		const it = throwingSource(1, error).iterable[Symbol.iterator]();
		expect(() => it.next()).toThrow(error);
		expect(it.next()).toEqual({ done: false, value: 2 });
	});

	test('every iteration counts from 1 again', () => {
		const error = new Error('boom');
		const { iterable } = throwingSource(2, error);
		iterable[Symbol.iterator]().next();
		const it = iterable[Symbol.iterator]();
		expect(it.next()).toEqual({ done: false, value: 1 });
		expect(() => it.next()).toThrow(error);
	});

	test('returnSpy records the calls to return()', () => {
		const { returnSpy, iterable } = throwingSource(2, new Error('boom'));
		const it = iterable[Symbol.iterator]();
		expect(returnSpy).not.toHaveBeenCalled();
		expect(it.return!()).toEqual({ done: true, value: undefined });
		expect(returnSpy).toHaveBeenCalledTimes(1);
	});

});
