import {assert} from 'chai';

import {PULSES_PER_WHOLE, kson} from "../dist/index.js";
import {TEST} from "./_common.js";

TEST("community/hexagon-1.ksh", function(ctx) {
    it("should have the correct metadata", function() {
        const {chart} = ctx;

        assert.strictEqual(chart.version, kson.VERSION);

        assert.deepStrictEqual(chart.meta, {
            title: "Astar",
            artist: "黒皇帝",
            chart_author: "HEXAGON",
            jacket_filename: "Astar.png",
            jacket_author: "HEXAGON",
            difficulty: 3,
            level: 19,
            disp_bpm: "96-448",
            std_bpm: 192,
            information: "Every node has an admissible H.",
        }, "meta must be equal");

        assert.deepStrictEqual([...chart.beat.bpm], [
            [0n, 192],
            [34n * PULSES_PER_WHOLE, 96],
            [38n * PULSES_PER_WHOLE, 144],
            [44n * PULSES_PER_WHOLE, 384],
            [47n * PULSES_PER_WHOLE, 448],
            [48n * PULSES_PER_WHOLE - PULSES_PER_WHOLE/8n, 192],
            [72n * PULSES_PER_WHOLE, 384],
            [72n * PULSES_PER_WHOLE + PULSES_PER_WHOLE/2n, 192],
            [88n * PULSES_PER_WHOLE + PULSES_PER_WHOLE/4n, 96],
        ], "bpm must be equal");

        assert.deepStrictEqual([...chart.beat.time_sig], [
            [0n, [4, 4]],
            [34n, [4, 8]],
            [42n, [6, 8]],
            [50n, [1, 4]],
            [54n, [1, 8]],
            [62n, [1, 12]],
            [74n, [1, 16]],
            [84n, [1, 4]],
            [85n, [1, 8]],
            [86n, [4, 4]],
            [110n, [1, 8]],
            [114n, [3, 4]],
            [115n, [4, 4]],
            [130n, [4, 8]],
        ], "time_sig must be equal");
        assert.deepStrictEqual([...chart.beat.scroll_speed], [[0n, [1, 1], [0, 0]]], "scroll_speed must be equal");

        assert.deepStrictEqual(chart.gauge, {
            total: 202,
        }, "gauge must be equal");

        assert.deepStrictEqual(chart.audio, {
            bgm: {
                filename: "Astar.mp3",
                vol: 0.75,
                offset: 100,
                preview: {
                    offset: 42540,
                    duration: 22000,
                },
            },
        }, "audio must be equal");
    });

    it("should have the correct auxillary info", function() {
        const {chart} = ctx;

        assert.deepStrictEqual([...chart.editor.comment], [
            [2n * PULSES_PER_WHOLE, "A"],
            [10n * PULSES_PER_WHOLE, "A'"],
            [18n * PULSES_PER_WHOLE, "B"],
            [26n * PULSES_PER_WHOLE, "B'"],
            [44n * PULSES_PER_WHOLE, "Shaking"],
            [64n * PULSES_PER_WHOLE, "D"],
            [68n * PULSES_PER_WHOLE, "D'"],
            [72n * PULSES_PER_WHOLE, "D''"],
            [80n * PULSES_PER_WHOLE + PULSES_PER_WHOLE/4n, "E"],
        ], "comments must be equal");

        assert.strictEqual(chart.compat.ksh_version, "160", "ksh_version must be equal");
        assert.deepStrictEqual(chart.compat.ksh_unknown.meta, {}, "no unknown meta");
        assert.deepStrictEqual(chart.compat.ksh_unknown.option, {}, "no unknown option");
        assert.strictEqual(chart.compat.ksh_unknown.line.size, 0, "no unknown line");
    });

    it("should have the correct median BPM", function() {
        const {chart} = ctx;
        
        assert.strictEqual(chart.getFirstNotePulse(), 0n, "the first note's pulse");
        assert.strictEqual(chart.getLastNotePulse(), 91n * PULSES_PER_WHOLE + PULSES_PER_WHOLE/4n, "the last note's pulse");
        assert.strictEqual(chart.getMedianBPM(), 192, "median BPM should be 192");
        
        const [total_duration, bpm_duration] = chart.getBPMDurationMap();
        assert.approximately(total_duration, 98 * 240000/192, 0.1, "total_duration should be 98 measures (in 192BPM)");
        assert.deepStrictEqual([...bpm_duration.keys()].sort((x, y) => x-y), [96, 144, 192, 384, 448], "there should be 5 BPMs");
    });

    it("should give correct measure info (by measure index)", function() {
        const {chart} = ctx;

        assert.deepStrictEqual(chart.getMeasureInfoByIdx(0n), {
            idx: 0n, pulse: 0n, time_sig: [4, 4],
            length: PULSES_PER_WHOLE, beat_length: PULSES_PER_WHOLE / 4n,
        }, "measure_idx = 0");
        
        assert.deepStrictEqual(chart.getMeasureInfoByIdx(20n), {
            idx: 20n, pulse: 20n * PULSES_PER_WHOLE, time_sig: [4, 4],
            length: PULSES_PER_WHOLE, beat_length: PULSES_PER_WHOLE / 4n,
        }, "measure_idx = 20");
        
        assert.deepStrictEqual(chart.getMeasureInfoByIdx(38n), {
            idx: 38n, pulse: 36n * PULSES_PER_WHOLE, time_sig: [4, 8],
            length: PULSES_PER_WHOLE / 2n, beat_length: PULSES_PER_WHOLE / 8n,
        }, "measure_idx = 38");

        assert.deepStrictEqual(chart.getMeasureInfoByIdx(86n), {
            idx: 86n, pulse: 48n * PULSES_PER_WHOLE, time_sig: [4, 4],
            length: PULSES_PER_WHOLE, beat_length: PULSES_PER_WHOLE / 4n,
        }, "measure_idx = 86");
        
        assert.deepStrictEqual(chart.getMeasureInfoByIdx(114n), {
            idx: 114n, pulse: 72n * PULSES_PER_WHOLE + PULSES_PER_WHOLE / 2n, time_sig: [3, 4],
            length: (3n * PULSES_PER_WHOLE) / 4n, beat_length: PULSES_PER_WHOLE / 4n,
        }, "measure_idx = 114");
    });

    it("should give correct measure info (by pulse)", function() {
        const {chart} = ctx;

        assert.deepStrictEqual(chart.getMeasureInfoByPulse(0n), {
            idx: 0n, pulse: 0n, time_sig: [4, 4],
            length: PULSES_PER_WHOLE, beat_length: PULSES_PER_WHOLE / 4n,
        }, "pulse = 0");

        assert.deepStrictEqual(chart.getMeasureInfoByPulse(24n * PULSES_PER_WHOLE), {
            idx: 24n, pulse: 24n * PULSES_PER_WHOLE, time_sig: [4, 4],
            length: PULSES_PER_WHOLE, beat_length: PULSES_PER_WHOLE / 4n,
        }, "pulse = 24W");

        assert.deepStrictEqual(chart.getMeasureInfoByPulse(24n * PULSES_PER_WHOLE + 42n), {
            idx: 24n, pulse: 24n * PULSES_PER_WHOLE, time_sig: [4, 4],
            length: PULSES_PER_WHOLE, beat_length: PULSES_PER_WHOLE / 4n,
        }, "pulse = 24W + 42");

        assert.deepStrictEqual(chart.getMeasureInfoByPulse(36n * PULSES_PER_WHOLE), {
            idx: 38n, pulse: 36n * PULSES_PER_WHOLE, time_sig: [4, 8],
            length: PULSES_PER_WHOLE / 2n, beat_length: PULSES_PER_WHOLE / 8n,
        }, "pulse = 36W");

        assert.deepStrictEqual(chart.getMeasureInfoByPulse(76n * PULSES_PER_WHOLE), {
            idx: 117n, pulse: 75n * PULSES_PER_WHOLE + PULSES_PER_WHOLE/4n, time_sig: [4, 4],
            length: PULSES_PER_WHOLE, beat_length: PULSES_PER_WHOLE / 4n,
        }, "pulse = 76W");
    });
});

