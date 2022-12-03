export function combineMappers<T,R,RR>(m1: (value: T, index: number) => R, m2: (value: R, index: number) => RR): (value: T, index: number) => RR {
	return (value: T, index: number) => {
		return m2(m1(value, index), index);
	};
}

export function combinePredicates<T>(m1: (value: T, index: number) => boolean, m2: (value: T, index: number) => boolean): (value: T, index: number) => boolean {
	return (value: T, index: number) => {
		return m2(value, index) && m1(value, index);
	};
}
