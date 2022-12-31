import { Unit } from "./unit";

export type Tapper<T> = (value: T, index: number) => Unit;