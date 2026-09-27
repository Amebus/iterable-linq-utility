import { existsSync } from 'node:fs';
import type { TestContext } from 'vitest';

// Bench files import this module and the library as namespaces and copy the exports into local consts:
// an imported binding goes through a module runner getter on every read, which skews the timings.

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

// Registers a case, saved as the baseline when BENCH_SAVE=1, plus the saved baseline when it exists.
function measure(bench: Bench, group: string, name: string, fn: () => unknown): Registration[] {
	const path = `.bench/${group.split('/').map(fileName).join('/')}/${fileName(name)}.json`;
	const registrations = [bench(name, process.env.BENCH_SAVE ? { writeResult: path } : {}, fn)];
	if (existsSync(path)) {
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
