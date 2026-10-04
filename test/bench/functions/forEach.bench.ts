import * as Helpers from '../helpers';

import * as IterableLinq from 'iterable-linq-utility';

// Read the exports once: an imported binding goes through a module runner getter on every read.
const { Functions, unit } = IterableLinq;
const { scenarios } = Helpers;

const u = unit();
// the actions write the values somewhere, so the engine cannot drop them
const sink = { total: 0 };

function add(v: number): void {
	sink.total += v;
}

scenarios('forEach', {
	native: values => values.forEach(add),
	loop: values => {
		for (const v of values) {
			add(v);
		}
	},
	chain: chain => chain.forEach(v => {
		add(v);
		return u;
	}),
	Functions: values => Functions.forEach(values, v => {
		add(v);
		return u;
	})
});

// No array method awaits: the native case is a loop.
scenarios('forEachAsync', {
	native: async values => {
		for (const v of values) {
			await Promise.resolve();
			add(v);
		}
	},
	chain: chain => chain.forEachAsync(async v => {
		await Promise.resolve();
		add(v);
		return u;
	}),
	Functions: values => Functions.forEachAsync(values, async v => {
		await Promise.resolve();
		add(v);
		return u;
	})
});
