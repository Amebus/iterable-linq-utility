import { beforeEach, describe, expect, test } from 'vitest';
import { closableSource } from '../_helpers/closableSource';
import { expectAction } from '../_helpers/operationKind';

import {
	forEach, forEachAsync,
	range
} from '@/functions';
import { Unit, unit } from '@/types';
import { withoutInputIterableThrowsException, withoutInputIterableThrowsExceptionAsync } from './functionsTestUtility';

describe('forEach', () => {

	let tempArr: any[] = [];

	beforeEach(() => {
		tempArr = [];
	});

	test('forEach without input iterable -> throw exception', () => {
		withoutInputIterableThrowsException(forEach);
	});

	test.each([
		{ start: -10, end: 10 },
		{ start: 0, end: 20 },
		{ start: 0, end: 20, action: undefined },
		{ start: 0, end: 20, action: null },
		{ start: 0, end: 20, action: {} }
	])('forEach without action -> throw exception', ({ start, end, action }) => {
		const forEachJs = forEach as any;
		expect(() => forEachJs(range(start, end))).toThrow();
		expect(() => forEachJs(range(start, end), action)).toThrow();
	});

	test.each([
		{  iterable: [ 0,1,2,3,4 ], action: v => { tempArr.push(v); return unit(); }, expectedResult: [0,1,2,3,4] },
		{  iterable: [ -4,-5 ], action: v => { tempArr.push(v); return unit(); }, expectedResult: [-4,-5] },
		{  iterable: 'ciao', action: v => { tempArr.push(v); return unit(); }, expectedResult: ['c','i','a','o'] },
		{  iterable: [ 0,1,2,3,4 ], action: (_v, idx) => { tempArr.push(idx); return unit(); }, expectedResult: [0,1,2,3,4] },
		{  iterable: [ -4,-5 ], action: (_v, idx) => { tempArr.push(idx); return unit(); }, expectedResult: [0,1] },
		{  iterable: 'ciao', action: (_v, idx) => { tempArr.push(idx); return unit(); }, expectedResult: [0,1,2,3] },
	])('forEach($iterable, $action) -> $expectedResult', ({ iterable, action, expectedResult }) => {
		forEach<string | number>(iterable, action);
		expect(tempArr).toEqual(expectedResult);
	});

});

describe('forEachAsync', () => {

	let tempArr: any[] = [];

	beforeEach(() => {
		tempArr = [];
	});

	test('forEachAsync without input iterable -> throw exception', async () => {
		await withoutInputIterableThrowsExceptionAsync(forEachAsync);
	});

	test.each([
		{ start: -10, end: 10 },
		{ start: 0, end: 20 },
		{ start: 0, end: 20, action: undefined },
		{ start: 0, end: 20, action: null },
		{ start: 0, end: 20, action: {} }
	])('forEachAsync without action -> throw exception', async ({ start, end, action }) => {
		const forEachAsyncJs = forEachAsync as any;
		await expect(() => forEachAsyncJs(range(start, end))).rejects.toThrow();
		await expect(() => forEachAsyncJs(range(start, end), action)).rejects.toThrow();
	});

	const asyncActionValue = v => {
		return new Promise<Unit>(resolve => {
			tempArr.push(v);
			resolve(unit());
		});
	};

	const asyncActionIndex = (_v, idx) => {
		return new Promise<Unit>(resolve => {
			tempArr.push(idx);
			resolve(unit());
		});
	};

	test.each([
		{  iterable: [ 0,1,2,3,4 ], action: asyncActionValue, expectedResult: [0,1,2,3,4] },
		{  iterable: [ -4,-5 ], action: asyncActionValue, expectedResult: [-4,-5] },
		{  iterable: 'ciao', action: asyncActionValue, expectedResult: ['c','i','a','o'] },
		{  iterable: [ 0,1,2,3,4 ], action: asyncActionIndex, expectedResult: [0,1,2,3,4] },
		{  iterable: [ -4,-5 ], action: asyncActionIndex, expectedResult: [0,1] },
		{  iterable: 'ciao', action: asyncActionIndex, expectedResult: [0,1,2,3] },
	])('forEach($iterable, $action) -> $expectedResult', async ({ iterable, action, expectedResult }) => {
		await forEachAsync<string | number>(iterable, action);
		expect(tempArr).toEqual(expectedResult);
	});

	test('forEach is action', () => {
		expectAction(source => forEach(source, () => unit()));
	});

	test('forEachAsync is action', async () => {
		await expectAction(source => forEachAsync(source, async () => unit()));
	});

	test('forEach: a throwing action closes the source and propagates the error', () => {
		const err = new Error('boom');
		const { state, iterable } = closableSource([1, 2, 3]);
		expect(() => forEach(iterable, () => { throw err; })).toThrow(err);
		expect(state.closed).toBe(true);
	});

	test('forEachAsync: a synchronously throwing action closes the source and rejects with the error', async () => {
		const err = new Error('boom');
		const { state, iterable } = closableSource([1, 2, 3]);
		await expect(forEachAsync(iterable, () => { throw err; })).rejects.toThrow(err);
		expect(state.closed).toBe(true);
	});

	const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

	test('forEachAsync runs one action at a time', async () => {
		let running = 0;
		let peak = 0;
		await forEachAsync(range(20), async () => {
			running++;
			peak = Math.max(peak, running);
			await sleep(1);
			running--;
			return unit();
		});
		expect(peak).toBe(1);
	});

	test('forEachAsync completes the actions in source order', async () => {
		const completed: number[] = [];
		await forEachAsync([30, 10, 20], async v => {
			await sleep(v);
			completed.push(v);
			return unit();
		});
		expect(completed).toEqual([30, 10, 20]);
	});

	test('forEachAsync: a rejection stops the iteration', async () => {
		const err = new Error('boom');
		const started: number[] = [];
		const completed: number[] = [];
		await expect(forEachAsync([1, 2, 3], async v => {
			started.push(v);
			if (v === 1) throw err;
			await sleep(10);
			completed.push(v);
			return unit();
		})).rejects.toThrow(err);
		await sleep(50);
		expect(started).toEqual([1]);
		expect(completed).toEqual([]);
	});

	test('forEachAsync works on an infinite source and closes it on rejection', async () => {
		const err = new Error('stop');
		const state = { closed: false };
		const infinite = { *[Symbol.iterator]() { try { for (let i = 0; ; i++) yield i; } finally { state.closed = true; } } };
		await expect(forEachAsync(infinite, async v => {
			if (v === 2) throw err;
			return unit();
		})).rejects.toThrow(err);
		expect(state.closed).toBe(true);
	});

});
