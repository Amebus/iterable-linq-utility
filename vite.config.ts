import { resolve } from 'path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
	build: {
		lib: {
			entry: resolve(import.meta.dirname, 'src/index.ts'),
			name: 'IterableLinq',
			fileName: 'iterable-linq-utility',
		},
	},
	plugins: [dts({ entryRoot: 'src', bundleTypes: true })],
});
