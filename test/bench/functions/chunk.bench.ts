import * as Helpers from '../helpers';

import * as IterableLinq from 'iterable-linq-utility';

// Read the exports once: an imported binding goes through a module runner getter on every read.
const { Functions } = IterableLinq;
const { group, scenarios } = Helpers;

function slices(values: number[], size: number): number[][] {
	const chunks: number[][] = [];
	for (let i = 0; i < values.length; i += size)
		chunks.push(values.slice(i, i + size));
	return chunks;
}

// the number of values in the chunks, so every chunk is read
function count(chunks: Iterable<number[]>): number {
	let total = 0;
	for (const values of chunks)
		total += values.length;
	return total;
}

function chunk(size: number): Helpers.IVariants {
	return {
		native: values => count(slices(values, size)),
		chain: chain => count(chain.chunk(size)),
		Functions: values => count(Functions.chunk(values, size))
	};
}

scenarios('chunk', chunk(10));
// one array per value
group('chunk', 'size-1', chunk(1));
