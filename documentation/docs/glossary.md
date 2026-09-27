# Glossary

## Action

An operation that runs the **O~s~C** and returns a result that is not a chain, for example an array, a number or a boolean. [materialize](api-reference/actions.md#materialize) is the only action that returns a chain. See [Actions](api-reference/actions.md).

## Deferred Execution

The operations of a chain run when an [Action](#action) asks for the values, not when the chain is built. Building a chain only describes the work to do.

## Eager Evaluation

An operation that reads more of its source than the consumer has asked for. For example, [memoize](api-reference/transformations.md#memoize) with `allowPartialMemoization: false` reads the whole source on the first read. The opposite of [Lazy Evaluation](#lazy-evaluation).

## Fully Deferred Execution

[Deferred Execution](#deferred-execution) in which nothing runs before an action: no callback, no read of the source. All the [Transformations](#transformation) have fully deferred execution.

## Immediate Evaluation

An operation that runs as soon as it is called. [Actions](#action) and [tapChainCreation](api-reference/taps.md#tapchaincreation) have immediate evaluation.

## Lazy Evaluation

An operation that reads its source one value at a time, only as far as the consumer needs. For example, `some` stops at the first match, so the chain before it reads only the values up to that match.

## Operations Chain

The list of data manipulation operations built over an `Iterable` with the fluent API, for example `from(values).filter(…).map(…)`. It is an `IIterableLinq`.

## O~s~C

The acronym for [Operations Chain](#operations-chain).

## Partially Deferred Execution

[Deferred Execution](#deferred-execution) in which part of the work runs when the operation is called. For example, [tapChainCreation](api-reference/taps.md#tapchaincreation) calls its callback immediately, while the chain itself still runs only when an action asks for the values.

## Repeatable Execution

A chain can run many times: every [Action](#action) runs it again, from the source. The source must support being iterated more than once. For sources that cannot, such as generator objects, use [memoize](api-reference/transformations.md#memoize).

## Tap

An operation that observes the **O~s~C** without changing its values, for example to log them. See [Taps](api-reference/taps.md).

## Transformation

An operation that adds a step to the **O~s~C** and returns a new chain, without running anything. See [Transformations](api-reference/transformations.md).
