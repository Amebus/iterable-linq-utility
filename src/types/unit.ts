export class Unit {}

const value = new Unit();
Object.freeze(value);

export function unit() {
	return value;
}
