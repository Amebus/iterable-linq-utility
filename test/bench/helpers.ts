import { appendFileSync, existsSync, mkdirSync } from 'node:fs';
import { test } from 'vitest';
import type { TestContext } from 'vitest';

import * as IterableLinq from 'iterable-linq-utility';
import type { IIterableLinq } from 'iterable-linq-utility';

// Bench files import this module and the library as namespaces and copy the exports into local consts:
// an imported binding goes through a module runner getter on every read, which skews the timings.

const { from, Functions } = IterableLinq;

type Bench = TestContext['bench'];
type Registration = ReturnType<Bench>;

export interface IRecord {
	id: number;
	group: string;
	score: number;
	tags: string[];
}

export const N = 100_000;

export const numbers: number[] = Array.from({ length: N }, (_, i) => i);

const TAGS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

export const records: IRecord[] = numbers.map(i => ({
	id: i,
	group: `g${i % 10}`,
	score: (i * 7919) % 1000,
	tags: [TAGS[i % 8], TAGS[(i * 3) % 7]]
}));

export const small: number[] = numbers.slice(0, 1_000);

// The callbacks of the standard scenarios (ADR 0021): `<name>/map` runs after `map(double)`, `<name>/filter` after `filter(isEven)`.
export const double = (value: number): number => value * 2;
export const isEven = (value: number): boolean => value % 2 === 0;

// The values the early exit scenarios look for in `numbers`: `<name>/start`, `<name>/middle` and `<name>/none`.
export const first = 0;
export const middle = N / 2;
export const missing = -1;

const time = Number(process.env.BENCH_TIME) || 500;

export function sum(iterable: Iterable<number>): number {
	let s = 0;
	for (const v of iterable) {
		s += v;
	}
	return s;
}

function fileName(text: string): string {
	return text.replace(/[^\w.-]+/g, '_');
}

// The folder of `pnpm bench:report`: the results of the run and `cases.jsonl`, which lists them in the order they were registered.
const report = process.env.BENCH_REPORT;

// Registers a case, saved as the baseline when BENCH_SAVE=1 or for the report when BENCH_REPORT is set, plus the saved baseline when it exists.
function measure(bench: Bench, group: string, name: string, fn: () => unknown): Registration[] {
	const relative = `${group.split('/').map(fileName).join('/')}/${fileName(name)}.json`;
	const path = `.bench/${relative}`;
	const hasBaseline = existsSync(path);
	const result = process.env.BENCH_SAVE ? path : report ? `${report}/${relative}` : undefined;
	const registrations = [bench(name, result ? { writeResult: result } : {}, fn)];
	if (report && result) {
		mkdirSync(report, { recursive: true });
		appendFileSync(`${report}/cases.jsonl`, `${JSON.stringify({ group, name, result, baseline: hasBaseline ? path : undefined })}\n`);
	}
	if (hasBaseline) {
		registrations.push(bench.from(`${name} (baseline)`, path));
	}
	return registrations;
}

export interface ICases {
	add(name: string, fn: () => unknown): ICases;
	run(): Promise<unknown>;
}

// The cases of one comparison table. `group` names the baseline folder: `<function>/<variant>`.
export function cases(bench: Bench, group: string): ICases {
	const registrations: Registration[] = [];
	const self: ICases = {
		add(name, fn) {
			registrations.push(...measure(bench, group, name, fn));
			return self;
		},
		run: () => bench.compare(...registrations, { time })
	};
	return self;
}

// The variants of a standard group (ADR 0021, 0022), each given the source of the scenario:
// `native` and `loop` an array, `chain` a chain, `Functions` an iterable.
// The scenario is given too, for a variant that needs data matching the source (for example `sequenceEqual`).
export interface IVariants {
	native: (values: number[], scenario: Scenario) => unknown;
	loop?: (values: number[], scenario: Scenario) => unknown;
	chain: (chain: IIterableLinq<number>, scenario: Scenario) => unknown;
	Functions?: (values: Iterable<number>, scenario: Scenario) => unknown;
}

export type Scenario = 'direct' | 'small' | 'map' | 'filter';

interface ISources {
	scenario: Scenario;
	title: string;
	array: () => number[];
	chain: () => IIterableLinq<number>;
	iterable: () => Iterable<number>;
}

// The sources are built inside the measured function: the cost of the upstream `map` or `filter` is part of the case.
const SOURCES: Record<Scenario, ISources> = {
	direct: { scenario: 'direct', title: 'direct', array: () => numbers, chain: () => from(numbers), iterable: () => numbers },
	small: { scenario: 'small', title: 'small', array: () => small, chain: () => from(small), iterable: () => small },
	map: {
		scenario: 'map',
		title: 'after a map',
		array: () => numbers.map(double),
		chain: () => from(numbers).map(double),
		iterable: () => Functions.map(numbers, double)
	},
	filter: {
		scenario: 'filter',
		title: 'after a filter',
		array: () => numbers.filter(isEven),
		chain: () => from(numbers).filter(isEven),
		iterable: () => Functions.filter(numbers, isEven)
	}
};

function register(name: string, id: string, title: string, variants: IVariants, sources: ISources): void {
	const { native, loop, chain, Functions: raw } = variants;
	const { scenario, array, chain: chainOf, iterable } = sources;
	test(`${name}: ${title}`, async ({ bench }) => {
		const group = cases(bench, `${name}/${id}`).add('native', () => native(array(), scenario));
		if (loop)
			group.add('loop', () => loop(array(), scenario));
		group.add('chain', () => chain(chainOf(), scenario));
		if (raw)
			group.add('Functions', () => raw(iterable(), scenario));
		await group.run();
	});
}

// Registers the standard groups `<name>/direct`, `<name>/small`, `<name>/map` and `<name>/filter`, or the ones in `only`.
export function scenarios(name: string, variants: IVariants, only: Scenario[] = ['direct', 'small', 'map', 'filter']): void {
	for (const scenario of only)
		register(name, scenario, SOURCES[scenario].title, variants, SOURCES[scenario]);
}

// Registers one more group on `numbers`, `<name>/<id>`: an early exit (`start`, `middle`) or a callback (`selector`).
export function group(name: string, id: string, variants: IVariants): void {
	register(name, id, id, variants, SOURCES.direct);
}
