// Reads the notes of one version from CHANGELOG.md, for its GitHub Release.

/**
 * The lines after `## <version>` up to the next `## ` heading or the end, trimmed; `undefined` when the heading is missing.
 */
export function extractChangelogSection(changelog: string, version: string): string | undefined {
	const lines = changelog.split('\n');
	const start = lines.findIndex(line => line.trim() === `## ${version}`);
	if (start === -1)
		return undefined;
	const end = lines.findIndex((line, index) => index > start && line.startsWith('## '));
	return lines.slice(start + 1, end === -1 ? undefined : end).join('\n').trim();
}
