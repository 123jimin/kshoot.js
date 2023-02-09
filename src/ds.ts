export interface SortedContainer<V> extends Iterable<V extends [infer K, ...infer M] ? V : V> {
    get length(): number;
    at(index: number): V|undefined;
}

const z = (v: [bigint, string][]): SortedContainer<[bigint, string]> => {
    return v;
}