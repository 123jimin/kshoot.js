export type First<T> = T extends [infer Car, ...unknown[]] ? Car : never;
export type Rest<T> = T extends [unknown, ...infer Cdr] ? Cdr : never;
export type AsTuple<T> = [First<T>, ...Rest<T>];

export type JSONValue = string | number | boolean | JSONObject | JSONArray;
export interface JSONObject {[key: string]: JSONValue}
export type JSONArray = JSONValue[];

export function isIterable(x: unknown): x is Iterable<unknown> {
    if(x == null || (typeof x !== 'object')) return false;
    if(!(Symbol.iterator in x)) return false;
    return typeof x[Symbol.iterator] === 'function';
}

export function* iterateAll<V extends AsTuple<V>>(...lists: (Iterable<V>|Iterator<V>)[]): Generator<[First<V>, [number, ...Rest<V>][]]> {
    let iterators: [number, Iterator<AsTuple<V>>|null][] = [];

    // Using a heap would have been faster theoretically, but in practice lists.length is small.
    const curr_objects: ([First<V>, [number, ...Rest<V>]]|null)[] = [];

    for(let i=0; i<lists.length; ++i) {
        const list = lists[i];
        const iterator = isIterable(list) ? list[Symbol.iterator]() : list;
        iterators.push([i, iterator]);
        curr_objects.push(null);
    }

    while(iterators.length > 0) {
        let one_ended = false;

        for(const iterator_pair of iterators) {
            const [ind, iterator] = iterator_pair;
            if(curr_objects[ind]) continue;
            if(iterator == null) continue; // (never hit)

            const nxt = iterator.next();
            if(nxt.done) {
                iterator_pair[1] = null;
                one_ended = true;
                continue;
            }

            const [first, ...rest] = nxt.value;
            curr_objects[ind] = [first, [ind, ...rest]];
        }
        
        let min_key: First<V>|null = null;
        let min_values: [number, ...Rest<V>][] = [];

        for(const obj of curr_objects) {
            if(obj == null) continue;
            const obj_key: First<V> = obj[0];

            if(min_key != null && min_key < obj_key) continue;

            if(min_key == null || obj_key < min_key) {
                min_key = obj_key;
                min_values = [obj[1]];
            } else {
                min_values.push(obj[1]);
            }
        }

        for(const [ind] of min_values) curr_objects[ind] = null;

        if(min_key != null) yield [min_key, min_values];

        if(one_ended) iterators = iterators.filter(([_, it]) => it != null)
    }
}

export function min<T>(...values: T[]): T|undefined {
    if(values.length === 0) return void 0;

    let curr_min = values[0];
    for(let i=1; i<values.length; ++i) {
        if(values[i] < curr_min) curr_min = values[i];
    }

    return curr_min;
}

export function max<T>(...values: T[]): T|undefined {
    if(values.length === 0) return void 0;

    let curr_max = values[0];
    for(let i=1; i<values.length; ++i) {
        if(curr_max < values[i]) curr_max = values[i];
    }

    return curr_max;
}

export function camelToSnake(s: string): string {
    return s.replace(/[A-Z]/g, (ch: string, offset: number) => (offset === 0 ? '' : '_') + ch.toLowerCase());
}