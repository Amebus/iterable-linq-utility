import { BaseIterator, DeferredIterable } from '../iterators';
import { getContinueIteratorResult, getDoneIteratorResult, libraryError, Validations } from '../utils';
import type { IObjectDefaultOptions, IObjectOptions, ObjectItem, ObjectYield } from '../types';

type ItemReader = (object: object, key: PropertyKey, descriptor: PropertyDescriptor, owner: object) => unknown;

/** What each `yield` reads; the value is read from the object, so a getter runs with the object as `this`. */
const ITEMS: Record<ObjectYield, ItemReader> = {
	entries: (object, key) => [key, (object as Record<PropertyKey, unknown>)[key]],
	keys: (_object, key) => key,
	values: (object, key) => (object as Record<PropertyKey, unknown>)[key],
	descriptors: (_object, key, descriptor, owner) => [key, descriptor, owner]
};

const BOOLEAN_OPTIONS = ['inherited', 'nonEnumerable', 'symbols'] as const;

/**
 * Returns the properties of `object`: its entries, its keys, its values or its property descriptors.
 * With the default options it yields what `Object.entries` returns: the own, enumerable, string keys.
 * - `inherited` also reads the prototype chain, up to `Object.prototype` excluded; a key is yielded once, from the nearest object that has it, like `for…in`.
 * - `nonEnumerable` also reads the non-enumerable properties, `symbols` the symbol keys.
 * - The keys of an object are read when the iteration reaches it, a value when it is yielded: each run reads the object again.
 * @operation `Transformation`
 * @param object - the object to read
 * @param options - `yield` (`'entries'`, `'keys'`, `'values'` or `'descriptors'`), `inherited`, `nonEnumerable` and `symbols`
 * @returns a lazy, re-runnable `Iterable` of the properties of `object`
 * @throws Error if `object` is not an object or a function, `options` is not an object, `yield` is not one of its values, or a flag is not a boolean
 * @example
 * ```ts
 * Array.from(Functions.fromObject({ a: 1, b: 2 })); // [['a', 1], ['b', 2]]
 * Array.from(Functions.fromObject({ a: 1, b: 2 }, { yield: 'keys' })); // ['a', 'b']
 * ```
 * @since next
 */
export function fromObject<O extends object, const Options extends IObjectOptions = IObjectDefaultOptions>(object: O, options?: Options): Iterable<ObjectItem<O, Options>> {
	if (object === null || (typeof object !== 'object' && typeof object !== 'function'))
		throw libraryError('fromObject', 'The "object" parameter must be an object');
	if (options !== undefined)
		Validations.throwIfNotObject(options, 'options', 'fromObject');
	const { yield: kind = 'entries' } = options ?? {};
	if (!Object.hasOwn(ITEMS, kind))
		throw libraryError('fromObject', 'The "yield" option must be "entries", "keys", "values" or "descriptors"');
	for (const name of BOOLEAN_OPTIONS)
		if (options?.[name] !== undefined)
			Validations.throwIfNotBoolean(options[name], name, 'fromObject');

	const read: IReadOptions = {
		item: ITEMS[kind],
		inherited: options?.inherited ?? false,
		nonEnumerable: options?.nonEnumerable ?? false,
		symbols: options?.symbols ?? false
	};
	return new DeferredIterable(() => new FromObjectIterator(object, read)) as Iterable<ObjectItem<O, Options>>;
}

interface IReadOptions {
	readonly item: ItemReader;
	readonly inherited: boolean;
	readonly nonEnumerable: boolean;
	readonly symbols: boolean;
}

class FromObjectIterator extends BaseIterator<unknown> {
	/** The object or prototype whose keys are read; `undefined` when the prototype chain is over. */
	private owner: object | undefined;
	private keys: readonly PropertyKey[] | undefined;
	private index = 0;
	/** The keys met on the nearer objects: they shadow the same keys of the prototypes. */
	private readonly seen: Set<PropertyKey> | undefined;

	constructor(private readonly object: object, private readonly options: IReadOptions) {
		super();
		this.owner = object;
		this.seen = options.inherited ? new Set() : undefined;
	}

	protected advance(): IteratorResult<unknown> {
		while (this.owner !== undefined) {
			this.keys ??= Reflect.ownKeys(this.owner);
			while (this.index < this.keys.length) {
				const result = this.read(this.owner, this.keys[this.index++]);
				if (result !== undefined)
					return result;
			}
			this.nextOwner(this.owner);
		}
		return getDoneIteratorResult();
	}

	/** The item of `key`, or `undefined` when the options skip it, it is shadowed or it was deleted. */
	private read(owner: object, key: PropertyKey): IteratorResult<unknown> | undefined {
		if (typeof key === 'symbol' && !this.options.symbols)
			return undefined;
		if (this.seen?.has(key))
			return undefined;
		const descriptor = Reflect.getOwnPropertyDescriptor(owner, key);
		if (descriptor === undefined)
			return undefined;
		this.seen?.add(key);
		if (!descriptor.enumerable && !this.options.nonEnumerable)
			return undefined;
		return getContinueIteratorResult(this.options.item(this.object, key, descriptor, owner));
	}

	private nextOwner(owner: object): void {
		const prototype = this.options.inherited ? Reflect.getPrototypeOf(owner) : null;
		this.owner = prototype === null || prototype === Object.prototype ? undefined : prototype;
		this.keys = undefined;
		this.index = 0;
	}
}
