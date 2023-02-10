import {assert} from 'chai';
import {NaiveSortedListFactory} from "../dist/sorted-list.js";

function TEST_LIST(label, SortedList) {
    describe(label, function() {
        it("#size", function() {
            const list = new SortedList();
            assert.strictEqual(list.size, 0, "empty list has zero size");
        });
    });
}

TEST_LIST("NaiveSortedList", NaiveSortedListFactory());