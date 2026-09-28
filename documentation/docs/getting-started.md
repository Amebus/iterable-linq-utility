# Getting Started

## Installation

### Npm

```cmd
npm install iterable-linq-utility
```

### Yarn

```cmd
yarn add iterable-linq-utility
```

### Pnpm

```cmd
pnpm i iterable-linq-utility
```

### CDN

=== "ES module"

    ```html
    <script type="module">
        import * as IterableLinq from 'https://cdn.jsdelivr.net/npm/iterable-linq-utility/+esm';

        console.log(IterableLinq.fromRange(3).collectToArray()); // [0, 1, 2]
    </script>
    ```

=== "Classic script"

    The UMD build defines the global `IterableLinq`:

    ```html
    <script src="https://cdn.jsdelivr.net/npm/iterable-linq-utility"></script>
    <script>
        console.log(IterableLinq.fromRange(3).collectToArray()); // [0, 1, 2]
    </script>
    ```

## Usage

=== "TypeScript"

    ```ts
    // recommended
    import * as IterableLinq from 'iterable-linq-utility';

    IterableLinq.from([1, 2, 3, 4]).map(v => v * 10).collectToArray(); // [10, 20, 30, 40]

    // or

    import { from } from 'iterable-linq-utility';

    from([1, 2, 3, 4]).map(v => v * 10).collectToArray(); // [10, 20, 30, 40]
    ```

=== "JavaScript (ES modules)"

    ```js
    import * as IterableLinq from 'iterable-linq-utility';

    IterableLinq.from([1, 2, 3, 4]).map(v => v * 10).collectToArray(); // [10, 20, 30, 40]
    ```

=== "JavaScript (CommonJS)"

    ```js
    const IterableLinq = require('iterable-linq-utility');

    IterableLinq.from([1, 2, 3, 4]).map(v => v * 10).collectToArray(); // [10, 20, 30, 40]
    ```

The library works with TypeScript `moduleResolution` set to `node10`, `node16`/`nodenext` (both ESM and CommonJS) and `bundler`.

## Where to go from here


1. Be sure to check the [Basic Concepts](basic-concepts.md)
2. Go to [Advanced Concepts](advanced-concepts/index.md) for advanced usage scenarios, including how to [extend the API](advanced-concepts/extending.md)
3. Check the [Glossary](glossary.md) for the meaning of the most important words used by this documentation
4. Check how you can [integrate the utility with other libraries](advanced-concepts/interoperability-with-other-libraries.md)
5. Upgrading from 0.0.x? Read the [migration guide](migrating-to-0.1.0.md)
6. Compare this library with other [similar libraries](alternative-projects.md)