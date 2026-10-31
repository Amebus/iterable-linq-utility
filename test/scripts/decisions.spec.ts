import { describe, expect, test } from 'vitest';

import { findDecisionProblems } from '../../scripts/decisions.ts';

const PATH = 'docs/decisions/README.md';

const RECORDS = [
	{ number: '0001', status: 'accepted' },
	{ number: '0002', status: 'accepted' },
	{ number: '0003', status: 'accepted, amended by [ADR 0004](0004-d.md)' },
	{ number: '0004', status: 'accepted' }
];

const CATALOG = [
	'| [0001](0001-a.md) | A | accepted |',
	'| [0002](0002-b.md) | B | accepted |',
	'| [0003](0003-c.md) | C | accepted, amended by [0004](0004-d.md) |',
	'| [0004](0004-d.md) | D | accepted |'
];

const SNAPSHOT = [
	'| One. | [0001](0001-a.md) |',
	'| Two. | [0002](0002-b.md) |',
	'| Three, as amended. | [0003](0003-c.md), [0004](0004-d.md) |'
];

/** An index with the snapshot on lines 7… and the catalog after it. */
function index(snapshot: string[], catalog: string[]) {
	return [
		'# Architecture Decision Records',
		'',
		'## Current decisions',
		'',
		'| Decision | ADR |',
		'| --- | --- |',
		...snapshot,
		'',
		'## All records',
		'',
		'| ADR | Title | Status |',
		'| --- | --- | --- |',
		...catalog,
		'',
		'## Adding a decision',
		'',
		'Cite [0099](0099-x.md) here: outside the two sections, not checked.'
	].join('\n');
}

