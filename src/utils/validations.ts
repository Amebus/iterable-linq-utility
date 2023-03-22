import { Action, AsyncAction, Mapper, Predicate } from "../types";
import { isFunction } from "./utils";

export function throwIfNotIterable<T>(sourceIterable: Iterable<T>) {
	if (sourceIterable == null)
		throw new Error('The "sourceIterable" must be provided');
	if (!isFunction(sourceIterable[Symbol.iterator]))
		throw new Error('The provided "soureIterable" does not conform to the iterator protocol https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols#the_iterable_protocol. It must implement the "[Symbol.iterator]" function.');
}

export function thowIfNotValidPredicate<T>(predicate: Predicate<T>) {
	if (!isFunction(predicate))
		throw new Error('The "predicate" function must be provided');
}

export function thowIfNotValidMapper<T, R>(mapper: Mapper<T, R>) {
	if (!isFunction(mapper))
		throw new Error('The "mapper" function must be provided');
}
export function thowIfNotValidAction<T>(action: Action<T> | AsyncAction<T>) {
	if (!isFunction(action))
		throw new Error('The "action" function must be provided');
}
export function throwIfNotValidIterator<T, TR, TN>(sourceIterator: Iterator<T, TR, TN>) {
	if(!isFunction(sourceIterator.next))
		throw new Error('The proviced "sourceIterator" does not conform to the iterator protocol https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols#the_iterable_protocol. It must implement the "next" function.');
}