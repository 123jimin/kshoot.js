import * as fs from 'node:fs/promises';
import {assert} from 'chai';

import {parse as parseChart} from "../dist/index.js";

const readChartFile = (file_name) => fs.readFile(new URL(`chart/${file_name}`, import.meta.url), 'utf-8');

export const TEST = (chart_name, callback) => {
    describe(`${chart_name}`, function() {
        const ctx = { file: "", chart: null };
        before("chart load", async function() {
            ctx.file = await readChartFile(chart_name);
            ctx.chart = parseChart(ctx.file);
        });

        callback.call(this, ctx);
    });
};

export const assertLaserSectionEqual = (actual, expected, name) => {
    assert.strictEqual(actual.length, 3, `${name}: length must be 3`);
    assert.strictEqual(actual[0], expected[0], `${name}: pulse must be equal`);
    assert.deepStrictEqual([...actual[1]], expected[1], `${name}: graph section points must be equal`);
    assert.strictEqual(actual[2], expected[2], `${name}: wide must be equal`);
};

export const assertLaserEqual = (actual, expected) => {
    assert.strictEqual(actual.length, 2, "laser must be an array of 2");

    for(let i=0; i<2; ++i) {
        assert.strictEqual(actual[i].size, expected[i].length, `laser[${i}]: size must be equal`);

        let j = 0;
        for(const section of actual[i]) {
            assertLaserSectionEqual(section, expected[i][j], `laser[${i}][${j}]`);
            ++j;
        }
    }
};