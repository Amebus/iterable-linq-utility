import { describe, expect, test } from 'vitest';

import { findBrokenReferences } from '../../scripts/instructions.ts';

const REPO = [
	'AGENTS.md',
	'docs/decisions/README.md',
	'docs/decisions/0012-trunk-based-releases-with-changesets.md',
	'docs/decisions/0014-instructions-for-ai-coding-agents.md',
	'documentation/docs/how-to-contribute.md',
	'.agents/skills/adr/SKILL.md',
	'.agents/skills/adr/references/template.md'
];

function check(path: string, content: string) {
	return findBrokenReferences([{ path, content }], REPO);
}

describe('findBrokenReferences', () => {

	test('links to existing files and folders, relative to the file, are fine', () => {
		expect(check('.agents/skills/adr/SKILL.md', [
			'See [the index](../../../docs/decisions/README.md) and [the template](references/template.md).',
			'The [skills](../) and [a section](../../../documentation/docs/how-to-contribute.md#releases).'
		].join('\n'))).toEqual([]);
	});

	test('a link to a missing file is reported with its line', () => {
		expect(check('AGENTS.md', 'Intro.\nSee [the guide](documentation/docs/missing.md#x).')).toEqual([
			{ path: 'AGENTS.md', line: 2, message: 'broken link: documentation/docs/missing.md' }
		]);
	});

	test('external links, anchors and mail links are not checked', () => {
		expect(check('AGENTS.md', '[a](https://example.com/x.md) [b](#section) [c](mailto:a@b.c)')).toEqual([]);
	});

	test('links in fenced code blocks and in inline code are not checked', () => {
		expect(check('AGENTS.md', [
			'````markdown',
			'| [map](missing.md) |',
			'```ts',
			'x[0](1);',
			'```',
			'````',
			'Set it to `superseded by [ADR NNNN](NNNN-….md)`.'
		].join('\n'))).toEqual([]);
	});

	test('an ADR number without a file in docs/decisions is reported', () => {
		expect(check('AGENTS.md', 'Rule (ADR 0012).\nOther rule (ADR 0099).')).toEqual([
			{ path: 'AGENTS.md', line: 2, message: 'ADR 0099 does not exist in docs/decisions' }
		]);
	});

	test('every number of a list of ADRs is checked', () => {
		expect(check('AGENTS.md', 'Rules (ADR 0012, 0098 and 0014; ADRs 0097 or 0012).').map(p => p.message)).toEqual([
			'ADR 0098 does not exist in docs/decisions',
			'ADR 0097 does not exist in docs/decisions'
		]);
	});

	test('ADR placeholders are not numbers', () => {
		expect(check('AGENTS.md', 'Write ADR NNNN, the next one.')).toEqual([]);
	});

});
