// Builds the benchmark report of a pull request: one markdown table, in the format of ADR 0021.

export interface IBenchStats {
	opsPerSecond: number;
	mean: number;
	p75: number;
	p99: number;
	rme: number;
}

export interface IBenchCase {
	group: string;
	name: string;
	result: IBenchStats;
	baseline?: IBenchStats;
}

export interface IEnvironment {
	os: string;
	arch: string;
	docker: boolean;
	cores: number;
	cpu?: string;
	host?: string;
	node: string;
	vitest: string;
	benchTime: number;
	commit?: string;
}

interface IStatistics {
	mean: number;
	p75: number;
	p99: number;
	rme: number;
}

const NATIVE = 'native';

/**
 * The measures of a result written by Vitest (`writeResult`): ops/s from the throughput, the times in ms from the latency.
 */
export function readStats(json: { latency: IStatistics; throughput: { mean: number } }): IBenchStats {
	const { mean, p75, p99, rme } = json.latency;
	return { opsPerSecond: json.throughput.mean, mean, p75, p99, rme };
}

/**
 * The `PRETTY_NAME` of an `/etc/os-release` file, `undefined` when it has none.
 */
export function parseOsRelease(text: string): string | undefined {
	const match = /^PRETTY_NAME=(.*)$/m.exec(text);
	return match?.[1].trim().replace(/^"(.*)"$/, '$1');
}

/**
 * The line above the table: where the benchmarks ran.
 */
export function describeEnvironment(environment: IEnvironment): string {
	const { os, arch, docker, cores, cpu, host, node, vitest, benchTime, commit } = environment;
	return [
		`${os}${docker ? ' (Docker)' : ''}, ${arch}, ${cores} cores, CPU ${cpu ?? 'unknown'}`,
		`host ${host ?? 'unknown'}`,
		`Node ${node}`,
		`Vitest ${vitest}`,
		`BENCH_TIME ${benchTime} ms`,
		`commit ${commit ?? 'unknown'}`
	].join(' · ');
}

/**
 * The cases sorted by operation (the group up to its first `/`): the bench files run in parallel, so they finish in any order.
 * Within an operation, the cases keep the order in which they ran.
 */
export function sortCases(cases: IBenchCase[]): IBenchCase[] {
	const operation = (c: IBenchCase) => c.group.split('/')[0];
	return [...cases].sort((a, b) => operation(a).localeCompare(operation(b)));
}

function difference(value: number, reference: number): string {
	const percent = Math.round((value / reference - 1) * 100);
	return `${percent > 0 ? '+' : ''}${percent}%`;
}

function formatOps(value: number): string {
	return Math.round(value).toLocaleString('en-US');
}

// three significant digits: a case on `small` takes microseconds, one on `numbers` milliseconds
function formatMs(value: number): string {
	return String(Number(value.toPrecision(3)));
}

function row(cells: string[]): string {
	return `| ${cells.join(' | ')} |`;
}

/**
 * The report: the environment, then one table with a row per case, in the order of `cases`.
 * The difference from native is computed on the ops/s of the `native` case of the same group;
 * the `vs baseline` column appears when a case has a baseline.
 */
export function formatReport(cases: IBenchCase[], environment: IEnvironment): string {
	const withBaseline = cases.some(c => c.baseline !== undefined);
	const header = ['case', 'variant', 'ops/s', 'mean (ms)', 'p75 (ms)', 'p99 (ms)', 'rme', 'vs native'];
	if (withBaseline)
		header.push('vs baseline');

	const lines = [
		`Environment: ${describeEnvironment(environment)}`,
		'',
		row(header),
		row(header.map(() => '---'))
	];
	for (const c of cases) {
		const native = cases.find(n => n.group === c.group && n.name === NATIVE);
		const { opsPerSecond, mean, p75, p99, rme } = c.result;
		const cells = [
			c.group,
			c.name,
			formatOps(opsPerSecond),
			formatMs(mean),
			formatMs(p75),
			formatMs(p99),
			`±${rme.toFixed(1)}%`,
			native === undefined || native === c ? '—' : difference(opsPerSecond, native.result.opsPerSecond)
		];
		if (withBaseline)
			cells.push(c.baseline ? difference(opsPerSecond, c.baseline.opsPerSecond) : '—');
		lines.push(row(cells));
	}
	return lines.join('\n');
}
