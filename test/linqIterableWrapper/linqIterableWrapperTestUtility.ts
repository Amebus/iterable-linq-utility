import { IIterableLinq } from '@/linqIterable';
import { expect } from 'vitest';

export function withoutInputFunctionThrowsException<T>(iterable: IIterableLinq<T>, fnName: keyof IIterableLinq<T>) {
	const iter = iterable as any;
	expect(() => iter[fnName]()).toThrow();
	expect(() => iter[fnName](undefined)).toThrow();
	expect(() => iter[fnName](null)).toThrow();
	expect(() => iter[fnName]({})).toThrow();
}

export async function withoutInputFunctionThrowsExceptionAsync<T>(iterable: IIterableLinq<T>, fnName: keyof IIterableLinq<T>) {
	const iter = iterable as any;
	await expect(() => iter[fnName]()).rejects.toThrow();
	await expect(() => iter[fnName](undefined)).rejects.toThrow();
	await expect(() => iter[fnName](null)).rejects.toThrow();
	await expect(() => iter[fnName]({})).rejects.toThrow();
}
