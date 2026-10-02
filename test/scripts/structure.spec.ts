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
			'src/functions/index.ts': 'export { empty } from \'./empty\';\nexport { map } from \'./map\';\n',
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

	describe('alphabetical order', () => {

		const operation = (name: string) => ({
			[`src/functions/${name}.ts`]: `${doc(['iterable'])}\nexport function ${name}(iterable: Iterable<number>): Iterable<number> {\n\treturn iterable;\n}\n`,
			[`test/functions/${name}.spec.ts`]: '',
			[`test/linqIterableWrapper/${name}.spec.ts`]: '',
			[`test/bench/functions/${name}.bench.ts`]: ''
		});
		const chainInterface = (names: string[]) =>
			`export interface IIterableLinqBase<T> {\n${names.map(name => `${doc([])}\n\t${name}(): IIterableLinqBase<T>;`).join('\n')}\n}\n`;
		const chainClass = (names: string[]) =>
			`import {\n${names.map(name => `\t${name}`).join(',\n')}\n} from './functions';\n\nexport class IterableLinqWrapper {\n${names.map(name => `\t${name}() {\n\t\treturn 0;\n\t}`).join('\n')}\n}\n`;
		const ordered = {
			...operation('filter'),
			'src/functions/index.ts': 'export { filter } from \'./filter\';\nexport { map } from \'./map\';\n',
			'src/types/iterableLinq.ts': chainInterface(['filter', 'map']),
			'src/linqIterable.ts': chainClass(['filter', 'map'])
		};

		test('operations in alphabetical order have no problems', () => {
			expect(messages(ordered)).toEqual([]);
		});

		test('an export out of order is reported with the place where it belongs', () => {
			expect(findStructureProblems(files({ ...ordered, 'src/functions/index.ts': 'export { map } from \'./map\';\nexport { filter } from \'./filter\';\n' })))
				.toEqual([{ path: 'src/functions/index.ts', line: 2, message: 'the exports: "filter" should come before "map" (alphabetical order)' }]);
		});

		test('the imports and the methods of the chain class out of order are reported', () => {
			expect(messages({ ...ordered, 'src/linqIterable.ts': chainClass(['map', 'filter']) })).toEqual([
				'the imports from ./functions: "filter" should come before "map" (alphabetical order)',
				'the methods of the chain: "filter" should come before "map" (alphabetical order)'
			]);
		});

		test('a member of IIterableLinqBase out of order is reported', () => {
			expect(messages({ ...ordered, 'src/types/iterableLinq.ts': chainInterface(['map', 'filter']) }))
				.toEqual(['the members of IIterableLinqBase: "filter" should come before "map" (alphabetical order)']);
		});

		test('overloads next to each other are fine, apart are reported', () => {
			expect(messages({ ...ordered, 'src/types/iterableLinq.ts': chainInterface(['filter', 'filter', 'map']) })).toEqual([]);
			expect(messages({ ...ordered, 'src/types/iterableLinq.ts': chainInterface(['filter', 'map', 'filter']) }))
				.toEqual(['the members of IIterableLinqBase: keep the overloads of "filter" next to each other']);
		});

		test('the order is case-insensitive', () => {
			expect(messages({
				...ordered,
				...operation('flatMap'),
				...operation('forEach'),
				'src/functions/index.ts': 'export { filter } from \'./filter\';\nexport { flatMap } from \'./flatMap\';\nexport { forEach } from \'./forEach\';\nexport { map } from \'./map\';\n',
				'src/types/iterableLinq.ts': chainInterface(['filter', 'flatMap', 'forEach', 'map']),
				'src/linqIterable.ts': chainClass(['filter', 'flatMap', 'forEach', 'map'])
			})).toEqual([]);
		});

		test('the sections and the TLDR rows of an API reference page out of order are reported', () => {
			const page = [
				'# Transformations',
				'',
				'    | [map](#map) | Maps |',
				'    | [filter](#filter) | Filters |',
				'',
				'## map',
				'',
				'## filter',
				''
			].join('\n');
			expect(findStructureProblems(files({ ...ordered, 'documentation/docs/api-reference/transformations.md': page }))).toEqual([
				{ path: 'documentation/docs/api-reference/transformations.md', line: 8, message: 'the sections: "filter" should come before "map" (alphabetical order)' },
				{ path: 'documentation/docs/api-reference/transformations.md', line: 4, message: 'the TLDR table: "filter" should come before "map" (alphabetical order)' }
			]);
		});

		test('the index of the API reference is not checked', () => {
			expect(messages({ ...ordered, 'documentation/docs/api-reference/index.md': '## Starting a chain\n\n## Extending the chain\n' })).toEqual([]);
		});

	});

});
