import { test } from 'vitest';
import * as Helpers from '../helpers';

import * as IterableLinq from 'iterable-linq-utility';

// Read the exports once: an imported binding goes through a module runner getter on every read.
const { from, Functions } = IterableLinq;
const { cases, numbers, records, scenarios, sum } = Helpers;

const ascending = (a: number, b: number): number => a - b;

// `numbers` is already sorted, the best case of the native sort: `sort/random` sorts a copy shuffled once, with a fixed seed.
let seed = 42;
const random = (): number => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
const shuffled = [...numbers];
for (let i = shuffled.length - 1; i > 0; i--) {
	const j = Math.floor(random() * (i + 1));
	[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
}

scenarios('sort', {
	native: values => sum(values.toSorted(ascending)),
	chain: chain => sum(chain.sort()),
	Functions: values => sum(Functions.sort(values))
});

test('sort: random order', async ({ bench }) => {
	await cases(bench, 'sort/random')
		.add('native', () => sum(shuffled.toSorted(ascending)))
		.add('chain', () => sum(from(shuffled).sort()))
		.add('Functions', () => sum(Functions.sort(shuffled)))
		.run();
});

const byScore = (a: Helpers.IRecord, b: Helpers.IRecord): number => a.score - b.score;

// The same order as the list of keys ['group', 'score']: by group, then by score.
const byGroupAndScore = (a: Helpers.IRecord, b: Helpers.IRecord): number => (a.group < b.group ? -1 : a.group > b.group ? 1 : a.score - b.score);

test('sort: key', async ({ bench }) => {
	await cases(bench, 'sort/key')
		.add('native', () => records.toSorted(byScore).length)
		.add('chain', () => from(records).sort('score').collectToArray().length)
		.add('Functions', () => Functions.collectToArray(Functions.sort(records, 'score')).length)
		.run();
});

test('sort: list of keys', async ({ bench }) => {
	await cases(bench, 'sort/keys')
		.add('native', () => records.toSorted(byGroupAndScore).length)
		.add('chain', () => from(records).sort(['group', 'score']).collectToArray().length)
		.add('Functions', () => Functions.collectToArray(Functions.sort(records, ['group', 'score'])).length)
		.run();
});

test('sort: compare function', async ({ bench }) => {
	await cases(bench, 'sort/function')
		.add('native', () => records.toSorted(byScore).length)
		.add('chain', () => from(records).sort(byScore).collectToArray().length)
		.add('Functions', () => Functions.collectToArray(Functions.sort(records, byScore)).length)
		.run();
});

// Reading only part of the result (ADR 0031): the first 10 values, the first 1,000 and a page, against the native sort and slice.
interface IWindow {
	name: string;
	skip: number;
	take: number;
}

const windows: IWindow[] = [
	{ name: 'take10', skip: 0, take: 10 },
	{ name: 'take1000', skip: 0, take: 1_000 },
	{ name: 'page', skip: 20_000, take: 10 }
];

for (const { name, skip, take } of windows) {
	const end = skip + take;

	test(`sort: ${name}, random order`, async ({ bench }) => {
		await cases(bench, `sort/${name}/random`)
			.add('native', () => sum(shuffled.toSorted(ascending).slice(skip, end)))
			.add('chain', () => sum(from(shuffled).sort().skip(skip).take(take)))
			.add('Functions', () => sum(Functions.take(Functions.skip(Functions.sort(shuffled), skip), take)))
			.run();
	});

	test(`sort: ${name}, key`, async ({ bench }) => {
		await cases(bench, `sort/${name}/key`)
			.add('native', () => records.toSorted(byScore).slice(skip, end).length)
			.add('chain', () => from(records).sort('score').skip(skip).take(take).collectToArray().length)
			.add('Functions', () => Functions.collectToArray(Functions.take(Functions.skip(Functions.sort(records, 'score'), skip), take)).length)
			.run();
	});

	test(`sort: ${name}, list of keys`, async ({ bench }) => {
		await cases(bench, `sort/${name}/keys`)
			.add('native', () => records.toSorted(byGroupAndScore).slice(skip, end).length)
			.add('chain', () => from(records).sort(['group', 'score']).skip(skip).take(take).collectToArray().length)
			.add('Functions', () => Functions.collectToArray(Functions.take(Functions.skip(Functions.sort(records, ['group', 'score']), skip), take)).length)
			.run();
	});

	test(`sort: ${name}, compare function`, async ({ bench }) => {
		await cases(bench, `sort/${name}/function`)
			.add('native', () => records.toSorted(byScore).slice(skip, end).length)
			.add('chain', () => from(records).sort(byScore).skip(skip).take(take).collectToArray().length)
			.add('Functions', () => Functions.collectToArray(Functions.take(Functions.skip(Functions.sort(records, byScore), skip), take)).length)
			.run();
	});

	test(`sort: ${name}, already sorted`, async ({ bench }) => {
		await cases(bench, `sort/${name}/sorted`)
			.add('native', () => sum(numbers.toSorted(ascending).slice(skip, end)))
			.add('chain', () => sum(from(numbers).sort().skip(skip).take(take)))
			.add('Functions', () => sum(Functions.take(Functions.skip(Functions.sort(numbers), skip), take)))
			.run();
	});
}
