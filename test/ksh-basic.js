import * as fs from 'node:fs/promises';
import {assert} from 'chai';

import {Chart} from "../dist/index.js";

const chart_cache = {};
async function getChart(path) {
    if(path in chart_cache) return chart_cache[path];
    return chart_cache[path] = await fs.readFile(new URL(`chart/${path}`, import.meta.url), 'utf-8');
};

describe('KSH', function() {
    it("is used to count notes from a chart", async function() {
        const chart = Chart.parseKSH(await getChart('testcase/1-nov.ksh'));
        
        for(const note of chart.notes) {
            ++note_count;
        }

        assert.equal(note_count, 96);
    });

    describe('parse', function() {
        it("should be ", function() {

        })
    });
});
