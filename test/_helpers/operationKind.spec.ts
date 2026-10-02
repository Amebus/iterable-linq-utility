import { describe, expect, test } from 'vitest';

import { expectAction, expectTransformation } from './operationKind';

function* lazyDouble(source: Iterable<number>) {
	for (const v of source) yield v * 2;
}

const lazyOperation = (source: Iterable<number>) => ({ [Symbol.iterator]: () => lazyDouble(source) });
const eagerOperation = (source: Iterable<number>) => Array.from(source);
const oneShotOperation = (source: Iterable<number>) => lazyDouble(source);

describe('expectTransformation', () => {

	test('passes for a lazy re-runnable operation', () => {
		expect(() => expectTransformation(lazyOperation)).not.toThrow();
	});

	test('fails for an eager operation', () => {
		expect(() => expectTransformation(eagerOperation)).toThrow();
	});

	test('fails for a non iterable result', () => {
		expect(() => expectTransformation(() => 42)).toThrow();
	});

	test('fails for a one-shot operation unless rerunsSource is false', () => {
		expect(() => expectTransformation(oneShotOperation)).toThrow();
		expect(() => expectTransformation(oneShotOperation, { rerunsSource: false })).not.toThrow();
	});

});

describe('expectAction', () => {

	test('passes for an eager operation', () => {
		expect(() => expectAction(eagerOperation)).not.toThrow();
	});

	test('fails for a lazy operation', () => {
		expect(() => expectAction(lazyOperation)).toThrow();
	});

	test('returns the operation result', () => {
		expect(expectAction(eagerOperation)).toEqual([1, 2, 3, 4, 5]);
	});

});
