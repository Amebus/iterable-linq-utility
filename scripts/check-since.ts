// Fails when a `@since` under src/ is neither `next` nor a released version.
import { findInvalidSince } from './since.ts';
import { readPackageVersion, readSourceFiles } from './sourceFiles.ts';

const version = readPackageVersion();
const problems = findInvalidSince(readSourceFiles('src'), version);
for (const { path, line, value } of problems)
	console.error(`${path}:${line}: @since ${value} is neither "next" nor a version <= ${version}`);
if (problems.length > 0) {
	console.error('New APIs use "@since next": the release sets the version.');
	process.exit(1);
}
