import js from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
	{
		ignores: ['dist', 'coverage', 'node_modules', '.pnpm-store', 'documentation/site']
	},
	js.configs.recommended,
	tseslint.configs.recommended,
	{
		languageOptions: {
			ecmaVersion: 'latest',
			globals: globals.node
		},
		plugins: {
			'@stylistic': stylistic
		},
		rules: {
			semi: 'off',
			'@stylistic/eol-last': 'error',
			'@stylistic/indent': ['error', 'tab'],
			'@stylistic/member-delimiter-style': 'error',
			'@stylistic/no-mixed-spaces-and-tabs': 'error',
			'@stylistic/no-multiple-empty-lines': ['error', { max: 1 }],
			'@stylistic/no-trailing-spaces': 'error',
			'@stylistic/quotes': ['error', 'single', { avoidEscape: true }],
			'@stylistic/semi': ['error', 'always'],
			'@typescript-eslint/consistent-indexed-object-style': 'error',
			'@typescript-eslint/consistent-type-definitions': 'error',
			'@typescript-eslint/explicit-module-boundary-types': 'off',
			'@typescript-eslint/no-duplicate-enum-values': 'error',
			'@typescript-eslint/no-empty-function': 'warn',
			'@typescript-eslint/no-explicit-any': 'off',
			'@typescript-eslint/no-inferrable-types': 'off',
			'@typescript-eslint/no-non-null-assertion': 'off',
			'@typescript-eslint/no-this-alias': 'off'
		}
	}
);
