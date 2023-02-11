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