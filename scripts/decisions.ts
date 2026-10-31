// Checks the index of the ADRs: the current decisions cite every ADR in force and no other one, and the catalog
// has one row per ADR with the status of its file (ADR 0027).
import type { IReferenceProblem } from './instructions.ts';

export interface IDecisionRecord {
	number: string;
	/** The text after `* Status: ` in the file of the ADR, `undefined` when the file has no such line. */
	status: string | undefined;
}

const PATH = 'docs/decisions/README.md';
const CURRENT = '## Current decisions';
const CATALOG = '## All records';
const ADR_LINK = /\[(?:ADR )?(\d{4})\]\([^)]*\)/g;
/** The ADR column of a row of the current decisions: its last cell. The sentence before it may link other ADRs. */
const LAST_CELL = /^\|.*\|([^|]*)\|\s*$/;
const CATALOG_ROW =/^\|\s*\[(\d{4})\]\([^)]*\)\s*\|[^|]*\|(.*)\|\s*$/;

interface ISection {
	heading: number;
	lines: [number, string][];
}

/** The lines between `heading` and the next `## ` heading, with their 1-based numbers. */
function section(lines: string[], heading: string): ISection | undefined {
	const start = lines.findIndex(line => line.trim() === heading);
	if (start === -1)
		return undefined;
	const end = lines.findIndex((line, index) => index > start && line.startsWith('## '));
	const body = lines.slice(start + 1, end === -1 ? lines.length : end);
	return { heading: start + 1, lines: body.map((text, index) => [start + 2 + index, text]) };
}

/** Whether an ADR with this status is in force: only an accepted one, amended or not. */
function inForce(status: string) {
	return /^accepted\b/i.test(status);
}

/** The status with its links reduced to the number of the ADR. */
function normalize(status: string) {
	return status.replace(ADR_LINK, '$1').trim();
}

/**
 * Every problem of the index `content` against the ADR files `records`: an ADR without a status line, an accepted ADR
 * missing from the current decisions, one that is not in force (superseded, rejected…) still there, an ADR cited or
 * listed without a file or more than once, an ADR without a row in the catalog, a status of the catalog that differs
 * from its file.
 */
export function findDecisionProblems(content: string, records: IDecisionRecord[]): IReferenceProblem[] {
	const lines = content.split('\n');
	const problem = (line: number, message: string): IReferenceProblem => ({ path: PATH, line, message });
	const problems: IReferenceProblem[] = [];
	const unknown = new Set<string>();
	const statuses = new Map<string, string>();
	for (const { number, status } of records) {
		if (status === undefined) {
			unknown.add(number);
			problems.push(problem(1, `ADR ${number} has no "* Status:" line in its file`));
		} else {
			statuses.set(number, status);
		}
	}
	const exists = (number: string) => statuses.has(number) || unknown.has(number);

	const current = section(lines, CURRENT);
	if (current === undefined) {
		problems.push(problem(1, `missing section: ${CURRENT}`));
	} else {
		const cited = new Set<string>();
		for (const [line, text] of current.lines) {
			const cell = LAST_CELL.exec(text)?.[1] ?? '';
			for (const number of new Set(Array.from(cell.matchAll(ADR_LINK), ([, n]) => n))) {
				const status = statuses.get(number);
				if (cited.has(number))
					problems.push(problem(line, `ADR ${number} is in more than one row of the current decisions`));
				else if (!exists(number))
					problems.push(problem(line, `ADR ${number} does not exist in docs/decisions`));
				else if (status !== undefined && !inForce(status))
					problems.push(problem(line, `ADR ${number} is not in force ("${normalize(status)}") but still in the current decisions`));
				cited.add(number);
			}
		}
		for (const [number, status] of statuses) {
			if (inForce(status) && !cited.has(number))
				problems.push(problem(current.heading, `ADR ${number} is in force but not in the current decisions`));
		}
	}

	const catalog = section(lines, CATALOG);
	if (catalog === undefined) {
		problems.push(problem(1, `missing section: ${CATALOG}`));
	} else {
		const listed = new Set<string>();
		for (const [line, text] of catalog.lines) {
			const row = CATALOG_ROW.exec(text);
			if (row === null)
				continue;
			const [, number, status] = row;
			const recorded = statuses.get(number);
			if (listed.has(number))
				problems.push(problem(line, `ADR ${number} has more than one row in the catalog`));
			else if (!exists(number))
				problems.push(problem(line, `ADR ${number} does not exist in docs/decisions`));
			else if (recorded !== undefined && normalize(status) !== normalize(recorded))
				problems.push(problem(line, `ADR ${number}: the status in the catalog is "${normalize(status)}", the file says "${normalize(recorded)}"`));
			listed.add(number);
		}
		for (const { number } of records) {
			if (!listed.has(number))
				problems.push(problem(catalog.heading, `ADR ${number} has no row in the catalog`));
		}
	}

	return problems;
}
