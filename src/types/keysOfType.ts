/**
 * The keys of `T` whose value is assignable to `V`: the property keys a selector accepts when it must read a `V`,
 * for example the `number` keys of `sum` and `average`. An optional property is left out, since its value can be `undefined`.
 * @example
 * ```ts
 * type Order = { id: number; customer: string; discount?: number };
 * type NumberKeys = KeysOfType<Order, number>; // 'id'
 * ```
 * @since next
 */
export type KeysOfType<T, V> = { [P in keyof T]-?: T[P] extends V ? P : never }[keyof T];
