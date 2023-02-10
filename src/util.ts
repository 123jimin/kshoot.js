export type First<T> = T extends [infer Car, ...unknown[]] ? Car : never;
export type Rest<T> = T extends [unknown, ...infer Cdr] ? Cdr : never;
export type AsTuple<T> = [First<T>, ...Rest<T>];

export function isIterable(x: unknown): x is Iterable<unknown> {
    if(x == null || (typeof x !== 'object')) return false;
    if(!(Symbol.iterator in x)) return false;
    return typeof x[Symbol.iterator] === 'function';
}