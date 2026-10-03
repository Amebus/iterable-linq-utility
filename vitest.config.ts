import { resolve } from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	resolve: {
		alias: {
			'@': resolve(import.meta.dirname, 'src'),
			// The benches run the built bundle, as users do.
			'iterable-linq-utility': resolve(import.meta.dirname, 'dist/iterable-linq-utility.js')
		}
	},
	test: {
		coverage: {
			provider: 'istanbul',
			// the library only: the scripts of the repository are tested, but they are not published
			include: ['src/**'],
			// lcov is the report uploaded to Codecov by the CI
			reporter: ['text', 'json', 'html', 'lcov'],
			// every line and branch of the library is tested: test:coverage, and so the build check, fails below (ADR 0019)
			thresholds: { 100: true },
			clean: true
		}
	},
});
