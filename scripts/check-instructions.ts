// Fails when AGENTS.md or a skill links to a missing file or cites an ADR that does not exist.
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { findBrokenReferences } from './instructions.ts';

const repoFiles = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], { encoding: 'utf8' })
	.split('\n')
	.filter(Boolean);
const instructions = ['AGENTS.md', ...readdirSync('.agents', { recursive: true, encoding: 'utf8' })
	.filter(name => name.endsWith('.md'))
	.map(name => join('.agents', name))];

const problems = findBrokenReferences(instructions.map(path => ({ path, content: readFileSync(path, 'utf8') })), repoFiles);
for (const { path, line, message } of problems)
	console.error(`${path}:${line}: ${message}`);
if (problems.length > 0) {
	console.error('Update the instructions with the ADRs: see "Keeping the instructions in sync" in AGENTS.md.');
	process.exit(1);
}