describe('findDecisionProblems', () => {

	test('a complete index has no problems', () => {
		expect(findDecisionProblems(index(SNAPSHOT, CATALOG), RECORDS)).toEqual([]);
	});

	test('an ADR in force that the snapshot does not cite is reported on the heading', () => {
		expect(findDecisionProblems(index([SNAPSHOT[0], SNAPSHOT[2]], CATALOG), RECORDS)).toEqual([
			{ path: PATH, line: 3, message: 'ADR 0002 is in force but not in the current decisions' }
		]);
	});

	test('every ADR of a row counts as cited', () => {
		expect(findDecisionProblems(index(['| All. | [0001](0001-a.md), [0002](0002-b.md), [0003](0003-c.md), [0004](0004-d.md) |'], CATALOG), RECORDS))
			.toEqual([]);
	});

	test('a link in the sentence of a decision is not a citation', () => {
		const snapshot = ['| One, unlike [ADR 0002](0002-b.md). | [0001](0001-a.md) |', SNAPSHOT[2]];
		expect(findDecisionProblems(index(snapshot, CATALOG), RECORDS)).toEqual([
			{ path: PATH, line: 3, message: 'ADR 0002 is in force but not in the current decisions' }
		]);
	});

	test('a superseded ADR still cited in the snapshot is reported on its row', () => {
		const records = [...RECORDS.slice(0, 3), { number: '0004', status: 'superseded by [ADR 0003](0003-c.md)' }];
		const catalog = [...CATALOG.slice(0, 3), '| [0004](0004-d.md) | D | superseded by [0003](0003-c.md) |'];
		expect(findDecisionProblems(index(SNAPSHOT, catalog), records)).toEqual([
			{ path: PATH, line: 9, message: 'ADR 0004 is not in force ("superseded by 0003") but still in the current decisions' }
		]);
	});

	test('only an accepted ADR is in force, whatever the case of its status', () => {
		const records = [
			RECORDS[0],
			{ number: '0002', status: 'Superseded by [ADR 0001](0001-a.md)' },
			{ number: '0003', status: 'Accepted' },
			{ number: '0004', status: 'rejected' }
		];
		const catalog = [
			CATALOG[0],
			'| [0002](0002-b.md) | B | Superseded by [0001](0001-a.md) |',
			'| [0003](0003-c.md) | C | Accepted |',
			'| [0004](0004-d.md) | D | rejected |'
		];
		expect(findDecisionProblems(index([SNAPSHOT[0], '| Three. | [0003](0003-c.md) |'], catalog), records)).toEqual([]);
		expect(findDecisionProblems(index([SNAPSHOT[0], '| Three. | [0003](0003-c.md), [0004](0004-d.md) |'], catalog), records)).toEqual([
			{ path: PATH, line: 8, message: 'ADR 0004 is not in force ("rejected") but still in the current decisions' }
		]);
	});

	test('an ADR without a status line is reported once', () => {
		const records = [RECORDS[0], { number: '0002', status: undefined }, RECORDS[2], RECORDS[3]];
		expect(findDecisionProblems(index(SNAPSHOT, CATALOG), records)).toEqual([
			{ path: PATH, line: 1, message: 'ADR 0002 has no "* Status:" line in its file' }
		]);
	});

	test('an ADR in two rows of the snapshot is reported on the second one', () => {
		expect(findDecisionProblems(index([...SNAPSHOT, '| Again. | [0001](0001-a.md) |'], CATALOG), RECORDS)).toEqual([
			{ path: PATH, line: 10, message: 'ADR 0001 is in more than one row of the current decisions' }
		]);
	});

	test('an ADR with two rows in the catalog is reported on the second one', () => {
		expect(findDecisionProblems(index(SNAPSHOT, [...CATALOG, CATALOG[0]]), RECORDS)).toEqual([
			{ path: PATH, line: 19, message: 'ADR 0001 has more than one row in the catalog' }
		]);
	});

	test('a superseded ADR that the snapshot does not cite is fine', () => {
		const records = [...RECORDS.slice(0, 3), { number: '0004', status: 'superseded by [ADR 0003](0003-c.md)' }];
		const catalog = [...CATALOG.slice(0, 3), '| [0004](0004-d.md) | D | superseded by [0003](0003-c.md) |'];
		const snapshot = [SNAPSHOT[0], SNAPSHOT[1], '| Three. | [0003](0003-c.md) |'];
		expect(findDecisionProblems(index(snapshot, catalog), records)).toEqual([]);
	});

	test('a citation of an ADR without a file is reported', () => {
		expect(findDecisionProblems(index([...SNAPSHOT, '| Ghost. | [0099](0099-x.md) |'], CATALOG), RECORDS)).toEqual([
			{ path: PATH, line: 10, message: 'ADR 0099 does not exist in docs/decisions' }
		]);
	});

	test('a catalog row of an ADR without a file is reported', () => {
		expect(findDecisionProblems(index(SNAPSHOT, [...CATALOG, '| [0099](0099-x.md) | X | accepted |']), RECORDS)).toEqual([
			{ path: PATH, line: 19, message: 'ADR 0099 does not exist in docs/decisions' }
		]);
	});

	test('an ADR without a row in the catalog is reported', () => {
		expect(findDecisionProblems(index(SNAPSHOT, [CATALOG[0], CATALOG[2], CATALOG[3]]), RECORDS)).toEqual([
			{ path: PATH, line: 11, message: 'ADR 0002 has no row in the catalog' }
		]);
	});

	test('the statuses are compared with their links reduced to the number', () => {
		const catalog = [...CATALOG.slice(0, 2), '| [0003](0003-c.md) | C | accepted |', CATALOG[3]];
		expect(findDecisionProblems(index(SNAPSHOT, catalog), RECORDS)).toEqual([
			{ path: PATH, line: 17, message: 'ADR 0003: the status in the catalog is "accepted", the file says "accepted, amended by 0004"' }
		]);
	});

	test('a missing section is one problem, not one per ADR', () => {
		const content = index(SNAPSHOT, CATALOG).replace('## Current decisions', '## Something else');
		expect(findDecisionProblems(content, RECORDS)).toEqual([
			{ path: PATH, line: 1, message: 'missing section: ## Current decisions' }
		]);
		expect(findDecisionProblems(index(SNAPSHOT, CATALOG).replace('## All records', '## Other'), RECORDS)).toEqual([
			{ path: PATH, line: 1, message: 'missing section: ## All records' }
		]);
	});
});
