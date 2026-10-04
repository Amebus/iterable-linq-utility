import { test } from 'vitest';
import * as Helpers from '../helpers';

import * as IterableLinq from 'iterable-linq-utility';

// Read the exports once: an imported binding goes through a module runner getter on every read.
const { from, Functions } = IterableLinq;
const { cases, first, group, middle, missing, N, numbers, scenarios, sum } = Helpers;

function native<T>(values: T[], predicate: (value: T) => boolean): T[] {
	const index = values.findIndex(v => !predicate(v));
	return index === -1 ? values.slice() : values.slice(0, index);
}

function loop<T>(values: T[], predicate: (value: T) => boolean): T[] {
	const r: T[] = [];
	for (const v of values) {
		if (!predicate(v))
			break;
		r.push(v);
	}
	return r;
}

// stops at `value`
function takeWhile(value: number): Helpers.IVariants {
	const predicate = (v: number): boolean => v !== value;
	return {
		native: values => sum(native(values, predicate)),
		loop: values => sum(loop(values, predicate)),
		chain: chain => sum(chain.takeWhile(predicate)),
		Functions: values => sum(Functions.takeWhile(values, predicate))
	};
}

scenarios('takeWhile', takeWhile(missing));
group('takeWhile', 'start', takeWhile(first));
group('takeWhile', 'middle', takeWhile(middle));

const mixed: (number | string)[] = numbers.map(v => (v === N / 2 ? 'stop' : v));

function isNumber(value: number | string): value is number {
	return typeof value === 'number';
}

test('takeWhile: type guard', async ({ bench }) => {
	await cases(bench, 'takeWhile/type-guard')
		.add('native', () => sum(native(mixed, isNumber) as number[]))
		.add('loop', () => sum(loop(mixed, isNumber) as number[]))
		.add('chain', () => sum(from(mixed).takeWhile(isNumber)))
		.add('Functions', () => sum(Functions.takeWhile(mixed, isNumber)))
		.run();
});
