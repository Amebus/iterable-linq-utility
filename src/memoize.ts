import { getFlatIteratorResult } from "./iteratorResults";
import { LinkedList } from "./linkedList";

export function memoize<T>(iterable: Iterable<T>): Iterable<T> {
  if (iterable instanceof MemoizeIterable) {
    return iterable;
  }
  return new MemoizeIterable(iterable);
}
// TODO add boolean param to prevent partial memoization
// TODO maybe memoize should forget the original chain after first run
class MemoizeIterable<T> implements Iterable<T> {
  constructor(iterable: Iterable<T>) {
    this.source = iterable;
		this.sourceIterator = iterable[Symbol.iterator]();
    if (iterable instanceof LinkedList) {
      // console.log("constructor - saving the input");
      this.linkedList = iterable;
      this.isMemoized = true;
    }
  }

  private isMemoized = false;
	private sourceIterator: Iterator<T>;
	private linkedList = new LinkedList<T>();
  private source: Iterable<T>;

  [Symbol.iterator](): Iterator<T, any, undefined> {
    if (this.isMemoized) return new MemoizeMemoizedIterator(this.linkedList);
		return new MemoizeIterableIterator(this.sourceIterator, this.linkedList, (n: IteratorResult<T, any>) => this.isMemoized = n.done === true);
    // const iterator: Iterator<T> = this.iterable[Symbol.iterator]();
    // return {
    //   next: () => {
    //     const n = iterator.next();
    //     this.isMemoized = n.done === true;
    //     if (!this.isMemoized) {
    //       this.linkedList.addLast(n.value);
    //     }
    //     return getFlatIteratorResult(n);
    //   }
    // };
  }
}


class MemoizeIterableIterator<T> implements Iterator<T> {
	constructor(sourceIterator: Iterator<T>, linkedList: LinkedList<T>, setAsMemoized: (n: IteratorResult<T, any>) => boolean) {
		this.linkedList = linkedList;
		this.linkedListIterator = linkedList[Symbol.iterator]();
		this.setAsMemoized = setAsMemoized;
		this.sourceIterator = sourceIterator;
	}

	private index = 0;
	private linkedList: LinkedList<T>;
	private linkedListIterator: Iterator<T>;
	private setAsMemoized: (n: IteratorResult<T, any>) => boolean;
	private sourceIterator: Iterator<T>;

	next(): IteratorResult<T, any> {
		if (this.linkedList.size() > this.index++)
      return this.linkedListIterator.next();
    const n = this.sourceIterator.next();
    if (!this.setAsMemoized(n)) {
      this.linkedList.addLast(n.value);
    }
    return getFlatIteratorResult(n);
	}
}

class MemoizeMemoizedIterator<T>  implements Iterator<T> {
	constructor(memoizedSource: Iterable<T>) {
		this.memoizedSourceIterator = memoizedSource[Symbol.iterator]();
	}

	private memoizedSourceIterator: Iterator<T>;
	
	next(): IteratorResult<T, any> {
		return this.memoizedSourceIterator.next();
	}
}