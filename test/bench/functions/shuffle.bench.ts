import * as Helpers from '../helpers';

import * as IterableLinq from 'iterable-linq-utility';

// Read the exports once: an imported binding goes through a module runner getter on every read.
const { Functions } = IterableLinq;
const { group, scenarios, sum } = Helpers;

// There is no native shuffle: the reference is the same loop, by hand, on an array.
function fisherYates(values: number[], count: number = values.length): number[] {
	const copy = [...values];
	const result = new Array<number>(count);
	for (let i = 0; i < count; i++) {
		const j = i + Math.floor(Math.random() * (copy.length - i));
		result[i] = copy[j];
		copy[j] = copy[i];
	}
	return result;
}

scenarios('shuffle', {
	native: values => sum(fisherYates(values)),
	chain: chain => sum(chain.shuffle()),
	Functions: values => sum(Functions.shuffle(values))
});

group('shuffle', 'seed', {
	native: values => sum(fisherYates(values)),
	chain: chain => sum(chain.shuffle({ seed: 42 })),
	Functions: values => sum(Functions.shuffle(values, { seed: 42 }))
});

group('shuffle', 'take', {
	native: values => sum(fisherYates(values, 10)),
	chain: chain => sum(chain.shuffle().take(10)),
	Functions: values => sum(Functions.take(Functions.shuffle(values), 10))
});
