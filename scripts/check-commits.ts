// Fails when a feat, fix, perf or refactor commit of the branch has no body. The base is the first argument, origin/main by default.
import { execFileSync } from 'node:child_process';

import { findCommitsWithoutBody } from './commits.ts';

const base = process.argv[2] ?? 'origin/main';
const log = execFileSync('git', ['log', '--no-merges', '--format=%H%x1f%s%x1f%b%x1e', `${base}..HEAD`], { encoding: 'utf8' });
const commits = log.split('\x1e').map(entry => entry.trim()).filter(Boolean).map(entry => {
	const [hash, subject, body = ''] = entry.split('\x1f');
	return { hash, subject, body };
});

const problems = findCommitsWithoutBody(commits);
for (const { hash, subject } of problems)
	console.error(`${hash.slice(0, 7)} ${subject}: no body that says what changes or why`);
if (problems.length > 0) {
	console.error('See "Commits and pull requests" in documentation/docs/how-to-contribute.md.');
	process.exit(1);
}
