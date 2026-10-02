# Interoperability with other libraries

Every chain is a standard `Iterable`, so it works wherever an `Iterable` is accepted: `for…of`, spread (`[...chain]`), `Array.from`, `new Set(chain)`, `Promise.all(chain)` and the functions of other libraries that accept iterables.

## RxJS

[RxJS](https://rxjs.dev/) `from` accepts any `Iterable`, so a chain becomes an Observable without adapters:

```typescript
import * as IterableLinq from 'iterable-linq-utility';
import { from } from 'rxjs';

const evens = IterableLinq.fromRange(10).filter(v => v % 2 === 0);

from(evens).subscribe(v => console.log(v));
// 0, 2, 4, 6, 8
```

The chain stays lazy: the Observable reads it when it is subscribed, and an operator that stops early, like `take`, stops the chain and closes its source:

```typescript
import { from, take } from 'rxjs';

let reads = 0;
const numbers = IterableLinq.fromRange(1000).map(v => { reads++; return v; });

from(numbers).pipe(take(2)).subscribe(v => console.log(v));
// 0, 1
reads;
// 2
```

Every subscription runs the chain again, from its source: see [Repeatable Execution](index.md#repeatable-execution).

An Observable is not an `Iterable`: to go the other way, collect its values first, for example with `toArray` and `lastValueFrom`, then pass the array to `IterableLinq.from`:

```typescript
import { from, lastValueFrom, toArray } from 'rxjs';

const values = await lastValueFrom(from([1, 2, 3]).pipe(toArray()));
IterableLinq.from(values).map(v => v * 10).collectToArray();
// [10, 20, 30]
```

## Immutable.js

The [Immutable.js](https://immutable-js.com/) constructors accept any `Iterable`: `List` and `Set` read the whole chain, `Seq` stays lazy.

```typescript
import * as IterableLinq from 'iterable-linq-utility';
import { List, Seq, Set } from 'immutable';

const evens = IterableLinq.fromRange(10).filter(v => v % 2 === 0);

List(evens).toArray();
// [0, 2, 4, 6, 8]
Set(evens).has(4);
// true

let reads = 0;
const numbers = IterableLinq.fromRange(1000).map(v => { reads++; return v; });

Seq(numbers).take(2).toArray();
// [0, 1]
reads;
// 2
```

The Immutable.js collections are `Iterable` too, so they can be the source of a chain:

```typescript
IterableLinq.from(List([1, 2, 3])).map(v => v * 10).collectToArray();
// [10, 20, 30]
```

## Node.js streams

`Readable.from` of [`node:stream`](https://nodejs.org/api/stream.html#streamreadablefromiterable-options) accepts any `Iterable`, so a chain becomes a readable stream without adapters:

```typescript
import * as IterableLinq from 'iterable-linq-utility';
import { Readable } from 'node:stream';

const evens = IterableLinq.fromRange(10).filter(v => v % 2 === 0);

for await (const v of Readable.from(evens))
	console.log(v);
// 0, 2, 4, 6, 8
```

The stream reads the chain only when its values are consumed, and a loop that stops early stops the chain and closes its source:

```typescript
let reads = 0;
const numbers = IterableLinq.fromRange(1000).map(v => { reads++; return v; });

for await (const v of Readable.from(numbers)) {
	console.log(v);
	if (v === 1)
		break;
}
// 0, 1
reads;
// 2
```

A readable stream is async iterable, not `Iterable`: to go the other way, collect its values first, for example with `toArray`, then pass the array to `IterableLinq.from`:

```typescript
const values = await Readable.from([1, 2, 3]).toArray();
IterableLinq.from(values).map(v => v * 10).collectToArray();
// [10, 20, 30]
```

## Iterator helpers

The [iterator helpers](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Iterator#iterator_helper_methods) (`map`, `filter`, `take`, `toArray`…) are methods of `Iterator.prototype`. The iterator of a chain does not inherit from it, so it has no helper methods: wrap the chain with `Iterator.from` first. Why the library does not build on them: [ADR 0006](https://github.com/Amebus/iterable-linq-utility/blob/main/docs/decisions/0006-position-against-the-native-iterator-helpers.md).

```typescript
import * as IterableLinq from 'iterable-linq-utility';

const evens = IterableLinq.fromRange(10).filter(v => v % 2 === 0);

evens[Symbol.iterator]().map;
// undefined
Iterator.from(evens).map(v => v * 10).take(2).toArray();
// [0, 20]
```

The chain stays lazy: `take` stops it and closes its source.

```typescript
let reads = 0;
const numbers = IterableLinq.fromRange(1000).map(v => { reads++; return v; });

Iterator.from(numbers).take(2).toArray();
// [0, 1]
reads;
// 2
```

An iterator helper is `Iterable`, so it can be the source of a chain, but it is single-use, like a generator object: the chain gives its values on the first run and nothing on the next ones (see [Repeatable Execution Caveats](index.md#repeatable-execution-caveats)). Add [memoize](../api-reference/transformations.md#memoize), or pass an object whose `[Symbol.iterator]` creates the helper on every run:

```typescript
const once = IterableLinq.from([1, 2, 3].values().map(v => v * 10));
once.collectToArray();
// [10, 20, 30]
once.collectToArray();
// []

const cached = IterableLinq.from([1, 2, 3].values().map(v => v * 10)).memoize();
cached.collectToArray();
// [10, 20, 30], and the same on every run

const rerun = IterableLinq.from({ [Symbol.iterator]: () => [1, 2, 3].values().map(v => v * 10) });
rerun.collectToArray();
// [10, 20, 30], and the same on every run
```

## lodash

The array functions of [lodash](https://lodash.com/) (`_.chunk`, `_.uniq`, `_.groupBy`…) work only on arrays and array-like objects.

!!! warning "A chain gives an empty result, without an error"
    A chain is not an array: lodash reads no values from it and returns an empty result, with no error to warn you.

    ```typescript
    import * as IterableLinq from 'iterable-linq-utility';
    import _ from 'lodash';

    const evens = IterableLinq.fromRange(10).filter(v => v % 2 === 0);

    _.chunk(evens, 2);
    // []
    _.uniq(evens);
    // []
    ```

Collect the chain into an array first, with [collectToArray](../api-reference/actions.md#collecttoarray):

```typescript
_.chunk(evens.collectToArray(), 2);
// [[0, 2], [4, 6], [8]]
```

`_.toArray` reads an `Iterable` too: `_.toArray(evens)` gives `[0, 2, 4, 6, 8]`.

The arrays returned by lodash can be the source of a chain:

```typescript
IterableLinq.from(_.range(3)).map(v => v * 10).collectToArray();
// [0, 10, 20]
```

## Composing the raw functions

The raw functions of `Functions` take the iterable first, `Functions.map(iterable, fn)`, while the `pipe` and `flow` helpers of the functional libraries pass one argument to every step. Wrap each step in a function of one argument, or use an adapter of the library. Either way the composition stays lazy: it reads the source only when its result is consumed.

The examples below use:

```typescript
import { Functions } from 'iterable-linq-utility';

const isEven = (v: number) => v % 2 === 0;
const double = (v: number) => v * 2;
```

and every composition gives `[0, 4, 8]`:

=== "lodash"

    ```typescript
    import _ from 'lodash';
    import fp from 'lodash/fp';

    // A wrapper per step
    const evensDoubled = _.flow(
    	(xs: Iterable<number>) => Functions.filter(xs, isEven),
    	xs => Functions.map(xs, double)
    );
    [...evensDoubled(Functions.range(6))];
    // [0, 4, 8]

    // An adapter: partialRight, or curryRight with an explicit arity in lodash/fp
    [..._.flow(_.partialRight(Functions.filter, isEven), _.partialRight(Functions.map, double))(Functions.range(6))];
    // [0, 4, 8]
    [...fp.flow(fp.curryRight(Functions.filter, 2)(isEven), fp.curryRight(Functions.map, 2)(double))(Functions.range(6))];
    // [0, 4, 8]
    ```

=== "Ramda"

    ```typescript
    import * as R from 'ramda';

    // A wrapper per step
    const evensDoubled = R.pipe(
    	(xs: Iterable<number>) => Functions.filter(xs, isEven),
    	xs => Functions.map(xs, double)
    );
    [...evensDoubled(Functions.range(6))];
    // [0, 4, 8]

    // An adapter: partialRight
    [...R.pipe(R.partialRight(Functions.filter, [isEven]), R.partialRight(Functions.map, [double]))(Functions.range(6))];
    // [0, 4, 8]
    ```

=== "Remeda"

    ```typescript
    import { pipe } from 'remeda';

    // A wrapper per step: Remeda has no adapter for a data-first function
    [...pipe(
    	Functions.range(6),
    	xs => Functions.filter(xs, isEven),
    	xs => Functions.map(xs, double)
    )];
    // [0, 4, 8]
    ```

=== "fp-ts"

    ```typescript
    import { pipe } from 'fp-ts/function';

    // A wrapper per step: fp-ts has no adapter for a data-first function
    [...pipe(
    	Functions.range(6),
    	xs => Functions.filter(xs, isEven),
    	xs => Functions.map(xs, double)
    )];
    // [0, 4, 8]
    ```

=== "Effect"

    ```typescript
    import { pipe } from 'effect';
    import { dual } from 'effect/Function';

    // A wrapper per step
    [...pipe(
    	Functions.range(6),
    	xs => Functions.filter(xs, isEven),
    	xs => Functions.map(xs, double)
    )];
    // [0, 4, 8]

    // An adapter: dual, with the arity of the data-first call
    const filter = dual(2, Functions.filter);
    const map = dual(2, Functions.map);
    [...pipe(Functions.range(6), filter(isEven), map(double))];
    // [0, 4, 8]
    ```

!!! note "With TypeScript, prefer the wrapper"
    The wrapper keeps the element type: the compositions above give a `number[]`. The adapters lose it, because the raw functions are generic and overloaded: `_.partialRight` gives an `any[]`, Effect `dual` a `never[]`, and the types of `R.partialRight` and `fp.curryRight` do not accept the raw functions. The adapters are for JavaScript code.

!!! warning "Give the arity explicitly"
    The adapters that read the arity from `function.length`, like `R.flip`, `R.curry` and `_.curry`, are not reliable with the raw functions: an optional or rest parameter is not counted, so `Functions.reduce.length` is `1`.

    ```typescript
    import * as R from 'ramda';

    const sum = (total: number, v: number) => total + v;

    R.flip(Functions.reduce)(sum)([1, 2, 3]);
    // throws: The "sourceIterable" must be provided
    R.curry(Functions.reduce)([1, 2, 3])(sum);
    // throws: The "reducer" function must be provided

    R.curryN(2, Functions.reduce)([1, 2, 3])(sum);
    // 6
    R.partialRight(Functions.reduce, [sum])([1, 2, 3]);
    // 6
    ```

    Give the arity explicitly (`R.curryN`, `fp.curryRight(fn, arity)`, Effect `dual(arity, fn)`), or use `partialRight` or a wrapper.

Raw functions that take the iterable last, which would compose without wrappers, are discussed in [#114](https://github.com/Amebus/iterable-linq-utility/issues/114).
