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
