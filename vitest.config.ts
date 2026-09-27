import { resolve } from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	resolve: {
		alias: {
			'@': resolve(__dirname, 'src')
		}
	},
	test: {
		coverage: {
			provider: 'istanbul',
			reporter: ['text', 'json', 'html'],
			clean: true
		}
	},
});
