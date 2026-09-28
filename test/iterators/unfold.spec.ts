import { describe, expect, test, vi } from 'vitest';

import { unfold } from '@/iterators';

describe('unfold', () => {

	test('produces values until the step returns undefined', () => {
		const unfolded = unfold(0, i => i < 3 ? [i * 10, i + 1] as const : undefined);
		expect([...unfolded]).toEqual([0, 10, 20]);
		expect([...unfolded]).toEqual([0, 10, 20]);
	});

	test('empty when the first step returns undefined', () => {
		expect([...unfold(0, () => undefined)]).toEqual([]);
	});

	test('the step is not called before iteration', () => {
		const step = vi.fn((i: number) => i < 1 ? [i, i + 1] as const : undefined);
		unfold(0, step);
		expect(step).not.toHaveBeenCalled();
	});

	test('stays done', () => {
		const it = unfold(0, i => i < 1 ? [i, i + 1] as const : undefined)[Symbol.iterator]();
		expect(it.next()).toEqual({ done: false, value: 0 });
		expect(it.next().done).toBe(true);
		expect(it.next().done).toBe(true);
	});

});
