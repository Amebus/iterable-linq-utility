import { describe, expect, test, vi } from 'vitest';

import { IterableLinq } from './_linqIterable';
import { withoutInputFunctionThrowsException } from './linqIterableWrapperTestUtility';
import { unit } from './_types';

describe('IterableLinq.tapChainCreation', () => {

	test.each([
		{ start: 0, end: 20 },
		{ start: 0, end: 20 },
		{ start: -10, end: 10 }
	])('IterableLinq.tapChainCreation without mapper -> throw exception', ({ start, end }) => {
		withoutInputFunctionThrowsException(IterableLinq.fromRange(start, end), 'tapChainCreation');
	});

	test.each([
		{ end: 10 },
		{ end: 10 },
		{ end: 30 }
	])('IterableLinq.fromRange($end).tapChainCreation() to being hit 2 times', ({ end }) => {
		const chainCreationTapperSpy = vi.fn(() => unit());
		const tapped = IterableLinq
			.fromRange(end)
			.tapChainCreation(chainCreationTapperSpy)
			.tap(() => unit())
			.tapChainCreation(chainCreationTapperSpy);
		
		expect(chainCreationTapperSpy).toHaveBeenCalledTimes(2);
		tapped.collectToArray();
		expect(chainCreationTapperSpy).toHaveBeenCalledTimes(2);
	});

});