# Extending the API

Every chain created by `from`, `fromRange`, `repeat` and `empty` is an `IIterableLinq`. The class behind it is internal: use the functions below to recognise chains and to add or replace operations.

## Recognising a chain

```typescript
import { from, isIterableLinq } from 'iterable-linq-utility';

isIterableLinq(from([1, 2, 3])); // true
isIterableLinq([1, 2, 3]);       // false
```

`isIterableLinq` checks a brand stored in the global symbol registry (`Symbol.for`), not `instanceof`, so it also works when two copies of the library are installed.

It is a brand check, not a validation: any object can carry the same `Symbol.for` key, so do not use `isIterableLinq` to decide whether untrusted input is safe to call.

## Adding an operation

Adding an operation takes two steps:

1. Declare it by augmenting the `IIterableLinq` interface. Declare it on `IIterableLinq`, not on `IIterableLinqBase`, which holds the library's own operations.
2. Register it once, at application start-up, with `extend`.

```typescript
import { extend, from, type IIterableLinq } from 'iterable-linq-utility';

declare module 'iterable-linq-utility' {
    interface IIterableLinq<T> {
        chunk(size: number): IIterableLinq<T[]>;
    }
}

extend('chunk', function (size: number) {
    const source = this;
    return from({
        *[Symbol.iterator]() {
            let chunk: unknown[] = [];
            for (const value of source) {
                chunk.push(value);
                if (chunk.length === size) {
                    yield chunk;
                    chunk = [];
                }
            }
            if (chunk.length > 0)
                yield chunk;
        }
    });
});

from([1, 2, 3, 4, 5]).chunk(2).collectToArray(); // [[1, 2], [3, 4], [5]]
```

The method is available on every chain, including chains created before the call to `extend`.

`extend` throws if:

- the name already exists: a library operation (`map`, `filter`, …), an operation you added before, or a member of `Object.prototype` (`toString`, `hasOwnProperty`, …);
- the name is empty;
- the implementation is not a function.

## Replacing an operation

`override` replaces an operation that already exists: a library operation or one added with `extend`.

```typescript
import { from, override } from 'iterable-linq-utility';

// a later release of the library added its own `chunk`: keep your version
override('chunk', function (size: number) { /* your implementation */ });
```

The main use of `override` is upgrading the library. If a new release adds an operation with the same name as one of your extensions, your `extend` call throws at start-up. Switch that call to `override`, or rename your operation. In the first case, keep the library's signature in your `declare module` block, because the two declarations merge into overloads of the same method.

Overriding changes only the fluent operation. The raw functions in `Functions` (for example `Functions.map`) and the library internals keep the original behaviour, so you can still call the original implementation through `Functions`.

`override` throws if:

- the name is not an operation of the chain: use `extend` to add it. This also applies to `constructor` and the members of `Object.prototype`;
- the name is empty;
- the implementation is not a function.

## Rules and limits

- **Register once, at start-up.** Registering the same name twice with `extend` throws. This includes modules that run twice, for example with hot module replacement or test runners that re-import modules.
- **Extensions are global.** Every chain in the process gets them, and an `override` lasts for the whole process.
- **`this` has no element type.** Inside the implementation `this` is `IIterableLinq<unknown>`. Callers still get full typing from your `declare module` block (in the example, `from([1, 2]).chunk(2)` is `IIterableLinq<number[]>`).
- **The compiler does not match the implementation with the declaration.** Keeping the implementation consistent with the declared signature is up to you.
- **Only string names.** `extend` and `override` accept string names only; symbols (for example `Symbol.iterator`) are rejected by the compiler.
- **Assignment.** Operations added with `extend` cannot be replaced by a plain assignment: use `override`. The library's own operations keep their original behaviour here too: `override` never changes whether an operation can be reassigned.
