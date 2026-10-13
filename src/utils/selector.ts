/**
 * Whether `value` can be a property key: a `string`, a `symbol` or a `number`, as `v[key]` accepts.
 */
export function isPropertyKey(value: unknown): value is PropertyKey {
	const type = typeof value;
	return type === 'string' || type === 'symbol' || type === 'number';
}

