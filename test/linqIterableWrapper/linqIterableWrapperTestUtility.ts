import { IIterableLinq } from '@/linqIterable';
import { expect } from 'vitest';

export function withoutInputFunctionThrowsException<T>(iterable: IIterableLinq<T>, fnName: keyof IIterableLinq<T>) {
	const iter = iterable as any;
	expect(() => iter[fnName]()).toThrowError();
	expect(() => iter[fnName](undefined)).toThrowError();
	expect(() => iter[fnName](null)).toThrowError();
	expect(() => iter[fnName]({})).toThrowError();
}

export async function withoutInputFunctionThrowsExceptionAsync<T>(iterable: IIterableLinq<T>, fnName: keyof IIterableLinq<T>) {
	const iter = iterable as any;
	await expect(() => iter[fnName]()).rejects.toThrowError();
	await expect(() => iter[fnName](undefined)).rejects.toThrowError();
	await expect(() => iter[fnName](null)).rejects.toThrowError();
	await expect(() => iter[fnName]({})).rejects.toThrowError();
}