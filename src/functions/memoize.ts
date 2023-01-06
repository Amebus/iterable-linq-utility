import { LinkedListCollection } from "./_genericCollections";
import { unit, Unit } from "./_types";
import { getDoneIteratorResult, getFlatIteratorResult, isFunction } from "./_utils";

export interface IMemoizeOptions {
  allowPartialMemoization?: boolean;
}

export function getMemoizeDefaultOptions(): IMemoizeOptions {
  return {
    allowPartialMemoization: true
  };
}

/**
 * 
 * @operation `Transformation`
 * @param iterable 
 * @returns 
 */
export function memoize<T>(iterable: Iterable<T>, options?: IMemoizeOptions): Iterable<T> {
  if (iterable == null)
    throw 'The source "iterable" must be provided';

  const opt = {
    ...getMemoizeDefaultOptions(),
    ...options
  };

  const allowPartialMemoization = opt.allowPartialMemoization;

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
    return new MemoizeAsFullIterableIterator(this.source, ll => {
      this.memoized = ll;
      this.isMemoized = true;
      return unit();
    });
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

class MemoizeAsFullIterableIterator<T> implements Iterator<T> {
  constructor(sourceIterable: Iterable<T>, setAsMemoized: (linkedList: LinkedListCollection.LinkedList<T>) => Unit) {
    this.sourceIterable = sourceIterable;
    this.setAsMemoized = setAsMemoized;
  }

	private linkedListIterator: Iterator<T>;
	private readonly setAsMemoized: (linkedList: LinkedListCollection.LinkedList<T>) => Unit;
  private readonly sourceIterable: Iterable<T>;

  private internalNext = () => {
    const linkedList = LinkedListCollection.from(this.sourceIterable);
    this.setAsMemoized(linkedList);
    this.linkedListIterator = linkedList[Symbol.iterator]();
    this.internalNext = () => this.linkedListIterator.next();
    return this.internalNext();
  };

  next(): IteratorResult<T, any> {
    return this.internalNext();
  }

  return(value?: any): IteratorResult<T, any> {
    this.internalNext = getDoneIteratorResult;
    const linkedListIterator = this.linkedListIterator;
    if (linkedListIterator == null)
      return getDoneIteratorResult(value);
    this.linkedListIterator = null!;
    return linkedListIterator.return(value);
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
    this.linkedList = null!;
		this.linkedListIterator = null!;
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