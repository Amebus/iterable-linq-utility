import { describe, expect, test } from 'vitest';

import { findInvalidSince, replaceSincePlaceholder } from '../../scripts/since.ts';

function file(content: string) {
	return { path: 'src/a.ts', content };
}

describe('findInvalidSince', () => {

	test.each(['next', '0.1.0', '0.0.10'])('@since %s is valid with the package at 0.1.0', value => {
		expect(findInvalidSince([file(`/**\n * @since ${value}\n */`)], '0.1.0')).toEqual([]);
	});

	test('a version greater than the package version is a problem, with its 1-based line', () => {
		const content = '/**\n * Sums.\n * @since 0.2.0\n */';
		expect(findInvalidSince([file(content)], '0.1.0')).toEqual([{ path: 'src/a.ts', line: 3, value: '0.2.0' }]);
	});

	test.each(['nxt', '0.2', 'next.1'])('@since %s is neither next nor a version', value => {
		expect(findInvalidSince([file(` * @since ${value}`)], '0.1.0')).toEqual([{ path: 'src/a.ts', line: 1, value }]);
	});

	test('@since without a value is a problem', () => {
		expect(findInvalidSince([file(' * @since\n */')], '0.1.0')).toEqual([{ path: 'src/a.ts', line: 1, value: '' }]);
	});

	test('versions compare as numbers, not as strings', () => {
		expect(findInvalidSince([file(' * @since 0.10.0')], '0.9.0')).toHaveLength(1);
		expect(findInvalidSince([file(' * @since 0.9.0')], '0.10.0')).toEqual([]);
	});

	test('reports every problem of every file', () => {
		const files = [
			{ path: 'src/a.ts', content: ' * @since 0.3.0\n * @since next' },
			{ path: 'src/b.ts', content: ' * @since 1.0.0' }
		];
		expect(findInvalidSince(files, '0.1.0').map(p => p.path)).toEqual(['src/a.ts', 'src/b.ts']);
	});

});

describe('replaceSincePlaceholder', () => {

	test('replaces @since next with the version and leaves the others', () => {
		expect(replaceSincePlaceholder(' * @since next\n * @since 0.1.0', '0.2.0')).toBe(' * @since 0.2.0\n * @since 0.1.0');
	});

	test('does not touch a word that starts with next', () => {
		expect(replaceSincePlaceholder(' * @since nextVersion', '0.2.0')).toBe(' * @since nextVersion');
	});

	test('replaces every occurrence', () => {
		expect(replaceSincePlaceholder('@since next\n@since next', '1.0.0')).toBe('@since 1.0.0\n@since 1.0.0');
	});

});
