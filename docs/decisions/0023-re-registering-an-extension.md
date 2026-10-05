# Re-registering an extension

* Status: accepted
* Deciders: Amebus
* Date: 2026-10-05

Technical Story: https://github.com/Amebus/iterable-linq-utility/issues/81

Amends: [ADR 0003](0003-extension-api-instead-of-public-wrapper-class.md)

## Context and Problem Statement

[ADR 0003](0003-extension-api-instead-of-public-wrapper-class.md) makes `extend` reject every name that already exists, extensions included: "registering the same name twice throws, so extensions must be registered once, at start-up".

The module that registers an extension can run more than once in the same process: hot module replacement reruns it after every edit, and a test runner that resets its modules imports it again. The second run throws, and `override` is no way out, because on the first run the name does not exist yet. The only workaround is `try { extend(…) } catch { override(…) }`.

What should `extend` do with a name that an earlier `extend` added?

## Decision Drivers

* A module that registers extensions can run again without errors
* A reload uses the edited implementation
* A library method is still never replaced by mistake

## Considered Options

* Throw, as today
* Ignore the second registration, keeping the first implementation
* Replace the implementation registered by the earlier `extend`

## Decision Outcome

Chosen option: "Replace the implementation registered by the earlier `extend`". The library records the names added by `extend`. A later `extend` of one of them replaces its implementation on every chain; a library method, a member of `Object.prototype` and a name used by the chain instances still throw. `override` does not change: it replaces library methods and extensions, and an extension replaced by `override` can still be registered again with `extend`.

### Positive Consequences

* Hot module replacement and test runners that re-import modules work without workarounds
* After an edit, the chains use the new implementation, the ones created before the reload included
* Library methods keep the protection of ADR 0003: replacing them still needs `override`

### Negative Consequences

* Two packages that extend the same name overwrite each other without an error: the last one registered wins. The documentation says it, and suggests prefixing the names of published extensions
* The library keeps a set of the names added by `extend`, for the whole process

## Pros and Cons of the Options

### Throw, as today

* Good, because a name clash between two packages is reported
* Bad, because a module that runs twice throws, with no clean workaround

### Ignore the second registration

* Good, because a module that runs twice does not throw
* Bad, because a reload keeps the old implementation, which defeats hot module replacement
* Bad, because a name clash between two packages is hidden too

### Replace the implementation

* Good, because a module that runs twice does not throw and a reload uses the edited code
* Bad, because a name clash between two packages is hidden