TEST("community/lyrium-1.ksh", function(ctx) {
    it("should have the correct metadata", function() {
        const {chart} = ctx;

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

        assert.deepStrictEqual([...chart.beat.bpm], [[0n, 160], [5n * PULSES_PER_WHOLE, 165]], "bpm must be equal");
        assert.deepStrictEqual([...chart.beat.time_sig], [[0n, [4, 4]]], "time_sig must be equal");
        assert.deepStrictEqual([...chart.beat.scroll_speed], [[0n, [1, 1], [0, 0]]], "scroll_speed must be equal");

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
        const {chart} = ctx;

        assert.deepStrictEqual([...chart.editor.comment], [
            [1n * PULSES_PER_WHOLE, "START"], [9n * PULSES_PER_WHOLE, "END"],
        ], "comments must be equal");

        assert.strictEqual(chart.compat.ksh_version, "171", "ksh_version must be equal");
        assert.deepStrictEqual(chart.compat.ksh_unknown.meta, {}, "no unknown meta");
        assert.deepStrictEqual(chart.compat.ksh_unknown.option, {}, "no unknown option");
        assert.strictEqual(chart.compat.ksh_unknown.line.size, 0, "no unknown line");
    });

    it("should contain the correct amounts of notes", function() {
        const {chart} = ctx;

        assert.deepStrictEqual(chart.note.bt.map((notes) => notes.size), [1341, 1341, 1341, 1341], "1341 notes for each bt lane");
        assert.deepStrictEqual(chart.note.fx.map((notes) => notes.size), [1341, 1341], "1341 notes for each fx lane");
    });

    it("should contain correct lasers", function() {
        const {chart} = ctx;

        for(const [laser_ind, laser_val, pulse_start, pulse_end] of [
            [0, 0, 0n, 9n*PULSES_PER_WHOLE],
            [1, 1, 5n, 9n*PULSES_PER_WHOLE - 5n],
        ]) {
            const lasers = chart.note.laser[laser_ind];
            const first_laser = lasers.entries().next().value;

            assert.strictEqual(lasers.size, 1, `note.laser[${laser_ind}] contains 1 segment`);
            assert.strictEqual(first_laser[0], pulse_start, `start pulse of note.laser[${laser_ind}]`)
            assert.strictEqual(first_laser[1][1], 1, `note.laser[${laser_ind}] is not wide`)
            
            let prev_ry = -1n;
            for(const [ry, v, _curve] of first_laser[1][0]) {
                assert.isTrue(prev_ry < ry && ry <= pulse_end - pulse_start, `note.laser[${laser_ind}]: ry ${ry}`);
                if(prev_ry < 0n) {
                    assert.strictEqual(0n, ry, `note.laser[${laser_ind}]: first ry is zero`);
                }

                assert.deepStrictEqual(v, [laser_val, laser_val], `note.laser[${laser_ind}]: value at ry ${ry}`);
                prev_ry = ry;
            }
        }
    });
});