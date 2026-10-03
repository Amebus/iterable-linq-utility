/**
 * An error created by the library, its message prefixed with `[iterable-linq-utility/<operation>]`.
 * The errors of the source and of the callbacks are not created here: they propagate unchanged.
 */
export function libraryError(operation: string, message: string): Error {
	return new Error(`[iterable-linq-utility/${operation}] ${message}`);
}
