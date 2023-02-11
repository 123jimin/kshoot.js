import {assert} from 'chai';
import {SortedList, iterateAll} from "../dist/sorted-list.js";

function TEST_LIST(label, SortedList) {
    describe(label, function() {
        describe("#size", function() {
            it("should be consistent", function() {
                const list = new SortedList();
                assert.strictEqual(list.size, 0, "empty list has zero size");
                
                list.put([1, "hello"]);
                list.put([2, "world"]);
                list.put([3, "hello"]);

                assert.strictEqual(list.size, 3, "three elements has been added");
                
                list.set(2, "asdf");
                list.put([4, "foo"]);

                assert.strictEqual(list.size, 4, "one duplicated element");

                list.delete(2);
                list.delete(3);

                assert.strictEqual(list.size, 2, "two elements has been deleted");
            });

            it("should be consistent across multiple puts, sets, and deletes", function() {
                const test_map = new Map();
                const list = new SortedList();

                for(let i=0; i<1000; ++i) {
                    const random_key = BigInt(0|Math.random()*500);
                    const random_value = `${0|Math.random()*1000}`;

                    if(test_map.has(random_key)) {
                        assert.isTrue(list.has(random_key), `key exists: ${random_key}`);
                        assert.deepStrictEqual(test_map.get(random_key), list.get(random_key), `must have same value for ${random_key}`);
                    } else {
                        assert.isFalse(list.has(random_key), `key doesn't exist: ${random_key}`);
                        assert.strictEqual(list.get(random_key), void 0, `key doesn't exist: ${random_key}`)
                    }

                    switch(0|Math.random()*3) {
                        case 0:
                            test_map.set(random_key, [random_value]);
                            list.set(random_key, [random_value]);
                            break;
                        case 1:
                            test_map.set(random_key, [random_value]);
                            list.put([random_key, random_value]);
                            break;
                        case 2:
                            assert.strictEqual(test_map.delete(random_key), list.delete(random_key));
                            break;
                    }

                    assert.strictEqual(test_map.size, list.size, "must have the same size");
                }
            });
        });

        describe("#[Symbol.iterator]", function() {
            it("should behave correctly after multiple operations", function() {
                const test_map = new Map();
                const list = new SortedList();

                for(let i=0; i<1000; ++i) {
                    const random_key = BigInt(0|Math.random()*500);
                    const random_value = `${0|Math.random()*1000}`;

                    switch(0|Math.random()*3) {
                        case 0:
                            test_map.set(random_key, [random_value]);
                            list.set(random_key, [random_value]);
                            break;
                        case 1:
                            test_map.set(random_key, [random_value]);
                            list.put([random_key, random_value]);
                            break;
                        case 2:
                            assert.strictEqual(test_map.delete(random_key), list.delete(random_key));
                            break;
                    }
                }

                assert.strictEqual(test_map.size, list.size, "must have the same size");

                let prev_val = -1n;
                for(const [key, ...value] of list) {
                    assert.isTrue(prev_val < key, `must be ordered (${prev_val} < ${key})`);
                    assert.isTrue(test_map.has(key), `must have key ${key}`);
                    assert.deepStrictEqual(value, test_map.get(key), `must have consistent value for ${key}`);
                    prev_val = key;
                }
            });
        });

        describe("iterateAll", function() {
            const NUM_LISTS = 8;
            const NUM_INTS = 1000;

            const answer = [];
            let lists = [];

            for(let i=0; i<NUM_LISTS; ++i) {
                lists.push([]);
            }

            for(let i=0; i<NUM_INTS; ++i) {
                const row = [];
                for(let j=0; j<NUM_LISTS; ++j) {
                    if(Math.random() >= 0.5) continue;

                    const random_value = Math.random().toString();
                    lists[j].push([i, random_value]);
                    row.push([j, random_value]);
                }
                if(row.length > 0) {
                    answer.push([i, row]);
                }
            }

            lists = lists.map((list) => {
                let curr_ind = list.length;
                let random_ind;

                while(curr_ind > 0) {
                    random_ind = 0|Math.random()*curr_ind--;

                    [list[curr_ind], list[random_ind]] = [list[random_ind], list[curr_ind]];
                }

                return new SortedList(list);
            });

            const it = iterateAll(...lists);

            for(const answer_row of answer) {
                const {done, value} = it.next();

                assert.isNotOk(done, "the iterator should have not yet ended");
                assert.deepStrictEqual(value, answer_row);
            }

            assert.isTrue(it.next().done, "the iterator should have ended");
        });
    });
}

TEST_LIST("SortedList", SortedList);