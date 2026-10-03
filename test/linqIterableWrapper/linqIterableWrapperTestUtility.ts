import { expect } from 'vitest';

import { IIterableLinq } from '@/types';

export function withoutInputFunctionThrowsException<T>(iterable: IIterableLinq<T>, fnName: keyof IIterableLinq<T>) {
	const iter = iterable as any;
	const prefix = `[iterable-linq-utility/${String(fnName)}] `;
	expect(() => iter[fnName]()).toThrow(prefix);
	expect(() => iter[fnName](undefined)).toThrow(prefix);
	expect(() => iter[fnName](null)).toThrow(prefix);
	expect(() => iter[fnName]({})).toThrow(prefix);
}

export async function withoutInputFunctionThrowsExceptionAsync<T>(iterable: IIterableLinq<T>, fnName: keyof IIterableLinq<T>) {
	const iter = iterable as any;
	const prefix = `[iterable-linq-utility/${String(fnName)}] `;
	await expect(() => iter[fnName]()).rejects.toThrow(prefix);
	await expect(() => iter[fnName](undefined)).rejects.toThrow(prefix);
	await expect(() => iter[fnName](null)).rejects.toThrow(prefix);
	await expect(() => iter[fnName]({})).rejects.toThrow(prefix);
}
