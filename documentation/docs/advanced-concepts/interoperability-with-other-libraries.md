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
