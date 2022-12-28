export function getIteratorResult<T>(done: boolean, value?: T): IteratorResult<T> {
  return {
    done,
    value
  } as IteratorResult<T>;
}

export function getContinueIteratorResult<T>(value: T): IteratorResult<T> {
  return { done: false, value };
}

export function getDoneIteratorResult<T>(value?: T): IteratorResult<T> {
  return { done: true, value };
}

export function getFlatIteratorResult<T>(result: IteratorResult<T>): IteratorResult<T> {
  return result;
}