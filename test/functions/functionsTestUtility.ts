import { expect } from 'vitest';

export function returnClosesTheIterator<T>(iterable: Iterable<T>, returnValue: any) {
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
}

export function withoutInputIterableThrowsException(fn: any) {
	expect(() => fn()).toThrowError();
	expect(() => fn(undefined)).toThrowError();
	expect(() => fn(null)).toThrowError();
}

export async function withoutInputIterableThrowsExceptionAsync(fn: any) {
	await expect(() => fn()).rejects.toThrowError();
	await expect(() => fn(undefined)).rejects.toThrowError();
	await expect(() => fn(null)).rejects.toThrowError();
}