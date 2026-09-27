/**
 * The type with exactly one value, `unit()`: what an action or a tapper returns when it has nothing to return.
 * It is nominal: no other value (numbers, strings, objects, `{}`) is assignable to `Unit`.
 */
export class Unit {
	/** The only value of the type. */
	static readonly instance: Unit = Unit.createFrozen();

	// private member: makes the type nominal without adding a runtime property
	private declare readonly unitBrand: never;

	private constructor() {
		// only Unit.instance is ever created
	}

	private static createFrozen(): Unit {
		const value = new Unit();
		Object.freeze(value);
		return value;
	}
}

/**
 * Returns the only value of `Unit`.
 */
export function unit(): Unit {
	return Unit.instance;
}
