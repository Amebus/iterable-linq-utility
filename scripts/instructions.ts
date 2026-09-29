// Checks the references of the agent instructions: relative links point to existing files, and every cited ADR exists.
import { posix } from 'node:path';

import type { ISourceFile } from './since.ts';

export interface IReferenceProblem {
	path: string;
	line: number;
	message: string;
}

const LINK = /\[[^\]]*\]\(([^)\s]*)[^)]*\)/g;
const ADR_LIST = /\bADRs?\s+((?:\d{4}(?:\s*(?:,|and|or)\s*)?)+)/g;
const ADR_FILE = /^docs\/decisions\/(\d{4})-/;
const EXTERNAL = /^[a-z][a-z0-9+.-]*:/i;
const FENCE = /^\s*(`{3,}|~{3,})/;
const INLINE_CODE = /`[^`]*`/g;

/** The lines outside fenced code blocks, without inline code, with their 1-based numbers. */
function proseLines(content: string): [number, string][] {
	const lines: [number, string][] = [];
	let fence: string | undefined;
	content.split('\n').forEach((text, index) => {
		const marker = FENCE.exec(text)?.[1];
		if (fence === undefined && marker) {
			fence = marker;
		} else if (fence !== undefined) {
			if (marker && marker[0] === fence[0] && marker.length >= fence.length && text.trim() === marker)
				fence = undefined;
		} else {
			lines.push([index + 1, text.replace(INLINE_CODE, '')]);
		}
	});
	return lines;
}

/**
 * Every relative link that points to no file or folder of `repoFiles`, and every ADR number without a file in
 * `docs/decisions`, in `files`. External links, anchors and code are not checked.
 */
export function findBrokenReferences(files: ISourceFile[], repoFiles: string[]): IReferenceProblem[] {
	const existing = new Set(repoFiles);
	const exists = (path: string) => existing.has(path) || repoFiles.some(file => file.startsWith(`${path}/`));
	const adrs = new Set(repoFiles.map(file => ADR_FILE.exec(file)?.[1]).filter(n => n !== undefined));

	const problems: IReferenceProblem[] = [];
	for (const { path, content } of files) {
		for (const [line, text] of proseLines(content)) {
			for (const [, href] of text.matchAll(LINK)) {
				const target = href.split('#')[0];
				if (target === '' || EXTERNAL.test(target))
					continue;
				const resolved = posix.normalize(posix.join(posix.dirname(path), target)).replace(/\/$/, '');
				if (!exists(resolved))
					problems.push({ path, line, message: `broken link: ${resolved}` });
			}
			for (const [, list] of text.matchAll(ADR_LIST)) {
				for (const [number] of list.matchAll(/\d{4}/g)) {
					if (!adrs.has(number))
						problems.push({ path, line, message: `ADR ${number} does not exist in docs/decisions` });
				}
			}
		}
	}
	return problems;
}
