/**
 * What `fromObject` yields for each property.
 * @since next
 */
export type ObjectYield = 'entries' | 'keys' | 'values' | 'descriptors';

/**
 * Options of `fromObject`. The defaults read what `Object.keys` reads: the own, enumerable, string keys.
 * @since next
 */
export interface IObjectOptions {
	/** `'entries'` (default) yields `[key, value]`, `'keys'` the keys, `'values'` the values, `'descriptors'` `[key, descriptor, owner]` without calling the getters. */
	yield?: ObjectYield;
	/** Also reads the properties of the prototype chain, up to `Object.prototype` excluded; defaults to `false`. */
	inherited?: boolean;
	/** Also reads the non-enumerable properties; defaults to `false`. */
	nonEnumerable?: boolean;
	/** Also reads the symbol keys; defaults to `false`. */
	symbols?: boolean;
}

/**
 * The options of `fromObject` when none are given: the type of the values follows `Object.entries`.
 * @since next
 */
export interface IObjectDefaultOptions extends IObjectOptions {
	yield?: 'entries';
	inherited?: false;
	nonEnumerable?: false;
	symbols?: false;
}

/** `true` when the options may read keys that are not in `keyof O`: inherited or non-enumerable ones. */
// the patterns list every option: an object type with only optional properties matches a type only when they share one
type ReadsWide<Options extends IObjectOptions> =
	Options extends { yield?: unknown; inherited?: false; nonEnumerable?: false; symbols?: unknown } ? false : true;

type ReadsSymbols<Options extends IObjectOptions> =
	Options extends { yield?: unknown; inherited?: unknown; nonEnumerable?: unknown; symbols?: false } ? false : true;

/**
 * The type of the keys `fromObject` yields: the keys of `O` as strings, as they are at runtime,
 * or `string` (and `symbol`) when the options read keys that `O` does not declare.
 * @since next
 */
export type ObjectKey<O, Options extends IObjectOptions> = ReadsWide<Options> extends true
	? string | (ReadsSymbols<Options> extends true ? symbol : never)
	: `${Extract<keyof O, string | number>}` | (ReadsSymbols<Options> extends true ? Extract<keyof O, symbol> : never);

/**
 * The type of the values `fromObject` yields: the values of the keys of `O` it reads, or `unknown`
 * when the options read keys that `O` does not declare.
 * @since next
 */
export type ObjectValue<O, Options extends IObjectOptions> = ReadsWide<Options> extends true
	? unknown
	: O[Extract<keyof O, string | number> | (ReadsSymbols<Options> extends true ? Extract<keyof O, symbol> : never)];

/** Distributes over `Y`, so a `yield` typed as a union gives the union of the items; `undefined` gives the entries. */
type ObjectItemOf<O, Options extends IObjectOptions, Y> =
	Y extends 'keys' ? ObjectKey<O, Options>
		: Y extends 'values' ? ObjectValue<O, Options>
			: Y extends 'descriptors' ? [ObjectKey<O, Options>, PropertyDescriptor, object]
				: [ObjectKey<O, Options>, ObjectValue<O, Options>];

/**
 * The type of the values of `fromObject(object, options)`, chosen by `options.yield` (default `'entries'`).
 * @since next
 */
export type ObjectItem<O, Options extends IObjectOptions> = ObjectItemOf<O, Options, Options extends { yield: infer Y }
	? Y
	// an optional yield may be missing at runtime: its entries too
	: Options extends { yield?: infer Y } ? Y | undefined : undefined>;
