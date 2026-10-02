// Prepares the `next` documentation: writes documentation/docs/upcoming.md when changesets are pending,
// and prints the state for the banner as KEY=value lines (for $GITHUB_ENV, or `env $(…) mkdocs serve`).
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { readPackageVersion } from './sourceFiles.ts';
import { findPullRequest, getNextState, type IChangeset, parseChangeset, renderUpcomingPage } from './upcoming.ts';

const CHANGESETS = '.changeset';
const PAGE = 'documentation/docs/upcoming.md';
const REPOSITORY = 'Amebus/iterable-linq-utility';

function git(...args: string[]): string {
	return execFileSync('git', args, { encoding: 'utf8' }).trim();
}

/** The pull request whose merge brought the commit that added `path` to the current branch. */
function pullRequestOf(path: string): number | undefined {
	const added = git('log', '--diff-filter=A', '--format=%H', '-1', '--', path);
	if (!added)
		return undefined;
	return findPullRequest(git('log', '--merges', '--ancestry-path', '--reverse', '--format=%s', `${added}..HEAD`).split('\n'));
}

const changesets = readdirSync(CHANGESETS)
	.filter(file => file.endsWith('.md') && file !== 'README.md')
	.map(file => parseChangeset(file.slice(0, -3), readFileSync(join(CHANGESETS, file), 'utf8')))
	.filter((changeset): changeset is IChangeset => changeset !== undefined)
	.map(changeset => ({ ...changeset, pullRequest: pullRequestOf(join(CHANGESETS, `${changeset.name}.md`)) }));

const next = getNextState(readPackageVersion(), changesets);
if (next.state === 'unreleased')
	writeFileSync(PAGE, renderUpcomingPage(next.version, changesets, REPOSITORY));
else
	rmSync(PAGE, { force: true });

console.log(`NEXT_STATE=${next.state}`);
console.log(`NEXT_VERSION=${next.version}`);
console.log(`NEXT_CHANGES=${next.changes}`);
