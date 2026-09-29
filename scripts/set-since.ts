// Replaces `@since next` under src/ with the version in package.json. Run by `pnpm release:version`.
import { writeFileSync } from 'node:fs';

import { replaceSincePlaceholder } from './since.ts';
import { readPackageVersion, readSourceFiles } from './sourceFiles.ts';

const version = readPackageVersion();
let changed = 0;
for (const { path, content } of readSourceFiles('src')) {
	const updated = replaceSincePlaceholder(content, version);
	if (updated !== content) {
		writeFileSync(path, updated);
		changed++;
	}
}
console.log(`@since next -> @since ${version} in ${changed} file(s)`);
