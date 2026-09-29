// Prints the notes of a version for its GitHub Release: `node scripts/release-notes.ts <version>`.
import { readFileSync } from 'node:fs';

import { extractChangelogSection } from './changelog.ts';

const version = process.argv[2];
if (!version) {
	console.error('Usage: node scripts/release-notes.ts <version>');
	process.exit(2);
}
const section = extractChangelogSection(readFileSync('CHANGELOG.md', 'utf8'), version);
console.log(section ?? 'See [CHANGELOG.md](https://github.com/Amebus/iterable-linq-utility/blob/main/CHANGELOG.md).');
