/* eslint-env node */
require('@rushstack/eslint-patch/modern-module-resolution');

module.exports = {
  root: true,
  'extends': [
    'eslint:recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    "plugin:@typescript-eslint/recommended",    
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  parserOptions: {
    ecmaVersion: 'latest'
  },
  rules: {
    semi: 'off',
    '@typescript-eslint/consistent-indexed-object-style': 'error',
		'@typescript-eslint/consistent-type-definitions': 'error',
		'@typescript-eslint/explicit-module-boundary-types': 'off',
		'@typescript-eslint/member-delimiter-style': 'error',
		'@typescript-eslint/no-duplicate-enum-values': 'error',
		'@typescript-eslint/no-empty-function': 'warn',
		'@typescript-eslint/no-explicit-any': 'off',
		'@typescript-eslint/no-inferrable-types': 'off',
		'@typescript-eslint/no-non-null-assertion': 'off',
		'@typescript-eslint/no-this-alias': 'off',
		'@typescript-eslint/semi': [
			'warn'
		]
  }
};
