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

#### JsDelivr

```html
<!-- TODO: check that it works -->
<script src="https://cdn.jsdelivr.net/npm/iterable-linq-utility"></script>
```


#### Unpkg

```html
<!-- TODO: check that it works -->
<script src="https://unpkg.com/ag-grid-community/dist/interable-linq-utility.js"></script>
```

## Usage

=== "Typescript"

    ```ts
    // recommended
    import * as IterableLinq from 'iterable-linq-utility'

    IterableLinq.from([1,2,3,4]).map(v => v * 10).collectToArray();

    // or

    import { from } from 'iterable-linq-utility';

    from([1,2,3,4]).map(v => v * 10).collectToArray();

    ```

=== "Javascript"

    TODO



## Where to go from here


1. Be sure to check the [Basic Concepts](basic-concepts.md)
2. Go to [Advanced Concepts](advanced-concepts/index.md) to check about advanced usage scenarios and features provided by the utility
3. Check the [Glossary](glossary.md) to get more indepth about the utility and meanings of the most important words used by this documentation
4. Check how you can [integrate the utility with other libraries](advanced-concepts/interoperability-with-other-libraries.md)
5. Compare this library with other [similar libraries](alternative-projects.md)