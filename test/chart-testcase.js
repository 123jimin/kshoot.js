import * as fs from 'node:fs/promises';
import {assert} from 'chai';

import {PULSES_PER_WHOLE, kson, parse as parseChart} from "../dist/index.js";

const readChart = (file_name) => fs.readFile(new URL(`chart/testcase/${file_name}`, import.meta.url), 'utf-8');

const TEST = (chart_name, callback) => {
    describe(`testcase/${chart_name}`, function() {
        const ctx = { file: "", chart: null };
        before("chart load", async function() {
            ctx.file = await readChart(chart_name);
            ctx.chart = parseChart(ctx.file);
        });

        callback.call(this, ctx);
    });
};

TEST("01-nov.ksh", function(ctx) {
});

TEST("02-nov.ksh", function(ctx) {
    it("should have the correct metadata", function() {
        const {chart} = ctx;

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
        const {chart} = ctx;

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
        const {chart} = ctx;
        
        assert.deepStrictEqual(chart.note.bt.map((notes) => notes.length), [16, 16, 16, 16], "16 notes for each bt lane");
        assert.deepStrictEqual(chart.note.fx.map((notes) => notes.length), [16, 16], "16 notes for each fx lane");
        assert.deepStrictEqual(chart.note.laser, [[], []], "note.laser must be empty");
    });
});

TEST("03-nov.ksh", function(ctx) {
    it("should contain no note", function() {
        const {chart} = ctx;

        assert.deepStrictEqual(chart.note.bt.map((notes) => notes.length), [0, 0, 0, 0], "no bt note");
        assert.deepStrictEqual(chart.note.fx.map((notes) => notes.length), [0, 0], "no fx note");
    });

    it("should contain correct lasers", function() {
        const {chart} = ctx;

        const LASER_L = [
            [0n, [
                [0n, [0, 0], [0, 0]],
                [PULSES_PER_WHOLE/4n, [0, 0], [0, 0]],
            ], 1],
            [PULSES_PER_WHOLE, [
                [0n, [0, 0], [0, 0]],
                [PULSES_PER_WHOLE/4n, [1, 1], [0, 0]],
            ], 1],
            [2n*PULSES_PER_WHOLE, [
                [0n, [0, 0], [0, 0]],
                [PULSES_PER_WHOLE/8n, [1, 1], [0, 0]],
                [PULSES_PER_WHOLE/4n, [0, 0], [0, 0]],
                [3n*PULSES_PER_WHOLE/8n, [0.5, 0.5], [0, 0]],
                [PULSES_PER_WHOLE/2n, [0, 0], [0, 0]],
            ], 1],
            [3n*PULSES_PER_WHOLE, [
                [0n, [0, 1], [0, 0]],
            ], 1],
            [5n*PULSES_PER_WHOLE, [
                [0n, [0, 1], [0, 0]],
                [PULSES_PER_WHOLE/4n, [0, 1], [0, 0]],
            ], 1]
        ], LASER_R = [

        ];

        assert.deepStrictEqual([...chart.note.laser[0]], LASER_L, "left laser must be equal");
        assert.deepStrictEqual([...chart.note.laser[1]], LASER_R, "right laser must be equal");
    });
});