import { describe, expect, test } from 'vitest';

import { findPullRequest, getNextState, type IChangeset, parseChangeset, renderUpcomingPage } from '../../scripts/upcoming.ts';

const REPOSITORY = 'Amebus/iterable-linq-utility';

function changeset(name: string, bump: IChangeset['bump'], note: string, pullRequest?: number): IChangeset {
	return { name, bump, note, pullRequest };
}

describe('parseChangeset', () => {

	test('reads the bump and the note', () => {
		expect(parseChangeset('skip', '---\n"iterable-linq-utility": minor\n---\n\nAdd `skip(count)`.\n'))
			.toEqual({ name: 'skip', bump: 'minor', note: 'Add `skip(count)`.' });
	});

	test.each([
		['"iterable-linq-utility": patch', 'patch'],
		['\'iterable-linq-utility\': major', 'major'],
		['iterable-linq-utility: minor', 'minor']
	])('reads the release line %s', (line, bump) => {
		expect(parseChangeset('a', `---\n${line}\n---\n\nA note.\n`)?.bump).toBe(bump);
	});

	test('keeps the highest bump when there are several packages', () => {
		expect(parseChangeset('a', '---\n"a": patch\n"b": minor\n---\n\nA note.\n')?.bump).toBe('minor');
	});

	test('keeps a note of several paragraphs', () => {
		expect(parseChangeset('a', '---\n"a": minor\n---\n\nFirst.\n\nSecond.\n')?.note).toBe('First.\n\nSecond.');
	});

	test.each([
		['an empty changeset', '---\n---\n'],
		['an empty changeset with a note', '---\n---\n\nInternal refactor.\n'],
		['a file without front matter', '# Changesets\n']
	])('%s releases nothing', (_name, content) => {
		expect(parseChangeset('a', content)).toBeUndefined();
	});

	test('reads Windows line endings', () => {
		expect(parseChangeset('a', '---\r\n"a": minor\r\n---\r\n\r\nA note.\r\n')).toEqual({ name: 'a', bump: 'minor', note: 'A note.' });
	});

});

describe('findPullRequest', () => {

	test('the first merge of a pull request, from the oldest', () => {
		expect(findPullRequest(['Merge pull request #94 from Amebus/feat/skip', 'Merge pull request #97 from Amebus/docs/x'])).toBe(94);
	});

	test('skips the merges that are not pull requests', () => {
		expect(findPullRequest(['Merge branch \'main\' into feat/skip', 'Merge pull request #94 from Amebus/feat/skip'])).toBe(94);
	});

	test.each([[[]], [['']], [['Merge branch \'main\'']]])('undefined without a pull request: %j', subjects => {
		expect(findPullRequest(subjects)).toBeUndefined();
	});

});

describe('getNextState', () => {

	test('without pending changesets, next matches the release', () => {
		expect(getNextState('0.3.0', [])).toEqual({ state: 'released', version: '0.3.0', changes: 0 });
	});

	test('with pending changesets, next is unreleased', () => {
		expect(getNextState('0.3.0', [changeset('a', 'minor', 'A.'), changeset('b', 'patch', 'B.')]))
			.toEqual({ state: 'unreleased', version: '0.3.0', changes: 2 });
	});

});

describe('renderUpcomingPage', () => {

	test('groups the notes by bump, minor before patch, by pull request', () => {
		expect(renderUpcomingPage('0.3.0', [
			changeset('fix', 'patch', 'Fix `range`.', 103),
			changeset('skip-while', 'minor', 'Add `skipWhile`.', 105),
			changeset('take-while', 'minor', 'Add `takeWhile`.', 102)
		], REPOSITORY)).toBe([
			'# Upcoming',
			'',
			'The changes merged since 0.3.0, which the next release will contain. They are the notes of the pending changesets: the changelog of the release will have the same text.',
			'',
			'## Minor changes',
			'',
			'- Add `takeWhile`. ([#102](https://github.com/Amebus/iterable-linq-utility/pull/102))',
			'- Add `skipWhile`. ([#105](https://github.com/Amebus/iterable-linq-utility/pull/105))',
			'',
			'## Patch changes',
			'',
			'- Fix `range`. ([#103](https://github.com/Amebus/iterable-linq-utility/pull/103))',
			''
		].join('\n'));
	});

	test('a note without a pull request has no link, and comes last', () => {
		const page = renderUpcomingPage('0.3.0', [changeset('b', 'minor', 'B.'), changeset('a', 'minor', 'A.', 7)], REPOSITORY);
		expect(page).toContain('- A. ([#7](https://github.com/Amebus/iterable-linq-utility/pull/7))\n- B.\n');
	});

	test('a note of several lines stays inside its list item, with the link at the end', () => {
		const page = renderUpcomingPage('0.3.0', [changeset('a', 'minor', 'First line.\n\nSecond paragraph.', 7)], REPOSITORY);
		expect(page).toContain('- First line.\n\n    Second paragraph.\n\n    ([#7](https://github.com/Amebus/iterable-linq-utility/pull/7))\n');
	});

});
