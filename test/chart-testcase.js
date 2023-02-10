import {assert} from 'chai';

import {PULSES_PER_WHOLE, kson} from "../dist/index.js";
import {TEST, assertLaserEqual} from "./_common.js";

TEST("testcase/01-nov.ksh", function(ctx) {
});

TEST("testcase/02-nov.ksh", function(ctx) {
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

        assert.deepStrictEqual([...chart.beat.bpm], [[0n, 120]], "bpm must be equal");
        assert.deepStrictEqual([...chart.beat.time_sig], [[0n, [4, 4]]], "time_sig must be equal");
        assert.deepStrictEqual([...chart.beat.scroll_speed], [[0n, [1, 1], [0, 0]]], "scroll_speed must be equal");

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

        assert.hasAllKeys(chart.editor, ['comment'], "editor must has specified keys");
        assert.deepStrictEqual([...chart.editor.comment], [], "comment must be equal");

        assert.strictEqual(chart.compat.ksh_version, "171", "ksh_version must be equal");
        assert.deepStrictEqual(chart.compat.ksh_unknown.meta, {}, "no unknown meta");
        assert.deepStrictEqual(chart.compat.ksh_unknown.option, {}, "no unknown option");
        assert.strictEqual(chart.compat.ksh_unknown.line.size, 0, "no unknown line");
    });

    it("should contain the correct amounts of notes", function() {
        const {chart} = ctx;

        assert.deepStrictEqual(chart.note.bt.map((notes) => notes.size), [16, 16, 16, 16], "16 notes for each bt lane");
        assert.deepStrictEqual(chart.note.fx.map((notes) => notes.size), [16, 16], "16 notes for each fx lane");
        assert.deepStrictEqual(chart.note.laser.map((lasers) => lasers.size), [0, 0], "note.laser must be empty");
    });
});

TEST("testcase/03-nov.ksh", function(ctx) {
    it("should contain no note", function() {
        const {chart} = ctx;

        assert.deepStrictEqual(chart.note.bt.map((notes) => notes.size), [0, 0, 0, 0], "no bt note");
        assert.deepStrictEqual(chart.note.fx.map((notes) => notes.size), [0, 0], "no fx note");
    });

    it("should contain correct lasers", function() {
        const {chart} = ctx;

        const LASERS = [[
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
            ], 1],
        ], [
            [PULSES_PER_WHOLE/2n, [
                [0n, [1, 1], [0, 0]],
                [PULSES_PER_WHOLE/4n, [1, 1], [0, 0]],
            ], 1],
            [3n*PULSES_PER_WHOLE/2n, [
                [0n, [1, 1], [0, 0]],
                [PULSES_PER_WHOLE/4n, [0, 0], [0, 0]],
            ], 1],
            [5n*PULSES_PER_WHOLE/2n, [
                [0n, [1, 1], [0, 0]],
                [PULSES_PER_WHOLE/8n, [0, 0], [0, 0]],
                [PULSES_PER_WHOLE/4n, [1, 1], [0, 0]],
                [3n*PULSES_PER_WHOLE/8n, [0.5, 0.5], [0, 0]],
                [PULSES_PER_WHOLE/2n, [1, 1], [0, 0]],
            ], 1],
            [4n*PULSES_PER_WHOLE, [
                [0n, [1, 0], [0, 0]],
            ], 1],
            [11n*PULSES_PER_WHOLE/2n, [
                [0n, [1, 0], [0, 0]],
                [PULSES_PER_WHOLE/4n, [1, 0], [0, 0]],
            ], 1],
        ]];

        assertLaserEqual(chart.note.laser, LASERS);
    });
});