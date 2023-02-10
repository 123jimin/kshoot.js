export function isIterable(x: unknown): x is Iterable<unknown> {
    if(x == null || (typeof x !== 'object')) return false;
    if(!(Symbol.iterator in x)) return false;
    return typeof x[Symbol.iterator] === 'function';
}