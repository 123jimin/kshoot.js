export interface SortedContainer<V> extends Iterable<V> {
    get length(): number;
    at(index: number): V|undefined;
    push(item: V): void;
}

export class ArrayContainer<V> implements SortedContainer<V> {
    private _items: V[] = [];
    
    get length() { return this._items.length; }
    at(index: number) { return this._items.at(index); }
    push(item: V): void { this._items.push(item); }
    [Symbol.iterator]() { return this._items[Symbol.iterator](); }
}