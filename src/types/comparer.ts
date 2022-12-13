type ComparerFunction<T> = (a: T, b: T) => number;
type ComparingProps<T> = keyof T | Array<keyof T>;

export type Comparer<T> = ComparerFunction<T> | ComparingProps<T>;