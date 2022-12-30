import { LinkedListCollection } from "./_genericCollections";
import { getDoneIteratorResult, getFlatIteratorResult, isFunction } from "./_utils";

/**
 * 
 * @operation `Transformation`
 * @param iterable 
 * @returns 
 */
export function memoize<T>(iterable: Iterable<T>, allowPartialMemoization: boolean = false): Iterable<T> {
  if (iterable == null)
    throw 'The source "iterable" must be provided';

  if (iterable instanceof MemomizeAsFullIterable) {
    if (allowPartialMemoization)
      return iterable.changePartialMemoizationBehaviour();
    return iterable;
  }
  if (iterable instanceof MemomizeAsPartialIterable) {
    if (allowPartialMemoization)
      return iterable;
    return iterable.changePartialMemoizationBehaviour();
  }

  if (allowPartialMemoization)
    return new MemomizeAsPartialIterable(iterable);
  return new MemomizeAsFullIterable(iterable);
}

// TODO maybe memoize should forget the original chain after first run
class MemomizeAsFullIterable<T> implements Iterable<T> {
  constructor(iterable: Iterable<T>) {
    this.source = iterable;
  }
  private source: Iterable<T>;
  private isMemoized = false;
	private memoized = new LinkedListCollection.LinkedList<T>();

  [Symbol.iterator](): Iterator<T, any, undefined> {
    if (this.isMemoized) return new MemoizeMemoizedIterator(this.memoized);
    this.memoized = LinkedListCollection.from(this.source);
    this.isMemoized = true;
    return new MemoizeMemoizedIterator(this.memoized);
  }

  changePartialMemoizationBehaviour(): MemomizeAsPartialIterable<T> {
    return new MemomizeAsPartialIterable(this.source);
  }
}
class MemomizeAsPartialIterable<T> implements Iterable<T> {
  constructor(iterable: Iterable<T>) {
    this.source = iterable;
  }

  private isMemoized = false;
  private isMemoizationStarted = false;
	private sourceIterator!: Iterator<T>;
	private readonly linkedList = new LinkedListCollection.LinkedList<T>();
  private readonly source: Iterable<T>;

  [Symbol.iterator](): Iterator<T, any, undefined> {
    if (!this.isMemoizationStarted) {
      this.sourceIterator = this.source[Symbol.iterator]();
      this.isMemoizationStarted = true;
    }

    if (this.isMemoized) return new MemoizeMemoizedIterator(this.linkedList);
		return new MemomizeAsPartialIterableIterator(this.sourceIterator, this.linkedList, (n: IteratorResult<T, any>) => this.isMemoized = n.done === true);
  }

  changePartialMemoizationBehaviour(): MemomizeAsFullIterable<T> {
    return new MemomizeAsFullIterable(this.source);
  }
}


class MemomizeAsPartialIterableIterator<T> implements Iterator<T> {
	constructor(sourceIterator: Iterator<T>, linkedList: LinkedListCollection.LinkedList<T>, setAsMemoized: (n: IteratorResult<T, any>) => boolean) {
		this.linkedList = linkedList;
		this.linkedListIterator = linkedList[Symbol.iterator]();
		this.setAsMemoized = setAsMemoized;
		this.sourceIterator = sourceIterator;
    this.internalNext = () => {
      if (this.linkedList.size() > this.index++)
        return this.linkedListIterator.next();
      const n = this.sourceIterator.next();
      if (!this.setAsMemoized(n)) {
        this.linkedList.addLast(n.value);
      }
      return getFlatIteratorResult(n);
    };
	}

	private index = 0;
	private linkedList: LinkedListCollection.LinkedList<T>;
	private linkedListIterator: Iterator<T>;
	private setAsMemoized: (n: IteratorResult<T, any>) => boolean;
	private sourceIterator: Iterator<T>;

  private internalNext: () => IteratorResult<T, any>;

	next(): IteratorResult<T, any> {
		return this.internalNext();
	}

  return(value?: any): IteratorResult<T, any> {
    this.internalNext = getDoneIteratorResult;
    if (isFunction(this.sourceIterator.return))
      return this.sourceIterator.return(value);
    return getDoneIteratorResult(value);
  }
}

class MemoizeMemoizedIterator<T>  implements Iterator<T> {
	constructor(memoizedSource: LinkedListCollection.LinkedList<T>) {
		this.memoizedSourceIterator = memoizedSource[Symbol.iterator]();
	}

	private memoizedSourceIterator: LinkedListCollection.LinkedListIterator<T>;

	next(): IteratorResult<T, any> {
		return this.memoizedSourceIterator.next();
	}

  return(value?: any): IteratorResult<T, any> {
    return this.memoizedSourceIterator.return(value);
  }
}