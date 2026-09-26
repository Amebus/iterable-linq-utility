// Benchmarks the built bundle: run with `pnpm bench` (builds first).
import { Functions } from '../../dist/interable-linq-utility.js';

const { filter, map, range } = Functions;

const sum = iterable => {
	let s = 0;
	for (const v of iterable) s += v;
	return s;
};

const cases = {
	'map(filter(range(2e6)))': () => sum(map(filter(range(2e6), x => x % 2 === 0), x => x * 2)),
	'range(2e6)': () => sum(range(2e6))
};

for (const [name, run] of Object.entries(cases)) {
	for (let i = 0; i < 5; i++) run();
	const times = [];
	for (let i = 0; i < 15; i++) {
		const start = performance.now();
		run();
		times.push(performance.now() - start);
	}
	times.sort((a, b) => a - b);
	console.log(`${name.padEnd(26)} median ${times[7].toFixed(1)} ms`);
}
