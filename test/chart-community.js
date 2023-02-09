import * as fs from 'node:fs/promises';
import {assert} from 'chai';

import {PULSES_PER_WHOLE, kson, parse as parseChart} from "../dist/index.js";

const readChart = (file_name) => fs.readFile(new URL(`chart/community/${file_name}`, import.meta.url), 'utf-8');

describe('community/lyrium-1.ksh', function() {
    let chart_file = "";
    let chart = null;

    before(async () => { chart_file = await readChart("lyrium-1.ksh"); chart = parseChart(chart_file) });

    it("should have the correct metadata", function() {
        assert.strictEqual(chart.version, kson.VERSION);

        assert.deepStrictEqual(chart.meta, {
            title: "-",
            artist: "-",
            chart_author: "-",
            jacket_filename: ".jpg",
            jacket_author: "-",
            difficulty: 3,
            level: 1,
            disp_bpm: "160-165",
        }, "meta must be equal");

        assert.deepStrictEqual(chart.beat, {
            bpm: [[0n, 160], [5n * PULSES_PER_WHOLE, 165]],
            time_sig: [[0n, [4, 4]]],
            scroll_speed: [[0n, [1, 1], [0, 0]]],
        }, "beat must be equal");

        assert.deepStrictEqual(chart.gauge, {
            total: 0,
        }, "gauge must be equal");

        assert.deepStrictEqual(chart.audio, {
            bgm: {
                filename: "song.ogg",
                vol: 0.75,
                offset: 0,
                preview: {
                    offset: 0,
                    duration: 15000,
                },
            },
        }, "audio must be equal");
    });

    it("should have the correct auxillary info", function() {
        assert.deepStrictEqual(chart.editor, {
            comment: [[1n * PULSES_PER_WHOLE, "START"], [9n * PULSES_PER_WHOLE, "END"]],
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
        assert.deepStrictEqual(chart.note.bt.map((notes) => notes.length), [1341, 1341, 1341, 1341], "1341 notes for each bt lane");
        assert.deepStrictEqual(chart.note.fx.map((notes) => notes.length), [1341, 1341], "1341 notes for each fx lane");
        assert.deepStrictEqual(chart.note.laser, [[], []], "note.laser must be equal"); // TODO: decide wtf to do
    });
});