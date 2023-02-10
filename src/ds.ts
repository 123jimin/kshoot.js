export interface SortedContainer<V> extends Iterable<V> {
    get length(): number;
    at(index: number): V|undefined;
    push(item: V): void;
}

export class ArrayContainer<V> implements SortedContainer<V> {
    private _items: V[];
    
    constructor(items?: V[]) {
        this._items = items ?? [];
    }

    get length() { return this._items.length; }
    at(index: number) { return this._items.at(index); }
    [Symbol.iterator]() { return this._items[Symbol.iterator](); }
    
    push(item: V): void {
        if(this._items.length === 0) {
            this._items.push(item);
            return;
        }
        
        this._items.push(item);
    }
}