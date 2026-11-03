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

// Data the native sort reads as a few runs, where it is about linear: the rule keeps the full sort, so a window must not be
// slower than today. `full` is today: a `map` between the sort and the window hides the sort, which is then read in full.
const descending = (a: number, b: number): number => b - a;
const byIdDescending = (a: Helpers.IRecord, b: Helpers.IRecord): number => b.id - a.id;
const byId = (a: Helpers.IRecord, b: Helpers.IRecord): number => a.id - b.id;
const byText = (a: string, b: string): number => a.localeCompare(b);
const same = <T>(value: T): T => value;

const reversed = numbers.toReversed();
const reversedRecords = records.toReversed();
const reversedStrings = numbers.map(i => `item-${String(i).padStart(6, '0')}`).toReversed();

// a sorted copy with 1% of the values in a swapped adjacent pair, at positions drawn with a fixed seed
seed = 7;
const nearlySorted = [...numbers];
for (let pair = 0; pair < numbers.length / 200; pair++) {
	const i = Math.floor(random() * (numbers.length - 1));
	[nearlySorted[i], nearlySorted[i + 1]] = [nearlySorted[i + 1], nearlySorted[i]];
}

for (const { name, skip, take } of windows) {
	const end = skip + take;

	test(`sort: ${name}, reversed, compare function`, async ({ bench }) => {
		await cases(bench, `sort/${name}/reversed`)
			.add('native', () => sum(reversed.toSorted(ascending).slice(skip, end)))
			.add('full', () => sum(from(reversed).sort(ascending).map(same).skip(skip).take(take)))
			.add('chain', () => sum(from(reversed).sort(ascending).skip(skip).take(take)))
			.run();
	});

	test(`sort: ${name}, reversed, key`, async ({ bench }) => {
		await cases(bench, `sort/${name}/reversedKey`)
			.add('native', () => reversedRecords.toSorted(byId).slice(skip, end).length)
			.add('full', () => from(reversedRecords).sort('id').map(same).skip(skip).take(take).collectToArray().length)
			.add('chain', () => from(reversedRecords).sort('id').skip(skip).take(take).collectToArray().length)
			.run();
	});

	test(`sort: ${name}, reversed, strings`, async ({ bench }) => {
		await cases(bench, `sort/${name}/reversedStrings`)
			.add('native', () => reversedStrings.toSorted(byText).slice(skip, end).length)
			.add('full', () => from(reversedStrings).sort(byText).map(same).skip(skip).take(take).collectToArray().length)
			.add('chain', () => from(reversedStrings).sort(byText).skip(skip).take(take).collectToArray().length)
			.run();
	});

	test(`sort: ${name}, the latest records, compare function`, async ({ bench }) => {
		await cases(bench, `sort/${name}/latest`)
			.add('native', () => records.toSorted(byIdDescending).slice(skip, end).length)
			.add('full', () => from(records).sort(byIdDescending).map(same).skip(skip).take(take).collectToArray().length)
			.add('chain', () => from(records).sort(byIdDescending).skip(skip).take(take).collectToArray().length)
			.run();
	});

	test(`sort: ${name}, the latest records, key descending`, async ({ bench }) => {
		await cases(bench, `sort/${name}/latestKey`)
			.add('native', () => records.toSorted(byIdDescending).slice(skip, end).length)
			.add('full', () => from(records).sort('id', { descending: true }).map(same).skip(skip).take(take).collectToArray().length)
			.add('chain', () => from(records).sort('id', { descending: true }).skip(skip).take(take).collectToArray().length)
			.run();
	});

	test(`sort: ${name}, nearly sorted, compare function`, async ({ bench }) => {
		await cases(bench, `sort/${name}/nearlySorted`)
			.add('native', () => sum(nearlySorted.toSorted(ascending).slice(skip, end)))
			.add('full', () => sum(from(nearlySorted).sort(ascending).map(same).skip(skip).take(take)))
			.add('chain', () => sum(from(nearlySorted).sort(ascending).skip(skip).take(take)))
			.run();
	});

	test(`sort: ${name}, nearly reversed, compare function`, async ({ bench }) => {
		await cases(bench, `sort/${name}/nearlyReversed`)
			.add('native', () => sum(nearlySorted.toSorted(descending).slice(skip, end)))
			.add('full', () => sum(from(nearlySorted).sort(descending).map(same).skip(skip).take(take)))
			.add('chain', () => sum(from(nearlySorted).sort(descending).skip(skip).take(take)))
			.run();
	});
}
