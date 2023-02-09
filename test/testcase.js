import * as fs from 'node:fs/promises';
import {assert} from 'chai';

import {PULSES_PER_WHOLE, kson, parse as parseChart} from "../dist/index.js";

const readChart = (file_name) => fs.readFile(new URL(`chart/testcase/${file_name}`, import.meta.url), 'utf-8');

describe('testcase/02-nov.ksh', function() {
    let chart_file = "";
    let chart = null;

    before(async () => { chart_file = await readChart("02-nov.ksh"); chart = parseChart(chart_file) });

    it("should have the correct metadata", function() {
        assert.strictEqual(chart.version, kson.VERSION);

        assert.deepStrictEqual(chart.meta, {
            title: "Testcase 02 [NOV]",
            artist: "02-NOV art HEXAGON",
            chart_author: "02-NOV effect HEXAGON",
            jacket_filename: ".jpg",
            jacket_author: "02-NOV illust HEXAGON",
            difficulty: 0,
            level: 2,
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

        assert.deepStrictEqual(chart.audio, {
            bgm: {
                filename: "02-nov.ogg",
                vol: 0.75,
                offset: 8000,
                preview: {
                    offset: 0,
                    duration: 15000,
                },
            },
        }, "audio must be equal");
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