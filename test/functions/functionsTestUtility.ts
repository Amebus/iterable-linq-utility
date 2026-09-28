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
	const r2 = iterator2.return!(returnValue);
	expect(r2).toEqual({ done: true, value: returnValue });
	const next2 = iterator2.next();
	expect(next2.done).toBe(true);

	const iterator3 = iterable[Symbol.iterator]();
	iterator3.next();
	iterator3.next();
	iterator3.next();
	const r3 = iterator3.return!(returnValue);
	expect(r3).toEqual({ done: true, value: returnValue });
	const next3 = iterator3.next();
	expect(next3.done).toBe(true);
}

export function withoutInputIterableThrowsException(fn: any) {
	expect(() => fn()).toThrow();
	expect(() => fn(undefined)).toThrow();
	expect(() => fn(null)).toThrow();
}

export async function withoutInputIterableThrowsExceptionAsync(fn: any) {
	await expect(() => fn()).rejects.toThrow();
	await expect(() => fn(undefined)).rejects.toThrow();
	await expect(() => fn(null)).rejects.toThrow();
}
