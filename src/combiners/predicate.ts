import { Predicate } from "../types";

export function combinePredicates<T>(p1: Predicate<T>, p2: Predicate<T>): Predicate<T> {
	return (value: T, index: number) => {
		return p1(value, index) && p2(value, index);
	};
}
