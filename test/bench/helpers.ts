import { existsSync } from 'node:fs';
import type { TestContext } from 'vitest';

type Bench = TestContext['bench'];
type Registration = ReturnType<Bench>;

export const values = Array.from({ length: 100_000 }, (_, i) => i);

export function sum(iterable: Iterable<number>): number {
	let s = 0;
	for (const v of iterable) {
		s += v;
	}
	return s;
}

// Registers a case, saved as the baseline when BENCH_SAVE=1, plus the saved baseline when it exists.
export function measure(bench: Bench, group: string, name: string, fn: () => unknown): Registration[] {
	const path = `.bench/${group}/${name.replace(/[^\w.-]+/g, '_')}.json`;
	const registrations = [bench(name, process.env.BENCH_SAVE ? { writeResult: path } : {}, fn)];
	if (existsSync(path)) {
		registrations.push(bench.from(`${name} (baseline)`, path));
	}
	return registrations;
}
