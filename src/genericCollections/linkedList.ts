import { getDoneIteratorResult, getIteratorResult } from "@/utils";

export function from<T>(iterable: Iterable<T>): LinkedList<T> {
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

  [Symbol.iterator](): Iterator<T> {
    return new LinkedListIterator(this.head);
  }

  addFirst(value: T): this {
    const newNode: IListNode<T> = {
      data: value,
      nextNode: null
    };

    switch (this.internalSize) {
      case 0:
        this.head = newNode;
        this.tail = newNode;
        break;
      default:
        newNode.nextNode = this.head;
        this.head = newNode;
    }
    this.internalSize++;
    return this;
  }

  addLast(value: T): this {
    const newNode: IListNode<T> = {
      data: value,
      nextNode: null
    };

    switch (this.internalSize) {
      case 0:
        this.head = newNode;
        this.tail = newNode;
        break;
      default:
        this.tail!.nextNode = newNode;
        this.tail = newNode;
    }
    this.internalSize++;
    return this;
  }

  size(): number {
    return this.internalSize;
  }
}


export class LinkedListIterator<T> implements Iterator<T> {
  private current: IListNode<T> | null = null;

  constructor(current: IListNode<T> | null = null) {
    this.current = current;
  }

  next() {
    const r = this.current;
    if (r === null) return getDoneIteratorResult<T>();
    this.current = r.nextNode;
    return getIteratorResult(false, r.data);
  }
}

interface IListNode<T> {
  data: T;
  nextNode: IListNode<T> | null;
}