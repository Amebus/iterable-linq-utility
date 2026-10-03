import { BaseIterator } from '../iterators';
import { getDoneIteratorResult, getContinueIteratorResult, Validations } from '../utils';

export function from<T>(iterable: Iterable<T>): LinkedList<T> {
	Validations.throwIfNotIterable(iterable, 'LinkedList.from');
	const linkedList = new LinkedList<T>();
	for (const value of iterable)
		linkedList.addLast(value);
	return linkedList;
}

export class LinkedList<T> implements Iterable<T> {
	private internalSize: number = 0;
	private head: IListNode<T> | null = null;
	private tail: IListNode<T> | null = null;

	[Symbol.iterator](): LinkedListIterator<T> {
		return new LinkedListIterator(this.head);
	}

	addFirst(value: T): this {
		const newNode: IListNode<T> = { data: value, nextNode: this.head };
		if (this.tail === null)
			this.tail = newNode;
		this.head = newNode;
		this.internalSize++;
		return this;
	}

	addLast(value: T): this {
		const newNode: IListNode<T> = { data: value, nextNode: null };
		if (this.tail === null)
			this.head = newNode;
		else
			this.tail.nextNode = newNode;
		this.tail = newNode;
		this.internalSize++;
		return this;
	}

	size(): number {
		return this.internalSize;
	}
}

export class LinkedListIterator<T> extends BaseIterator<T> {
	constructor(private current: IListNode<T> | null) {
		super();
	}

	protected advance(): IteratorResult<T> {
		const node = this.current;
		if (node === null)
			return getDoneIteratorResult();
		this.current = node.nextNode;
		return getContinueIteratorResult(node.data);
	}
}

interface IListNode<T> {
	data: T;
	nextNode: IListNode<T> | null;
}
