type ComparerFunction<T> = (a: T, b: T, index: number) => number;
type ComparingProps<T> = keyof T | Array<keyof T>;

export type Comparer<T> = ComparerFunction<T> | ComparingProps<T>;