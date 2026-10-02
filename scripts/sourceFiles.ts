import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { ISourceFile } from './since.ts';

/**
 * Every file with the extension `extension` under `dir`, recursively.
 */
export function readSourceFiles(dir: string, extension = '.ts'): ISourceFile[] {
	return readdirSync(dir, { recursive: true, encoding: 'utf8' })
		.filter(name => name.endsWith(extension))
		.map(name => join(dir, name))
		.map(path => ({ path, content: readFileSync(path, 'utf8') }));
}

export function readPackageVersion(): string {
	return JSON.parse(readFileSync('package.json', 'utf8')).version;
}
