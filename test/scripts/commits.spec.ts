import { describe, expect, test } from 'vitest';

import { findCommitsWithoutBody } from '../../scripts/commits.ts';

function commit(subject: string, body = '') {
	return { hash: '0123456789abcdef', subject, body };
}

describe('findCommitsWithoutBody', () => {

	test.each([
		'feat(skip): add skip()',
		'fix: empty range for NaN',
		'perf(map): read arrays by index',
		'refactor!: rename the iterators',
		'feat!: drop Node 20'
	])('"%s" without a body is reported', subject => {
		expect(findCommitsWithoutBody([commit(subject)])).toEqual([commit(subject)]);
	});

	test.each([
		'docs: fix a typo',
		'test: shared infiniteSource generator',
		'build: bump eslint',
		'ci: cache the pnpm store',
		'chore: release',
		'Merge pull request #94 from Amebus/feat/skip'
	])('"%s" needs no body', subject => {
		expect(findCommitsWithoutBody([commit(subject)])).toEqual([]);
	});

	test('a body that explains the change is enough', () => {
		expect(findCommitsWithoutBody([commit('feat(skip): add skip()', 'Skips the first `count` values.\n\nCloses #27')])).toEqual([]);
	});

	test.each([
		'Closes #27',
		'Co-Authored-By: Claude <noreply@anthropic.com>',
		'Closes #27\n\nCo-Authored-By: Claude <noreply@anthropic.com>\nSigned-off-by: Someone <someone@example.com>',
		'fixes #3\nRefs #93',
		'\n  \n'
	])('a body with only trailers and issue links is reported: %j', body => {
		expect(findCommitsWithoutBody([commit('fix: something', body)])).toHaveLength(1);
	});

	test('a line with a colon is an explanation when it is not a trailer', () => {
		expect(findCommitsWithoutBody([commit('fix: something', 'Note: the source is closed now.')])).toEqual([]);
	});

});
