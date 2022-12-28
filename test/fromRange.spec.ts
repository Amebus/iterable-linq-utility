import { describe, expect, test, vi } from 'vitest';

import * as IterableLinq from '../src';

describe('IterableLinq.fromRange', () => {

  test('checks IterableLinq.fromRange function definition', () => {
    expect(IterableLinq.fromRange).toHaveLength(4);
  });

  test('IterableLinq.fromRange function with one argument', () => {
    
    const fromRangeSpyFunc = vi.fn((start) => IterableLinq.fromRange(start));
    const fromRanged = fromRangeSpyFunc(10);
    expect(fromRangeSpyFunc).toHaveReturned();
    expect(fromRanged[Symbol.iterator]).toBeInstanceOf(Function);

    const fromRangeIterator = fromRanged[Symbol.iterator]();
    expect(fromRangeIterator).toHaveProperty('next');
  });

  test('IterableLinq.fromRange function with two arguments', () => {
    
    const fromRangeSpyFunc = vi.fn((start, end) => IterableLinq.fromRange(start, end));
    let fromRanged = fromRangeSpyFunc(10, 20);
    
    expect(fromRangeSpyFunc).toHaveReturned();
    expect(fromRanged[Symbol.iterator]).toBeInstanceOf(Function);

    let fromRangeIterator = fromRanged[Symbol.iterator]();
    expect(fromRangeIterator).toHaveProperty('next');

    fromRanged = fromRangeSpyFunc(10, true);

    expect(fromRangeSpyFunc).toHaveReturnedTimes(2);
    expect(fromRanged[Symbol.iterator]).toBeInstanceOf(Function);

    fromRangeIterator = fromRanged[Symbol.iterator]();
    expect(fromRangeIterator).toHaveProperty('next');
  });

  test('IterableLinq.fromRange function with three arguments', () => {
    
    const fromRangeSpyFunc = vi.fn((start, end, step) => IterableLinq.fromRange(start, end, step));
    let fromRanged = fromRangeSpyFunc(10, 20, 2);
    
    expect(fromRangeSpyFunc).toHaveReturned();
    expect(fromRanged[Symbol.iterator]).toBeInstanceOf(Function);

    let fromRangeIterator = fromRanged[Symbol.iterator]();
    expect(fromRangeIterator).toHaveProperty('next');

    fromRanged = fromRangeSpyFunc(10, 20, true);

    expect(fromRangeSpyFunc).toHaveReturnedTimes(2);
    expect(fromRanged[Symbol.iterator]).toBeInstanceOf(Function);

    fromRangeIterator = fromRanged[Symbol.iterator]();
    expect(fromRangeIterator).toHaveProperty('next');
  });

  test('IterableLinq.fromRange function with four arguments', () => {
    
    const fromRangeSpyFunc = vi.fn((start, end, step, reverse) => IterableLinq.fromRange(start, end, step, reverse));
    let fromRanged = fromRangeSpyFunc(10, 20, 2, false);
    
    expect(fromRangeSpyFunc).toHaveReturned();
    expect(fromRanged[Symbol.iterator]).toBeInstanceOf(Function);
  
    let fromRangeIterator = fromRanged[Symbol.iterator]();
    expect(fromRangeIterator).toHaveProperty('next');

    fromRanged = fromRangeSpyFunc(10, 20, 2, true);

    expect(fromRangeSpyFunc).toHaveReturnedTimes(2);
    expect(fromRanged[Symbol.iterator]).toBeInstanceOf(Function);
  
    fromRangeIterator = fromRanged[Symbol.iterator]();
    expect(fromRangeIterator).toHaveProperty('next');
  });

  test.each([
    { end: 0, length: 0, generatedRange: [] },
    { end: 10, length: 10, generatedRange: [0,1,2,3,4,5,6,7,8,9] },
    { end: -10, length: 10, generatedRange: [0,-1,-2,-3,-4,-5,-6,-7,-8,-9] },
    { end: 15, length: 15, generatedRange: [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14] },
    { end: -15, length: 15, generatedRange: [0,-1,-2,-3,-4,-5,-6,-7,-8,-9,-10,-11,-12,-13,-14] },
  ])('create IterableLinq.fromRange(end: $end)', ({ end, length, generatedRange }) => {
    const fromRanged = IterableLinq.fromRange(end);
    const iterated = [...fromRanged];
    expect(iterated).toHaveLength(length);
    expect(iterated).toEqual(generatedRange);
  });

  test.each([
    { end: 0, reverse: false, length: 0, generatedRange: [] },
    { end: 0, reverse: true, length: 0, generatedRange: [] },

    { end: 10, reverse: false, length: 10, generatedRange: [0,1,2,3,4,5,6,7,8,9] },
    { end: 10, reverse: true, length: 10, generatedRange: [9,8,7,6,5,4,3,2,1,0] },
    { end: -10, reverse: false, length: 10, generatedRange: [0,-1,-2,-3,-4,-5,-6,-7,-8,-9] },
    { end: -10, reverse: true, length: 10, generatedRange: [-9,-8,-7,-6,-5,-4,-3,-2,-1,0] },

    { end: 15, reverse: false, length: 15, generatedRange: [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14] },
    { end: 15, reverse: true, length: 15, generatedRange: [14,13,12,11,10,9,8,7,6,5,4,3,2,1,0] },
    { end: -15, reverse: false, length: 15, generatedRange: [0,-1,-2,-3,-4,-5,-6,-7,-8,-9,-10,-11,-12,-13,-14] },
    { end: -15, reverse: true, length: 15, generatedRange: [-14,-13,-12,-11,-10,-9,-8,-7,-6,-5,-4,-3,-2,-1,0] }
  ])('create IterableLinq.fromRange(end: $end, reverse: $reverse)', ({ end, reverse, length, generatedRange }) => {
    const fromRanged = IterableLinq.fromRange(end, reverse);
    const iterated = [...fromRanged];
    expect(iterated).toHaveLength(length);
    expect(iterated).toEqual(generatedRange);
  });

  test.each([
    { start: 0, end: 0, length: 0, generatedRange: [] },

    { start: 5, end: 10, length: 5, generatedRange: [5,6,7,8,9] },
    { start: -5, end: 10, length: 15, generatedRange: [-5,-4,-3,-2,-1,0,1,2,3,4,5,6,7,8,9] },
    { start: -15, end: -10, length: 5, generatedRange: [-15,-14,-13,-12,-11] },

    { start: 10, end: 5, length: 5, generatedRange: [10,9,8,7,6] },
    { start: 5, end: -10, length: 15, generatedRange: [5,4,3,2,1,0,-1,-2,-3,-4,-5,-6,-7,-8,-9] },
    { start: -5, end: -10, length: 5, generatedRange: [-5,-6,-7,-8,-9] },
  ])('create IterableLinq.fromRange(start: $start, end: $end)', ({ start, end, length, generatedRange }) => {
    const fromRanged = IterableLinq.fromRange(start, end);
    const iterated = [...fromRanged];
    expect(iterated).toHaveLength(length);
    expect(iterated).toEqual(generatedRange);
  });

  test.each([
    { start: 0, end: 0, reverse: false, length: 0, generatedRange: [] },
    { start: 0, end: 0, reverse: true, length: 0, generatedRange: [] },

    { start: 5, end: 10, reverse: false, length: 5, generatedRange: [5,6,7,8,9] },
    { start: 5, end: 10, reverse: true, length: 5, generatedRange: [9,8,7,6,5] },
    { start: -5, end: 3, reverse: false, length: 8, generatedRange: [-5,-4,-3,-2,-1,0,1,2] },
    { start: -5, end: 3, reverse: true, length: 8, generatedRange: [2,1,0,-1,-2,-3,-4,-5] },
    { start: -6, end: -1, reverse: false, length: 5, generatedRange: [-6,-5,-4,-3,-2] },
    { start: -6, end: -1, reverse: true, length: 5, generatedRange: [-2,-3,-4,-5,-6] },

    { start: 10, end: 0, reverse: false, length: 10, generatedRange: [10,9,8,7,6,5,4,3,2,1] },
    { start: 10, end: 0, reverse: true, length: 10, generatedRange: [1,2,3,4,5,6,7,8,9,10] },
    { start: 5, end: -10, reverse: false, length: 15, generatedRange: [5,4,3,2,1,0,-1,-2,-3,-4,-5,-6,-7,-8,-9] },
    { start: 5, end: -10, reverse: true, length: 15, generatedRange: [-9,-8,-7,-6,-5,-4,-3,-2,-1,0,1,2,3,4,5] },
    { start: -5, end: -10, reverse: false, length: 5, generatedRange: [-5,-6,-7,-8,-9] },
    { start: -5, end: -10, reverse: true, length: 5, generatedRange: [-9,-8,-7,-6,-5,] },
  ])('create IterableLinq.fromRange(start: $start, end: $end, reverse: $reverse)', ({ start, end, reverse, length, generatedRange }) => {
    const fromRanged = IterableLinq.fromRange(start, end, reverse);
    const iterated = [...fromRanged];
    expect(iterated).toHaveLength(length);
    expect(iterated).toEqual(generatedRange);
  });

  test.each([
    { start: 0, end: 0, step: 2, length: 0, generatedRange: [] },

    { start: 5, end: 10, step: 2, length: 3, generatedRange: [5,7,9] },
    { start: 5, end: 10, step: -2, length: 3, generatedRange: [5,7,9] },
    { start: -5, end: 3, step: 2, length: 4, generatedRange: [-5,-3,-1,1] },
    { start: -5, end: 3, step: -2, length: 4, generatedRange: [-5,-3,-1,1] },
    { start: -6, end: -1, step: 2, length: 3, generatedRange: [-6,-4,-2] },
    { start: -6, end: -1, step: -2, length: 3, generatedRange: [-6,-4,-2] },

    { start: 10, end: 0, step: 2, length: 5, generatedRange: [10,8,6,4,2] },
    { start: 10, end: 0, step: -2, length: 5, generatedRange: [10,8,6,4,2] },
    { start: 5, end: -10, step: 2, length: 8, generatedRange: [5,3,1,-1,-3,-5,-7,-9] },
    { start: 5, end: -10, step: -2, length: 8, generatedRange: [5,3,1,-1,-3,-5,-7,-9] },
    { start: -5, end: -10, step: 2, length: 3, generatedRange: [-5,-7,-9] },
    { start: -5, end: -10, step: -2, length: 3, generatedRange: [-5,-7,-9] },
  ])('create IterableLinq.fromRange(start: $start, end: $end, step: $step)', ({ start, end, step, length, generatedRange }) => {
    const fromRanged = IterableLinq.fromRange(start, end, step);
    const iterated = [...fromRanged];
    expect(iterated).toHaveLength(length);
    expect(iterated).toEqual(generatedRange);
  });

  test.each([
    { start: 0, end: 0, step: 2, reverse: false, length: 0, generatedRange: [] },
    { start: 0, end: 0, step: 2, reverse: true, length: 0, generatedRange: [] },

    { start: 5, end: 10, step: 2, reverse: false, length: 3, generatedRange: [5,7,9] },
    { start: 5, end: 10, step: 2, reverse: true, length: 3, generatedRange: [9,7,5] },
    { start: 5, end: 10, step: -2, reverse: false, length: 3, generatedRange: [5,7,9] },
    { start: 5, end: 10, step: -2, reverse: true, length: 3, generatedRange: [9,7,5] },
    { start: -5, end: 3, step: 2, reverse: false, length: 4, generatedRange: [-5,-3,-1,1] },
    { start: -5, end: 3, step: 2, reverse: true, length: 4, generatedRange: [1,-1,-3,-5] },
    { start: -5, end: 3, step: -2, reverse: false, length: 4, generatedRange: [-5,-3,-1,1] },
    { start: -5, end: 3, step: -2, reverse: true, length: 4, generatedRange: [1,-1,-3,-5] },
    { start: -6, end: -1, step: 2, reverse: false, length: 3, generatedRange: [-6,-4,-2] },
    { start: -6, end: -1, step: 2, reverse: true, length: 3, generatedRange: [-2,-4,-6] },
    { start: -6, end: -1, step: -2, reverse: false, length: 3, generatedRange: [-6,-4,-2] },
    { start: -6, end: -1, step: -2, reverse: true, length: 3, generatedRange: [-2,-4,-6] },

    { start: 10, end: 0, step: 2, reverse: false, length: 5, generatedRange: [10,8,6,4,2] },
    { start: 10, end: 0, step: 2, reverse: true, length: 5, generatedRange: [2,4,6,8,10] },
    { start: 10, end: 0, step: -2, reverse: false, length: 5, generatedRange: [10,8,6,4,2] },
    { start: 10, end: 0, step: -2, reverse: true, length: 5, generatedRange: [2,4,6,8,10] },
    { start: 5, end: -10, step: 2, reverse: false, length: 8, generatedRange: [5,3,1,-1,-3,-5,-7,-9] },
    { start: 5, end: -10, step: 2, reverse: true, length: 8, generatedRange: [-9,-7,-5,-3,-1,1,3,5] },
    { start: 5, end: -10, step: -2, reverse: false, length: 8, generatedRange: [5,3,1,-1,-3,-5,-7,-9] },
    { start: 5, end: -10, step: -2, reverse: true, length: 8, generatedRange: [-9,-7,-5,-3,-1,1,3,5] },
    { start: -5, end: -10, step: 2, reverse: false, length: 3, generatedRange: [-5,-7,-9] },
    { start: -5, end: -10, step: 2, reverse: true, length: 3, generatedRange: [-9,-7,-5] },
    { start: -5, end: -10, step: -2, reverse: false, length: 3, generatedRange: [-5,-7,-9] },
    { start: -5, end: -10, step: -2, reverse: true, length: 3, generatedRange: [-9,-7,-5] },
  ])('create IterableLinq.fromRange(start: $start, end: $end, step: $step, reverse: $reverse)', ({ start, end, step, reverse, length, generatedRange }) => {
    const fromRanged = IterableLinq.fromRange(start, end, step, reverse);
    const iterated = [...fromRanged];
    expect(iterated).toHaveLength(length);
    expect(iterated).toEqual(generatedRange);
  });

});
