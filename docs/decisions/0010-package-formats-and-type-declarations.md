# Package formats and type declarations

* Status: accepted
* Deciders: Amebus
* Date: 2026-09-28

Technical Story: https://github.com/Amebus/iterable-linq-utility/pull/21

## Context and Problem Statement

The package is used from ES modules, from CommonJS, and from a classic `<script>` tag through a CDN. Before 0.1.0:

* the UMD global was named `interable-linq-utility`, which is misspelt and not a valid identifier, so a script tag could not use it;
* the emitted `.d.ts` files used relative imports without extensions, which TypeScript cannot resolve under `moduleResolution: node16`/`nodenext`;
* the `require` condition served ESM types to the CommonJS bundle. arethetypeswrong reported "Internal resolution error" and "Masquerading as ESM".

Which formats should the package ship, and how should its types be declared?

## Decision Drivers

* Works with `import`, `require` and a script tag, with no configuration
* Types resolve under every TypeScript module resolution, including `node16`/`nodenext`
* A broken package is caught by the CI, before publishing

## Considered Options

* A: ESM only
* B: ESM + UMD, with one declaration file per source file
* C: ESM + UMD, with one bundled declaration file per module format, checked in CI

## Decision Outcome

Chosen option: "C: ESM + UMD, with one bundled declaration file per module format, checked in CI".

* Vite builds `dist/iterable-linq-utility.js` (ESM) and `dist/iterable-linq-utility.umd.cjs` (UMD, also used by `require`). The UMD global is `IterableLinq`.
* `vite-plugin-dts` bundles every declaration into `dist/index.d.ts` (`bundleTypes`). The build copies it to `dist/index.d.cts`.
* `exports` declares the types per condition: `import` gets `index.d.ts`, `require` gets `index.d.cts`.
* `pnpm check:package` runs arethetypeswrong (`attw --pack .`) on the packed tarball, and the CI runs it after the build.

### Positive Consequences

* One package works in every module system and in the browser
* Internal file names do not leak into the published types
* A resolution problem fails the CI instead of reaching users

### Negative Consequences

* The same declarations are published twice (`.d.ts` and `.d.cts`)
* Bundling the declarations adds `@microsoft/api-extractor` to the build
* Internal types reachable from the public ones are published too (for example `IIterableLinqBase`)

## Pros and Cons of the Options

### A: ESM only

* Good, because it is the simplest build
* Bad, because CommonJS users and script tags are left out

### B: one declaration file per source file

* Good, because it is the default of the TypeScript compiler
* Bad, because the extensionless relative imports fail under `node16`/`nodenext`
* Bad, because CommonJS consumers get ESM types

### C: bundled declarations per format, checked in CI

* Good, because it resolves in every mode and the CI proves it
* Bad, because the build has more steps
