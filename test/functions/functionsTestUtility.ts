import { expect, vi } from 'vitest';

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

// the error names the operation: the name of the raw function, or `operation` when it is exported under another name
export function withoutInputIterableThrowsException(fn: any, operation: string = fn.name) {
	const error = new Error(`[iterable-linq-utility/${operation}] The "iterable" must be provided`);
	expect(() => fn()).toThrow(error);
	expect(() => fn(undefined)).toThrow(error);
	expect(() => fn(null)).toThrow(error);
}

export async function withoutInputIterableThrowsExceptionAsync(fn: any) {
	const prefix = `[iterable-linq-utility/${fn.name}] `;
	await expect(() => fn()).rejects.toThrow(prefix);
	await expect(() => fn(undefined)).rejects.toThrow(prefix);
	await expect(() => fn(null)).rejects.toThrow(prefix);
}

/**
 * Runs `action` with the built-in iterator of `prototype` replaced by a spy, and checks that the action never calls it: the
 * Action reads an array or a `Set` without iterating it (ADR 0036).
 */
export function expectNoIteration<R>(prototype: typeof Array.prototype | typeof Set.prototype, action: () => R): R {
	const iterator = vi.spyOn(prototype as any, Symbol.iterator as any);
	try {
		const result = action();
		expect(iterator).not.toHaveBeenCalled();
		return result;
	} finally {
		iterator.mockRestore();
	}
}
