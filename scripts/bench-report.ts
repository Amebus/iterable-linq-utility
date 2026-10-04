// Runs the benchmarks whose path contains the arguments and prints the report for the pull request (ADR 0021).
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { arch, availableParallelism, cpus, release, type } from 'node:os';
import { formatReport, parseOsRelease, readStats, sortCases } from './benchReport.ts';
import type { IBenchCase, IEnvironment } from './benchReport.ts';

// inside the project: Vitest writes the results only under its root; test/bench/helpers.ts reads the same variable
const REPORT = '.bench/.report';

function run(command: string, args: string[], env: NodeJS.ProcessEnv = process.env): void {
	const { status } = spawnSync(command, args, { stdio: 'inherit', env });
	if (status !== 0)
		process.exit(status ?? 1);
}

function readJson(path: string) {
	return JSON.parse(readFileSync(path, 'utf8'));
}

function optional(read: () => string): string | undefined {
	try {
		return read().trim() || undefined;
	} catch {
		return undefined;
	}
}

function environment(): IEnvironment {
	const cpu = cpus()[0]?.model;
	return {
		os: optional(() => parseOsRelease(readFileSync('/etc/os-release', 'utf8')) ?? '') ?? `${type()} ${release()}`,
		arch: arch(),
		docker: existsSync('/.dockerenv'),
		cores: availableParallelism(),
		cpu: cpu && cpu !== 'unknown' ? cpu : undefined,
		host: process.env.BENCH_HOST || undefined,
		node: process.version,
		vitest: readJson('node_modules/vitest/package.json').version,
		benchTime: Number(process.env.BENCH_TIME) || 500,
		commit: optional(() => execFileSync('git', ['rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }))
	};
}

rmSync(REPORT, { recursive: true, force: true });
run('pnpm', ['exec', 'vite', 'build', '--logLevel', 'error']);
// BENCH_SAVE would overwrite the baselines that the report compares with
run('pnpm', ['exec', 'vitest', 'bench', '--run', ...process.argv.slice(2)], { ...process.env, BENCH_REPORT: REPORT, BENCH_SAVE: '' });

const index = `${REPORT}/cases.jsonl`;
if (!existsSync(index)) {
	console.error('No benchmark ran: check the filter.');
	process.exit(1);
}
const cases: IBenchCase[] = readFileSync(index, 'utf8').trim().split('\n').map(line => {
	const { group, name, result, baseline } = JSON.parse(line);
	return {
		group,
		name,
		result: readStats(readJson(result)),
		baseline: baseline ? readStats(readJson(baseline)) : undefined
	};
});
console.log(`\n${formatReport(sortCases(cases), environment())}`);
