// Checks the index of the ADRs: the current decisions cite every ADR in force and no superseded one, and the catalog
// has one row per ADR with the status of its file (ADR 0027).
import type { IReferenceProblem } from './instructions.ts';

export interface IDecisionRecord {
	number: string;
	/** The text after `* Status: ` in the file of the ADR. */
	status: string;
}

const PATH = 'docs/decisions/README.md';
const CURRENT = '## Current decisions';
const CATALOG = '## All records';
const ADR_LINK = /\[(?:ADR )?(\d{4})\]\([^)]*\)/g;
const CATALOG_ROW = /^\|\s*\[(\d{4})\]\([^)]*\)\s*\|[^|]*\|(.*)\|\s*$/;

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

/** The status with its links reduced to the number of the ADR. */
function normalize(status: string) {
	return status.replace(ADR_LINK, '$1').trim();
}

/**
 * Every problem of the index `content` against the ADR files `records`: an ADR in force missing from the current
 * decisions, a superseded one still there, an ADR cited or listed without a file, an ADR without a row in the catalog,
 * a status of the catalog that differs from its file.
 */
export function findDecisionProblems(content: string, records: IDecisionRecord[]): IReferenceProblem[] {
	const lines = content.split('\n');
	const byNumber = new Map(records.map(record => [record.number, record]));
	const problem = (line: number, message: string): IReferenceProblem => ({ path: PATH, line, message });
	const problems: IReferenceProblem[] = [];

	const current = section(lines, CURRENT);
	if (current === undefined) {
		problems.push(problem(1, `missing section: ${CURRENT}`));
	} else {
		const cited = new Set<string>();
		for (const [line, text] of current.lines) {
			for (const [, number] of text.matchAll(ADR_LINK)) {
				cited.add(number);
				const record = byNumber.get(number);
				if (record === undefined)
					problems.push(problem(line, `ADR ${number} does not exist in docs/decisions`));
				else if (record.status.startsWith('superseded'))
					problems.push(problem(line, `ADR ${number} is superseded but still in the current decisions`));
			}
		}
		for (const { number, status } of records) {
			if (!status.startsWith('superseded') && !cited.has(number))
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
			listed.add(number);
			const record = byNumber.get(number);
			if (record === undefined)
				problems.push(problem(line, `ADR ${number} does not exist in docs/decisions`));
			else if (normalize(status) !== normalize(record.status))
				problems.push(problem(line, `ADR ${number}: the status in the catalog is "${normalize(status)}", the file says "${normalize(record.status)}"`));
		}
		for (const { number } of records) {
			if (!listed.has(number))
				problems.push(problem(1, `ADR ${number} has no row in the catalog`));
		}
	}

	return problems;
}
