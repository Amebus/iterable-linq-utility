import { Unit } from "./unit";

export type Action<T> = (value: T, index: number) => Unit;
export type AsyncAction<T> = (value: T, index: number) => Promise<Unit>;