import { IIterableLinq } from '@/linqIterable';
import { expect } from 'vitest';

// eslint-disable-next-line @typescript-eslint/ban-types
export function withoutInputFunctionThrowsException<T>(iterable: IIterableLinq<T>, fnName: keyof IIterableLinq<T>) {
	const iter = iterable as any;
	expect(() => iter[fnName]()).toThrowError();
	expect(() => iter[fnName](undefined)).toThrowError();
	expect(() => iter[fnName](null)).toThrowError();
	expect(() => iter[fnName]({})).toThrowError();
}