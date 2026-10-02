import { vi } from 'vitest';

/**
 * Test-only source whose `next()` throws `error` at the `failAt`-th call, and yields the number of the call otherwise:
 * 1, 2, …, and after the error `failAt + 1`, … It never ends, and `returnSpy` records the calls to `return()`.
 * Unlike a generator, it can be read again after the error: a test can check whether an operation asks the source again.
 * @param failAt the call of `next()` that throws, from 1
 * @param error the error thrown
 */
export function throwingSource(failAt: number, error: unknown): { returnSpy: ReturnType<typeof vi.fn>; iterable: Iterable<number> } {
	const returnSpy = vi.fn(() => ({ done: true as const, value: undefined }));
	const iterable = {
		[Symbol.iterator]: (): Iterator<number> => {
			let calls = 0;
			return {
				next: () => {
					if (++calls === failAt)
						throw error;
					return { done: false, value: calls };
				},
				return: returnSpy
			};
		}
	};
	return { returnSpy, iterable };
}
