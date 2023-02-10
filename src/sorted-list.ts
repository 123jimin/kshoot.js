import type {First, Rest, AsTuple} from "./util.js";

export interface ISortedList<V extends AsTuple<V>> extends Exclude<IMap<First<V>, Rest<V>>, typeof Symbol.iterator>, Iterable<AsTuple<V>> {
    put(elem: AsTuple<V>): unknown;
    at(index: number): AsTuple<V>|undefined;
    [Symbol.iterator](): Iterator<AsTuple<V>>;
}

// Naive implementation
export function NaiveSortedListFactory<V extends AsTuple<V>>(MapClass: new() => IMap<First<V>, Rest<V>> = Map):
        (new(list?: Iterable<AsTuple<V>>) => ISortedList<AsTuple<V>>) {
    class SortedList extends MapClass implements ISortedList<AsTuple<V>> {
        constructor(list?: Iterable<AsTuple<V>>) {
            super();

            if(list != null) for(const [key, ...value] of list) {
                this.set(key, value);
            }
        }

        private _sortedKeys(): First<V>[] {
            if(this.size === 0) return [];

            const keys = [...this.keys()];
            switch(typeof keys[0]) {
                case 'number':
                    (keys as number[]).sort((x, y) => x-y);
                    break;
                case 'bigint':
                    (keys as bigint[]).sort((x, y) => { const d = x-y; return d > 0 ? 1 : d < 0 ? -1 : 0; });
                    break;
                default:
                    keys.sort();
            }
            
            return keys;
        }

        put([key, ...value]: AsTuple<V>) {
            return this.set(key, value);
        }

        at(index: number): AsTuple<V>|undefined {
            const keys = this._sortedKeys();
            const key = keys.at(index);
            if(typeof key === 'undefined') return (void 0);

            const value = this.get(key);
            if(typeof value === 'undefined') return (void 0);

            return [key, ...value];
        }

        *[Symbol.iterator](): Iterator<AsTuple<V>> {
            const keys = this._sortedKeys();
            for(const key of keys) {
                const value = this.get(key);
                if(typeof value !== 'undefined') yield [key, ...value];
            }
        }
    }

    return SortedList;
}

// Modeling sort-btree's APIs

interface IMapSource<K, V> {
    size: number;
    get(key: K): V|undefined;
    has(key: K): boolean;
    keys(): IterableIterator<K>;
    /*
    forEach(callbackFn: (v:V, k:K, map:IMapSource<K,V>) => void, thisArg: unknown): void;
    entries(): IterableIterator<[K,V]>;
    values(): IterableIterator<V>;
    */
}

interface IMapSink<K, V> {
    delete(key: K): boolean;
    set(key: K, value: V): unknown;
    clear(): void;
}

interface IMap<K, V> extends IMapSource<K, V>, IMapSink<K, V> {}