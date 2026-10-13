/** The number of a tuple index: `'1'` gives `1`. */
type TupleIndex<I> = I extends `${infer N extends number}` ? N : never;

/** Whether the types `A` and `B` have values in common, in either direction: `number | undefined` and `number`, `string` and `'a' | 'b'`. */
type Overlaps<A, B> = [Extract<A, B>] extends [never] ? ([Extract<B, A>] extends [never] ? false : true) : true;

/**
 * The keys of `T` whose value is assignable to `V`: the property keys a selector accepts when it must read a `V`,
 * for example the `number` keys of `sum` and `average`. An optional property is left out, since its value can be `undefined`.
 * On a tuple the keys are its indices, as numbers, and on an array `number`.
 * @example
 * ```ts
 * type Order = { id: number; customer: string; discount?: number };
 * type NumberKeys = KeysOfType<Order, number>; // 'id'
 * type EntryKeys = KeysOfType<[string, number], number>; // 1
 * ```
 * @since next
 */
export type KeysOfType<T, V> = [T] extends [readonly unknown[]]
	? number extends T['length']
		? (T[number] extends V ? number : never)
		: { [I in keyof T]-?: T[I] extends V ? TupleIndex<I> : never }[number]
	: { [P in keyof T]-?: T[P] extends V ? P : never }[keyof T];

/**
 * The keys of `T` whose value has values in common with `V`: the property keys a join accepts for a key that must match keys of type `V`.
 * Unlike `KeysOfType`, an optional property is kept (`customerId?: number` matches `number`),
 * and the check goes both ways (`string` matches `'a' | 'b'`), as with two functions.
 * On a tuple the keys are its indices, as numbers, and on an array `number`.
 * @example
 * ```ts
 * type Order = { customerId?: number; note: string };
 * type CustomerKeys = KeysOverlapping<Order, number>; // 'customerId'
 * ```
 * @since next
 */
export type KeysOverlapping<T, V> = [T] extends [readonly unknown[]]
	? number extends T['length']
		? (Overlaps<T[number], V> extends true ? number : never)
		: { [I in keyof T]-?: Overlaps<T[I], V> extends true ? TupleIndex<I> : never }[number]
	: { [P in keyof T]-?: Overlaps<T[P], V> extends true ? P : never }[keyof T];
