// Fails when an operation misses a spec, a bench, its export or its chain method, or when its JSDoc is incomplete.
import { readSourceFiles } from './sourceFiles.ts';
import { findStructureProblems } from './structure.ts';

const problems = findStructureProblems([...readSourceFiles('src'), ...readSourceFiles('test')]);
for (const { path, line, message } of problems)
	console.error(`${path}:${line}: ${message}`);
if (problems.length > 0) {
	console.error('See "Adding an operation" in documentation/docs/how-to-contribute.md.');
	process.exit(1);
}
