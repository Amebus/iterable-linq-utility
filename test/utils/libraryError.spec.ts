import { describe, expect, test } from 'vitest';

import { libraryError } from '@/utils';

describe('libraryError', () => {

	test('returns an Error', () => {
		expect(libraryError('filter', 'message')).toBeInstanceOf(Error);
	});

	test('prefixes the message with the library and the operation', () => {
		expect(libraryError('filter', 'The "predicate" function must be provided').message)
			.toBe('[iterable-linq-utility/filter] The "predicate" function must be provided');
	});

	test('keeps the message unchanged after the prefix', () => {
		const message = '  [nested] "quotes" and ${template}  ';
		expect(libraryError('take', message).message).toBe(`[iterable-linq-utility/take] ${message}`);
	});

});
