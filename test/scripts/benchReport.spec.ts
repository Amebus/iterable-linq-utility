import { describe, expect, test } from 'vitest';

import { describeEnvironment, formatReport, parseOsRelease, readStats, sortCases } from '../../scripts/benchReport.ts';
import type { IBenchCase, IBenchStats, IEnvironment } from '../../scripts/benchReport.ts';

const environment: IEnvironment = {
	os: 'Alpine Linux v3.24',
	arch: 'arm64',
	docker: true,
	cores: 12,
	node: 'v24.20.0',
	vitest: '5.0.2',
	benchTime: 500
};

function stats(opsPerSecond: number, mean = 1): IBenchStats {
	return { opsPerSecond, mean, p75: mean, p99: mean, rme: 1 };
}

function benchCase(group: string, name: string, opsPerSecond: number, baseline?: number): IBenchCase {
	return { group, name, result: stats(opsPerSecond), baseline: baseline === undefined ? undefined : stats(baseline) };
}

function tableRows(report: string): string[] {
	return report.split('\n').slice(4);
}

describe('readStats', () => {

	test('takes the ops/s from the throughput and the times in ms from the latency', () => {
		const json = {
			latency: { mean: 7.97, p75: 7.9, p99: 11.5, rme: 2.4, p50: 7.8 },
			throughput: { mean: 127.1, p75: 130 }
		};
		expect(readStats(json)).toEqual({ opsPerSecond: 127.1, mean: 7.97, p75: 7.9, p99: 11.5, rme: 2.4 });
	});
});

describe('parseOsRelease', () => {

	test('returns PRETTY_NAME without the quotes', () => {
		expect(parseOsRelease('NAME="Alpine Linux"\nPRETTY_NAME="Alpine Linux v3.24"\nID=alpine')).toBe('Alpine Linux v3.24');
	});

	test('returns PRETTY_NAME without quotes as it is', () => {
		expect(parseOsRelease('PRETTY_NAME=Debian')).toBe('Debian');
	});

	test('returns undefined without PRETTY_NAME', () => {
		expect(parseOsRelease('NAME="Alpine Linux"')).toBeUndefined();
	});
});

describe('describeEnvironment', () => {

	test('says unknown for the CPU, the host and the commit it does not know', () => {
		expect(describeEnvironment(environment)).toBe(
			'Alpine Linux v3.24 (Docker), arm64, 12 cores, CPU unknown · host unknown · Node v24.20.0 · Vitest 5.0.2 · BENCH_TIME 500 ms · commit unknown'
		);
	});

	test('writes the CPU, the host and the commit, and no Docker outside a container', () => {
		const described = describeEnvironment({ ...environment, docker: false, cpu: 'Apple M3 Pro', host: 'MacBook Pro', commit: 'abc1234' });
		expect(described).toBe(
			'Alpine Linux v3.24, arm64, 12 cores, CPU Apple M3 Pro · host MacBook Pro · Node v24.20.0 · Vitest 5.0.2 · BENCH_TIME 500 ms · commit abc1234'
		);
	});
});

describe('sortCases', () => {

	test('sorts by operation and keeps the order of the cases of an operation', () => {
		const cases = [
			benchCase('sum/direct', 'native', 1),
			benchCase('map/direct', 'native', 1),
			benchCase('sum/small', 'native', 1),
			benchCase('map/small', 'chain', 1)
		];
		expect(sortCases(cases).map(c => c.group)).toEqual(['map/direct', 'map/small', 'sum/direct', 'sum/small']);
	});

	test('does not change the input', () => {
		const cases = [benchCase('sum/direct', 'native', 1), benchCase('map/direct', 'native', 1)];
		sortCases(cases);
		expect(cases[0].group).toBe('sum/direct');
	});
});

describe('formatReport', () => {

	test('starts with the environment, then the header of the table', () => {
		const lines = formatReport([benchCase('sum/direct', 'native', 100)], environment).split('\n');
		expect(lines[0]).toBe(`Environment: ${describeEnvironment(environment)}`);
		expect(lines[1]).toBe('');
		expect(lines[2]).toBe('| case | variant | ops/s | mean (ms) | p75 (ms) | p99 (ms) | rme | vs native |');
		expect(lines[3]).toBe('| --- | --- | --- | --- | --- | --- | --- | --- |');
	});

	test('compares every case with the native case of its group, in %', () => {
		const report = formatReport([
			benchCase('sum/direct', 'native', 100),
			benchCase('sum/direct', 'chain', 133),
			benchCase('sum/direct', 'Functions', 41),
			benchCase('sum/map', 'native', 10),
			benchCase('sum/map', 'chain', 31)
		], environment);
		expect(tableRows(report).map(line => line.split(' | ').at(-1))).toEqual(['— |', '+33% |', '-59% |', '— |', '+210% |']);
	});

	test('writes 0% for a difference that rounds to zero', () => {
		const report = formatReport([benchCase('sum/direct', 'native', 1000), benchCase('sum/direct', 'chain', 1004)], environment);
		expect(tableRows(report)[1]).toMatch(/\| 0% \|$/);
	});

	test('writes — for every case of a group without a native case', () => {
		const report = formatReport([benchCase('sum/direct', 'chain', 100), benchCase('sum/direct', 'Functions', 90)], environment);
		expect(tableRows(report).every(line => line.endsWith('| — |'))).toBe(true);
	});

	test('formats ops/s as integers, the times with three significant digits and the margin of error with one decimal', () => {
		const cases: IBenchCase[] = [{
			group: 'sum/direct',
			name: 'native',
			result: { opsPerSecond: 12345.6, mean: 0.0810123, p75: 7.97123, p99: 123.456, rme: 2.418 }
		}];
		expect(tableRows(formatReport(cases, environment))[0]).toBe('| sum/direct | native | 12,346 | 0.081 | 7.97 | 123 | ±2.4% | — |');
	});

	test('adds the vs baseline column when a case has a baseline, with — for the cases without one', () => {
		const report = formatReport([
			benchCase('sum/direct', 'native', 100, 100),
			benchCase('sum/direct', 'chain', 120, 100),
			benchCase('sum/small', 'native', 50)
		], environment);
		const lines = report.split('\n');
		expect(lines[2]).toMatch(/\| vs native \| vs baseline \|$/);
		expect(tableRows(report).map(line => line.split(' | ').slice(-2).join(' | '))).toEqual(['— | 0% |', '+20% | +20% |', '— | — |']);
	});

	test('has no vs baseline column when no case has a baseline', () => {
		expect(formatReport([benchCase('sum/direct', 'native', 100)], environment)).not.toContain('vs baseline');
	});
});
