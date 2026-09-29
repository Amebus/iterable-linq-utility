# Documentation site

Operations are documented in `documentation/docs/api-reference/`: `transformations.md`, `actions.md` or `taps.md`.

## TLDR row

Add a row, in alphabetical order, to the table in the `???+ summary` admonition at the top of the page. The icons are explained above the table:

```markdown
    | [map](#map)                                  | Transforms each value                                                            | :material-moon-full:                        | :material-format-text-wrapping-wrap: :material-raw: |
```

## Section

A `## <name>` section, in alphabetical order, with one tab for the chain and one for the raw function. The examples are the ones of the JSDoc.

````markdown
## map

Transforms each value. The mapper is called with each value and its index.

=== "Wrapper"

    ```typescript
    import * as IterableLinq from 'iterable-linq-utility';

    IterableLinq
        .from([1, 2, 3, 4])
        .map(v => v * 10)
        .collectToArray();
    // [10, 20, 30, 40]
    ```
=== "Raw Function"

    ```typescript
    import { Functions } from 'iterable-linq-utility';

    Array.from(Functions.map([1, 2, 3, 4], v => v * 10));
    // [10, 20, 30, 40]
    ```

Throws an `Error` if the mapper is not a function.
````

Pushed to `main`, the page appears in the `next` version of the site; it reaches `latest` at the next release (ADR 0013).
