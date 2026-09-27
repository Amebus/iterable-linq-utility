# Interoperability with other libraries

!!! danger "WIP"
    This page is still to be written.

Every chain is a standard `Iterable`, so it works wherever an `Iterable` is accepted: `for…of`, spread (`[...chain]`), `Array.from`, `new Set(chain)`, `Promise.all(chain)` and the functions of other libraries that accept iterables.
