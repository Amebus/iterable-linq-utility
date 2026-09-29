// Checks and resolves the `@since` tags of the JSDoc: new APIs use `@since next` until a release sets the version.

export interface ISourceFile {
	path: string;
	content: string;
}

export interface ISinceProblem {
	path: string;
	line: number;
	value: string;
}

const SINCE = /@since\b[ \t]*(\S*)/g;
const VERSION = /^(\d+)\.(\d+)\.(\d+)$/;

function parseVersion(value: string): number[] | undefined {
	const match = VERSION.exec(value);
	return match ? match.slice(1).map(Number) : undefined;
}

function isAtMost(version: number[], max: number[]): boolean {
	for (let i = 0; i < version.length; i++) {
		if (version[i] !== max[i])
			return version[i] < max[i];
	}
	return true;
}

/**
 * Every `@since` whose value is neither `next` nor a version lower than or equal to `currentVersion`.
 */
export function findInvalidSince(files: ISourceFile[], currentVersion: string): ISinceProblem[] {
	const max = parseVersion(currentVersion);
	if (!max)
		throw new Error(`"${currentVersion}" is not an X.Y.Z version`);

	const problems: ISinceProblem[] = [];
	for (const { path, content } of files) {
		content.split('\n').forEach((text, index) => {
			for (const [, value] of text.matchAll(SINCE)) {
				const version = parseVersion(value);
				if (value !== 'next' && !(version && isAtMost(version, max)))
					problems.push({ path, line: index + 1, value });
			}
		});
	}
	return problems;
}

/**
 * Replaces every `@since next` with `@since <version>`.
 */
export function replaceSincePlaceholder(content: string, version: string): string {
	return content.replace(/@since next\b/g, `@since ${version}`);
}
