// The state of the `next` documentation: the pending changesets are the changes that are not released yet.

export type Bump = 'major' | 'minor' | 'patch';

export interface IChangeset {
	/** The file name, without `.md`. */
	name: string;
	bump: Bump;
	note: string;
	/** The pull request that added the changeset, when it can be found. */
	pullRequest?: number;
}

export interface INextState {
	/** `released`: `next` matches the latest release. `unreleased`: `next` documents changes that are not released yet. */
	state: 'released' | 'unreleased';
	/** The latest released version. */
	version: string;
	/** The number of pending changesets. */
	changes: number;
}

const BUMPS: Bump[] = ['major', 'minor', 'patch'];
const FRONT_MATTER = /^---\r?\n([\s\S]*?)\r?\n?---\r?\n?([\s\S]*)$/;
const RELEASE_LINE = /^\s*["']?[^"':]+["']?\s*:\s*(major|minor|patch)\s*$/;
const MERGE_SUBJECT = /^Merge pull request #(\d+)\b/;

/**
 * Reads a changeset; `undefined` for an empty one (`pnpm changeset --empty`), which releases nothing,
 * and for a file that is not a changeset.
 */
export function parseChangeset(name: string, content: string): IChangeset | undefined {
	const match = FRONT_MATTER.exec(content);
	if (!match)
		return undefined;
	const bumps = match[1].split('\n').map(line => RELEASE_LINE.exec(line)?.[1] as Bump | undefined).filter(bump => bump !== undefined);
	const bump = BUMPS.find(b => bumps.includes(b));
	return bump === undefined ? undefined : { name, bump, note: match[2].trim() };
}

/**
 * The pull request of the first `Merge pull request #N` subject, given the merge commits from the oldest to the newest.
 */
export function findPullRequest(mergeSubjects: string[]): number | undefined {
	for (const subject of mergeSubjects) {
		const match = MERGE_SUBJECT.exec(subject);
		if (match)
			return Number(match[1]);
	}
	return undefined;
}

export function getNextState(version: string, changesets: IChangeset[]): INextState {
	return { state: changesets.length === 0 ? 'released' : 'unreleased', version, changes: changesets.length };
}

/**
 * The Upcoming page: the notes of the pending changesets, grouped by bump.
 */
export function renderUpcomingPage(version: string, changesets: IChangeset[], repository: string): string {
	const lines = [
		'# Upcoming',
		'',
		`The changes merged since ${version}, which the next release will contain. They are the notes of the pending changesets: the changelog of the release will have the same text.`
	];
	for (const bump of BUMPS) {
		const group = changesets.filter(c => c.bump === bump).sort((a, b) => (a.pullRequest ?? Infinity) - (b.pullRequest ?? Infinity) || a.name.localeCompare(b.name));
		if (group.length === 0)
			continue;
		lines.push('', `## ${bump[0].toUpperCase()}${bump.slice(1)} changes`, '');
		for (const { note, pullRequest } of group) {
			const link = pullRequest === undefined ? '' : ` ([#${pullRequest}](https://github.com/${repository}/pull/${pullRequest}))`;
			const [first, ...rest] = note.split('\n');
			lines.push(`- ${first}${rest.length === 0 ? link : ''}`, ...rest.map(line => (line.trim() ? `    ${line}` : '')));
			if (rest.length > 0 && link)
				lines.push('', `    ${link.trim()}`);
		}
	}
	return `${lines.join('\n')}\n`;
}
