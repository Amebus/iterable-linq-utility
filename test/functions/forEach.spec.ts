import { beforeEach, describe, expect, test, vi } from 'vitest';

import {
	forEach, forEachAsync,
	range
} from './_functions';
import { withoutInputIterableThrowsException, withoutInputIterableThrowsExceptionAsync } from './functionsTestUtility';
import { Unit, unit } from './_types';

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
		expect(() => forEachJs(range(start, end))).toThrowError();
		expect(() => forEachJs(range(start, end), action)).toThrowError();
	});

	test.each([
		{  iterable: [ 0,1,2,3,4 ], action: v => { tempArr.push(v); return unit(); }, expectedResult: [0,1,2,3,4] },
		{  iterable: [ -4,-5 ], action: v => { tempArr.push(v); return unit(); }, expectedResult: [-4,-5] },
		{  iterable: 'ciao', action: v => { tempArr.push(v); return unit(); }, expectedResult: ['c','i','a','o'] },
		{  iterable: [ 0,1,2,3,4 ], action: (v, idx) => { tempArr.push(idx); return unit(); }, expectedResult: [0,1,2,3,4] },
		{  iterable: [ -4,-5 ], action: (v, idx) => { tempArr.push(idx); return unit(); }, expectedResult: [0,1] },
		{  iterable: 'ciao', action: (v, idx) => { tempArr.push(idx); return unit(); }, expectedResult: [0,1,2,3] },
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
		await expect(() => forEachAsyncJs(range(start, end))).rejects.toThrowError();
		await expect(() => forEachAsyncJs(range(start, end), action)).rejects.toThrowError();
	});

	
	const asyncActionValue = v => {
		return new Promise<Unit>(resolve => {
			tempArr.push(v);
			resolve(unit());
		});
	};

	const asyncActionIndex = (v, idx) => {
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

});