import { beforeEach, describe, expect, test } from 'vitest';
import { expectAction } from '../_helpers/operationKind';

import * as IterableLinq from '@/index';
import { withoutInputFunctionThrowsException, withoutInputFunctionThrowsExceptionAsync } from './linqIterableWrapperTestUtility';

const unit = IterableLinq.unit;
type Unit = IterableLinq.Unit;

describe('IterableLinq.forEach', () => {

	let tempArr: any[] = [];

	beforeEach(() => {
		tempArr = [];
	});

	test.each([
		{ start: -10, end: 10 },
		{ start: 0, end: 20 }
	])('IterableLinq.forEach without action -> throw exception', ({ start, end }) => {
		withoutInputFunctionThrowsException(IterableLinq.fromRange(start, end), 'forEach');
	});

	test.each([
		{  iterable: [ 0,1,2,3,4 ], action: v => { tempArr.push(v); return unit(); }, expectedResult: [0,1,2,3,4] },
		{  iterable: [ -4,-5 ], action: v => { tempArr.push(v); return unit(); }, expectedResult: [-4,-5] },
		{  iterable: 'ciao', action: v => { tempArr.push(v); return unit(); }, expectedResult: ['c','i','a','o'] },
		{  iterable: [ 0,1,2,3,4 ], action: (_v, idx) => { tempArr.push(idx); return unit(); }, expectedResult: [0,1,2,3,4] },
		{  iterable: [ -4,-5 ], action: (_v, idx) => { tempArr.push(idx); return unit(); }, expectedResult: [0,1] },
		{  iterable: 'ciao', action: (_v, idx) => { tempArr.push(idx); return unit(); }, expectedResult: [0,1,2,3] },
	])('IterableLinq.forEach($iterable, $action) -> $expectedResult', ({ iterable, action, expectedResult }) => {
		IterableLinq.from<number | string>(iterable).forEach(action);
		expect(tempArr).toEqual(expectedResult);
	});

});

describe('IterableLinq.forEachAsync', () => {

	let tempArr: any[] = [];

	beforeEach(() => {
		tempArr = [];
	});

	test.each([
		{ start: -10, end: 10 },
		{ start: 0, end: 20 }
	])('IterableLinq.forEachAsync without action -> throw exception', async ({ start, end }) => {
		withoutInputFunctionThrowsExceptionAsync(IterableLinq.fromRange(start, end), 'forEachAsync');
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
	])('IterableLinq.forEach($iterable, $action) -> $expectedResult', async ({ iterable, action, expectedResult }) => {
		await IterableLinq.from<number | string>(iterable).forEachAsync(action);
		expect(tempArr).toEqual(expectedResult);
	});

	test('IterableLinq.forEach is action', () => {
		expectAction(source => IterableLinq.from(source).forEach(() => unit()));
	});

	test('IterableLinq.forEachAsync is action', async () => {
		await expectAction(source => IterableLinq.from(source).forEachAsync(async () => unit()));
	});

	test('IterableLinq.forEachAsync runs one action at a time', async () => {
		let running = 0;
		let peak = 0;
		await IterableLinq.fromRange(10).forEachAsync(async () => {
			running++;
			peak = Math.max(peak, running);
			await new Promise(resolve => setTimeout(resolve, 1));
			running--;
			return unit();
		});
		expect(peak).toBe(1);
	});

});
