import {default as BTree_} from 'sorted-btree';
const BTree = (BTree_ as unknown as {default: typeof BTree_}).default;

import type {ISortedMap} from 'sorted-btree';

import type {First, Rest, AsTuple} from "./util.js";

export interface ISortedList<V extends AsTuple<V>> extends Exclude<ISortedMap<First<V>, Rest<V>>, typeof Symbol.iterator>, Iterable<AsTuple<V>> {
    put(elem: AsTuple<V>): unknown;
    [Symbol.iterator](): Iterator<AsTuple<V>>;
}

export class SortedList<V extends AsTuple<V>> extends BTree<First<V>, Rest<V>> implements ISortedList<V> {
    constructor(items?: Iterable<AsTuple<V>>) {
        super(Array.isArray(items) ? items.map(([key, ...value]: AsTuple<V>): [First<V>, Rest<V>] => [key, value]) : []);
        if(!items || Array.isArray(items)) return;

        for(const item of items) {
            this.put(item);
        }
    }
    put([key, ...value]: AsTuple<V>) {
        return this.set(key, value);
    }
    *[Symbol.iterator](): Iterator<AsTuple<V>> {
        for(const [key, value] of this.entries()) {
            yield [key, ...value];
        }
    }
}

export function* iterateAll<V extends AsTuple<V>>(...lists: ISortedList<V>[]): Iterator<[First<V>, [number, ...Rest<V>][]]> {
    let iterators: [number, Iterator<AsTuple<V>>|null][] = [];

    // Using a heap would have been faster theoretically, but in practice lists.length is small.
    const curr_objects: ([First<V>, [number, ...Rest<V>]]|null)[] = [];

    for(let i=0; i<lists.length; ++i) {
        iterators.push([i, lists[i][Symbol.iterator]()]);
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