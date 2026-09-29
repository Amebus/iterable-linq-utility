import { describe, expect, test } from 'vitest';

import type { ISourceFile } from '../../scripts/since.ts';
import { findStructureProblems } from '../../scripts/structure.ts';

function doc(params: string[], tags: string[] = ['@operation `Transformation`', '@returns an iterable', '@example', '@since next']): string {
	return [
		'/**',
		' * Does something.',
		...params.map(name => ` * @param ${name} - a parameter`),
		...tags.map(tag => ` * ${tag}`),
		' */'
	].join('\n');
}

const COMPLETE: Record<string, string> = {
	'src/functions/map.ts': `${doc(['iterable', 'mapper'])}\nexport function map(iterable: Iterable<number>, mapper: (v: number) => number): Iterable<number> {\n\treturn iterable;\n}\n`,
	'src/functions/index.ts': 'export { map } from \'./map\';\n',
	'src/types/iterableLinq.ts': `export interface IIterableLinqBase<T> {\n${doc(['mapper'])}\n\tmap(mapper: (v: T) => T): IIterableLinqBase<T>;\n}\n`,
	'src/linqIterable.ts': 'export class IterableLinqWrapper {\n\tmap(mapper: unknown) {\n\t\treturn mapper;\n\t}\n}\n',
	'test/functions/map.spec.ts': '',
	'test/linqIterableWrapper/map.spec.ts': '',
	'test/bench/functions/map.bench.ts': ''
};

function files(overrides: Record<string, string | undefined> = {}): ISourceFile[] {
	return Object.entries({ ...COMPLETE, ...overrides })
		.filter((entry): entry is [string, string] => entry[1] !== undefined)
		.map(([path, content]) => ({ path, content }));
}

function messages(overrides: Record<string, string | undefined> = {}): string[] {
	return findStructureProblems(files(overrides)).map(p => p.message);
}

describe('findStructureProblems', () => {

	test('a complete operation has no problems', () => {
		expect(findStructureProblems(files())).toEqual([]);
	});

	test.each([
		'test/functions/map.spec.ts',
		'test/linqIterableWrapper/map.spec.ts',
		'test/bench/functions/map.bench.ts'
	])('a missing %s is reported on the operation file', missing => {
		expect(findStructureProblems(files({ [missing]: undefined }))).toEqual([
			{ path: 'src/functions/map.ts', line: 10, message: `"map" has no ${missing}` }
		]);
	});

	test('an operation not exported from src/functions/index.ts is reported', () => {
		expect(messages({ 'src/functions/index.ts': '' })).toEqual(['"map" is not exported from src/functions/index.ts']);
	});

	test('an operation without a method on IIterableLinqBase is reported', () => {
		expect(messages({ 'src/types/iterableLinq.ts': 'export interface IIterableLinqBase<T> {}\n' }))
			.toEqual(['"map" has no method on IIterableLinqBase in src/types/iterableLinq.ts']);
	});

	test('an operation without a method in src/linqIterable.ts is reported', () => {
		expect(messages({ 'src/linqIterable.ts': 'export class IterableLinqWrapper {}\n' }))
			.toEqual(['"map" has no method in src/linqIterable.ts']);
	});

	test('a chain starter needs no chain method, and its wrapper spec is test/<name>.spec.ts', () => {
		expect(messages({
			'src/functions/empty.ts': `${doc([])}\nexport function empty(): Iterable<number> {\n\treturn [];\n}\n`,
			'src/functions/index.ts': 'export { map } from \'./map\';\nexport { empty } from \'./empty\';\n',
			'test/functions/empty.spec.ts': '',
			'test/empty.spec.ts': '',
			'test/bench/functions/empty.bench.ts': ''
		})).toEqual([]);
	});

	test('range is checked under its public name, fromRange', () => {
		expect(messages({
			'src/functions/range.ts': `${doc(['end'])}\nexport function range(end: number): Iterable<number> {\n\treturn [end];\n}\n`,
			'src/functions/index.ts': 'export { map } from \'./map\';\nexport { range } from \'./range\';\n',
			'test/functions/range.spec.ts': ''
		})).toEqual([
			'"range" has no test/fromRange.spec.ts',
			'"range" has no test/bench/functions/fromRange.bench.ts'
		]);
	});

	test.each(['@operation', '@returns', '@example', '@since'])('a raw function without %s is reported', tag => {
		const tags = ['@operation `Transformation`', '@returns an iterable', '@example', '@since next'].filter(t => !t.startsWith(tag));
		const content = `${doc(['iterable', 'mapper'], tags)}\nexport function map(iterable: Iterable<number>, mapper: (v: number) => number): Iterable<number> {\n\treturn iterable;\n}\n`;
		expect(messages({ 'src/functions/map.ts': content })).toEqual([`map: the JSDoc has no ${tag}`]);
	});

	test('a JSDoc without a summary is reported', () => {
		const content = `${doc(['iterable', 'mapper']).replace(' * Does something.\n', '')}\nexport function map(iterable: Iterable<number>, mapper: (v: number) => number): Iterable<number> {\n\treturn iterable;\n}\n`;
		expect(messages({ 'src/functions/map.ts': content })).toEqual(['map: the JSDoc has no summary']);
	});

	test('a parameter without @param is reported', () => {
		const content = `${doc(['iterable'])}\nexport function map(iterable: Iterable<number>, mapper: (v: number) => number): Iterable<number> {\n\treturn iterable;\n}\n`;
		expect(messages({ 'src/functions/map.ts': content })).toEqual(['map: the JSDoc has no @param for "mapper"']);
	});

	test('a chain method without JSDoc is reported', () => {
		expect(messages({ 'src/types/iterableLinq.ts': 'export interface IIterableLinqBase<T> {\n\tmap(mapper: (v: T) => T): IIterableLinqBase<T>;\n}\n' }))
			.toEqual(['IIterableLinqBase.map: no JSDoc']);
	});

	test('[Symbol.iterator] on IIterableLinqBase is not an operation', () => {
		const chain = `export interface IIterableLinqBase<T> {\n\t/** Iterates the chain. */\n\t[Symbol.iterator](): Iterator<T>;\n${doc(['mapper'])}\n\tmap(mapper: (v: T) => T): IIterableLinqBase<T>;\n}\n`;
		expect(messages({ 'src/types/iterableLinq.ts': chain })).toEqual([]);
	});

	test('every overload needs its own JSDoc, the implementation does not', () => {
		const content = [
			doc(['end']),
			'export function map(end: number): Iterable<number>;',
			'export function map(start: number, end: number): Iterable<number>;',
			'export function map(a: number, b?: number): Iterable<number> {',
			'\treturn [a, b ?? 0];',
			'}',
			''
		].join('\n');
		expect(messages({ 'src/functions/map.ts': content })).toEqual(['map: no JSDoc']);
	});

	test('a helper listed as such needs no @operation and no @example', () => {
		const helper = `${doc([], ['@returns the options', '@since 0.0.16'])}\nexport function getMemoizeDefaultOptions(): object {\n\treturn {};\n}\n`;
		expect(messages({ 'src/functions/map.ts': `${COMPLETE['src/functions/map.ts']}${helper}` })).toEqual([]);
	});

});
