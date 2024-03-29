import { getDoneIteratorResult, getContinueIteratorResult } from "../utils";

export function from<T>(iterable: Iterable<T>): LinkedList<T> {
  if (iterable == null)
    throw 'The source "iterable" must be provided';
	const iterator: Iterator<T> = iterable[Symbol.iterator]();
	const linkedList = new LinkedList<T>();
	for (let n = iterator.next(); n.done !== true; n = iterator.next()) {
		linkedList.addLast(n.value);
	}
	return linkedList;
}

export class LinkedList<T> implements Iterable<T> {
  private internalSize: number = 0;
  private head: IListNode<T> | null = null;
  private tail: IListNode<T> | null = null;

  [Symbol.iterator](): LinkedListIterator<T> {
    return new LinkedListIterator(this.head || null);
  }

  private internalAddFirst: (value: T) => this = value => {
    const newNode: IListNode<T> = {
      data: value,
      nextNode: null
    };
    this.head = newNode;
    this.tail = newNode;
    this.internalSize++;
    this.internalAddFirst = v => {
      const newNode: IListNode<T> = {
        data: v,
        nextNode: null
      };
      newNode.nextNode = this.head;
      this.head = newNode;
      this.internalSize++;
      return this;
    };
    return this;
  };
  addFirst(value: T): this {
    return this.internalAddFirst(value);
    // const newNode: IListNode<T> = {
    //   data: value,
    //   nextNode: null
    // };

    // switch (this.internalSize) {
    //   case 0:
    //     this.head = newNode;
    //     this.tail = newNode;
    //     break;
    //   default:
    //     newNode.nextNode = this.head;
    //     this.head = newNode;
    // }
    // this.internalSize++;
    // return this;
  }

  private internalAddLast: (value: T) => this = value => {
    const newNode: IListNode<T> = {
      data: value,
      nextNode: null
    };
    this.head = newNode;
    this.tail = newNode;
    this.internalSize++;
    this.internalAddLast = v => {
      const newNode: IListNode<T> = {
        data: v,
        nextNode: null
      };
      this.tail!.nextNode = newNode;
      this.tail = newNode;
      this.internalSize++;
      return this;
    };
    return this;
  };
  addLast(value: T): this {
    return this.internalAddLast(value);
    // const newNode: IListNode<T> = {
    //   data: value,
    //   nextNode: null
    // };

    // switch (this.internalSize) {
    //   case 0:
    //     this.head = newNode;
    //     this.tail = newNode;
    //     break;
    //   default:
    //     this.tail!.nextNode = newNode;
    //     this.tail = newNode;
    // }
    // this.internalSize++;
    // return this;
  }

  size(): number {
    return this.internalSize;
  }
}


export class LinkedListIterator<T> implements Iterator<T> {
  private current: IListNode<T> | null;

  constructor(current: IListNode<T> | null) {
    this.current = current;
  }

  private innerNext: () => IteratorResult<T, any> = () => {
    const r = this.current;
    if (r === null) return getDoneIteratorResult<T>();
    this.current = r.nextNode;
    return getContinueIteratorResult(r.data);
  };

  next() {
    return this.innerNext();
  }

  return(value?: any): IteratorResult<T, any> {
    this.innerNext = getDoneIteratorResult;
    return getDoneIteratorResult(value);
  }
}

interface IListNode<T> {
  data: T;
  nextNode: IListNode<T> | null;
}