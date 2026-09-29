import { describe, expect, test } from 'vitest';

import { extractChangelogSection } from '../../scripts/changelog.ts';

const changelog = `# iterable-linq-utility

## 0.3.0

### Minor Changes

- concat()

## 0.2.0

### Minor Changes

- reduce() without a seed
`;

describe('extractChangelogSection', () => {

	test('returns the body of a version, up to the next version', () => {
		expect(extractChangelogSection(changelog, '0.3.0')).toBe('### Minor Changes\n\n- concat()');
	});

	test('returns the body of the last version, up to the end', () => {
		expect(extractChangelogSection(changelog, '0.2.0')).toBe('### Minor Changes\n\n- reduce() without a seed');
	});

	test('returns undefined for a version without a section', () => {
		expect(extractChangelogSection(changelog, '0.1.0')).toBeUndefined();
	});

	test('does not match a longer version with the same prefix', () => {
		expect(extractChangelogSection('## 0.2.01\n\n- other\n', '0.2.0')).toBeUndefined();
	});

});
