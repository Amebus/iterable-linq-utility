import { describe, expect, expectTypeOf, test } from 'vitest';
import { expectAction } from '../_helpers/operationKind';

import * as IterableLinq from '@/index';

describe('IterableLinq.join', () => {

	test.each([
		{ start: 0, end: 0, separator: undefined, expectedResult: '' },
		{ start: 0, end: 3, separator: undefined, expectedResult: '0,1,2' },
		{ start: 0, end: 3, separator: ' - ', expectedResult: '0 - 1 - 2' },
		{ start: 0, end: 3, separator: '', expectedResult: '012' }
	])('IterableLinq.fromRange($start, $end).join($separator) -> $expectedResult', ({ start, end, separator, expectedResult }) => {
		expect(IterableLinq.fromRange(start, end).join(separator)).toBe(expectedResult);
	});

	test('IterableLinq.join uses "," without a separator', () => {
		expect(IterableLinq.from(['a', 'b']).join()).toBe('a,b');
	});

	test('IterableLinq.join joins the values of the chain', () => {
		expect(IterableLinq.fromRange(0, 6).filter(v => v % 2 === 0).map(v => `#${v}`).join(' ')).toBe('#0 #2 #4');
	});

	test('IterableLinq.join is action', () => {
		expectAction(source => IterableLinq.from(source).join());
	});

	test('IterableLinq.join returns a string', () => {
		expectTypeOf(IterableLinq.from([1]).join()).toEqualTypeOf<string>();
	});

});
