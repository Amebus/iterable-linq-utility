import { Mapper } from "../types";

export function combineMappers<T,R,RR>(m1: Mapper<T, R>, m2: Mapper<R, RR>): Mapper<T, RR> {
	return (value: T, index: number) => {
		return m2(m1(value, index), index);
	};
}
