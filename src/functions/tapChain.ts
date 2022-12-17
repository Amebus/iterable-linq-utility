import { Tapper } from "@/types";

export function tapChain<T>(iterable: Iterable<T>, tapper: Tapper<Iterable<T>>): Iterable<T> {
	return new TapChainIterable(iterable, tapper);
}

class TapChainIterable <T> implements Iterable<T> { 
		
	constructor(iterable: Iterable<T>, tapper: Tapper<Iterable<T>>) {
		this.source = iterable;
		this.tapper = tapper;
	}

	[Symbol.iterator](): Iterator<T, any, undefined> {
		this.tapper(this.source, 0);
		return this.source[Symbol.iterator]();
		// return new TapChainIterableIterator(this.source, this.tapper);
	}

	private tapper: Tapper<Iterable<T>>;
	private source: Iterable<T>;
}