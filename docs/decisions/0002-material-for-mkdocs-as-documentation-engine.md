# Material for MkDocs as documentation engine

* Status: accepted
* Deciders: Amebus
* Date: 2023-03-11

Technical Story: https://github.com/Amebus/iterable-linq-utility/issues/2

## Context and Problem Statement

The library needs user documentation: the idea behind the project, the concepts (deferred and re-runnable chains, actions and transformations) and every operation with examples. Where should it live, and with which tool should it be built?

## Decision Drivers

* The documentation lives in the repository and is reviewed in the same pull requests as the code it describes
* It is published automatically from the CI
* It supports search, admonitions and tabbed examples (the chain and the raw function side by side)
* It is written in Markdown, with no custom site code to maintain

## Considered Options

* GitHub Wiki
* Material for MkDocs
* TypeDoc (API reference generated from the JSDoc)

## Decision Outcome

Chosen option: "Material for MkDocs", because it is the only option that keeps the documentation in the repository, reviewed with the code, and supports tabbed examples and search out of the box.

The site is in `documentation/`. The `publish_doc.yml` workflow deploys it to GitHub Pages with [mike](https://github.com/jimporter/mike), one version per minor release. The JSDoc stays the reference inside the editor; the site explains concepts and gives examples.

### Positive Consequences

* A change to an operation and its documentation are reviewed together
* Tabs show the chain and the raw function example for each operation
* Built-in search, dark theme and navigation, with no custom code

### Negative Consequences

* A Python toolchain is needed next to Node. Its versions are pinned in `documentation/requirements.txt`, so a new major version (MkDocs 2.0 removes the plugin system that Material depends on) cannot break the deploy
* The API reference is written by hand, so it can drift from the JSDoc
* mike keeps one version per minor release (`0.1`, `0.2`, …) and a patch release replaces the documentation of its minor. The `latest` alias is the default version, and the site published before mike is archived as `0.0` (https://github.com/Amebus/iterable-linq-utility/issues/20)

## Pros and Cons of the Options

### GitHub Wiki

* Good, because it needs no toolchain and no deploy
* Bad, because it lives in a separate repository, outside pull requests
* Bad, because it has no tabs, limited search and no theme

### Material for MkDocs

* Good, because the Markdown lives next to the code
* Good, because it has search, tabs, admonitions and a theme out of the box
* Good, because the CI can build and deploy it to GitHub Pages
* Bad, because it adds a Python toolchain

### TypeDoc

* Good, because the API reference is generated from the JSDoc and cannot drift
* Bad, because it documents signatures, not concepts: the guides would still need another tool
* Bad, because its output is organised by module and type, not by operation kind (actions, transformations, taps)
