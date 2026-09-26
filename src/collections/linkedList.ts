import { getDoneIteratorResult, getContinueIteratorResult, Validations } from '../utils';

export function from<T>(iterable: Iterable<T>): LinkedList<T> {
	Validations.throwIfNotIterable(iterable);
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

	private internalNext: () => IteratorResult<T, any> = () => {
		const r = this.current;
		if (r === null) return getDoneIteratorResult<T>();
		this.current = r.nextNode;
		return getContinueIteratorResult(r.data);
	};

	next() {
		return this.internalNext();
	}

	return(value?: any): IteratorResult<T, any> {
		this.internalNext = getDoneIteratorResult;
		return getDoneIteratorResult(value);
	}
}

interface IListNode<T> {
	data: T;
	nextNode: IListNode<T> | null;
}
