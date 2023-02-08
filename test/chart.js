import * as fs from 'node:fs/promises';
import {assert} from 'chai';

import {kson, parse as parseChart} from "../dist/index.js";

const readChart = (file_name) => fs.readFile(new URL(`chart/${file_name}`, import.meta.url), 'utf-8');

describe('testcase/1-nov.ksh', function() {
    let chart_file = "";
    let chart = null;

    before(async () => { chart_file = await readChart("testcase/1-nov.ksh"); chart = parseChart(chart_file) });

    it("should have the correct metadata", function() {
        assert.strictEqual(chart.version, kson.VERSION);

        assert.deepStrictEqual(chart.meta, {
            title: "Testcase 1 [NOV]",
            artist: "1-NOV art HEXAGON",
            chart_author: "1-NOV effect HEXAGON",
            jacket_filename: ".jpg",
            jacket_author: "1-NOV illust HEXAGON",
            difficulty: 0,
            level: 1,
            disp_bpm: "120",
        }, "meta must be equal");

        assert.deepStrictEqual(chart.beat, {
            bpm: [[0n, 120]],
            time_sig: [[0n, [4, 4]]],
            scroll_speed: [[0n, [1, 1], [0, 0]]],
        }, "beat must be equal");

        assert.deepStrictEqual(chart.gauge, {
            total: 0,
        }, "gauge must be equal");
    });

    it("should have the correct auxillary info", function() {
        assert.deepStrictEqual(chart.editor, {
            comment: [],
        }, "editor must be equal");

        assert.deepStrictEqual(chart.compat, {
            ksh_version: "171",
            ksh_unknown: {
                meta: {},
                option: {},
                line: [],
            }
        }, "compat must be equal");
    });

    it("should contain the correct amounts of notes", function() {
        assert.deepStrictEqual(chart.note.bt.map((notes) => notes.length), [16, 16, 16, 16], "16 notes for each bt lane");
        assert.deepStrictEqual(chart.note.fx.map((notes) => notes.length), [16, 16], "16 notes for each fx lane");
        assert.deepStrictEqual(chart.note.laser, [[], []], "note.laser must be empty");
    });
});
