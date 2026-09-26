export function getContinueIteratorResult<T>(value: T): IteratorResult<T> {
	return { done: false, value };
}

export function getDoneIteratorResult<T>(value?: T): IteratorResult<T> {
	return { done: true, value };
}
