import {assert} from 'chai';

import {PULSES_PER_WHOLE, kson, LaserConductAction} from "../dist/index.js";
import {TEST, assertLaserEqual} from "./_common.js";

TEST("testcase/01-nov.ksh", function(ctx) {
    it("should have the correct metadata", function() {
        const {chart} = ctx;
        
        assert.strictEqual(chart.version, kson.VERSION);

        assert.deepStrictEqual(chart.meta, {
            title: "Testcase 01 [NOV]",
            artist: "",
            chart_author: "",
            jacket_filename: ".jpg",
            jacket_author: "",
            difficulty: 0,
            level: 1,
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
                filename: ".mp3",
                vol: 0.75,
                offset: 0,
                preview: {
                    offset: 0,
                    duration: 15000,
                },
            },
        }, "audio must be equal");
    });
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

TEST("testcase/02-adv.ksh", function(ctx) {
    it("should contain all note combinations", function() {
        const {chart} = ctx;

        const combination_counts = [];
        for(let i=0; i<64; ++i) combination_counts[i] = 0;

        let prev_pulse = -1n;
        let prev_measure_idx = -1n;
        let prev_time = -1;
        for(const [timing_info, button_objects] of chart.withTimingInfo(chart.buttonNotes())) {
            assert.isTrue(prev_pulse < timing_info.pulse, "pulse should advance");
            assert.isTrue(prev_time < timing_info.time, "time should advance");
            assert.isTrue(prev_measure_idx === timing_info.measure.idx || prev_measure_idx + 1n === timing_info.measure.idx, "measure_idx should increase slowly");

            [prev_pulse, prev_time, prev_measure_idx] = [timing_info.pulse, timing_info.time, timing_info.measure.idx];

            assert.strictEqual(timing_info.bpm, 120, "bpm should stay constant");
            assert.isTrue(timing_info.measure.pulse <= timing_info.pulse && timing_info.pulse < timing_info.measure.pulse + timing_info.measure.length, "measure pulse should be correct");
            assert.deepStrictEqual(timing_info.measure.time_sig, [4, 4], "time signature should stay constant");
            assert.strictEqual(timing_info.measure.length, 960n, "measure length should stay constant");
            assert.strictEqual(timing_info.measure.beat_length, 240n, "measure beat length should stay constant");

            assert.notEqual(button_objects.length, 0, "there should be at least 1 button");

            switch(Number(timing_info.measure.idx)) {
                case 0: case 1:
                    assert.strictEqual(button_objects.length, 1, `correct chord for measure ${timing_info.measure.idx+1n}`);
                    break;
                case 2: case 3: case 4: case 5:
                    assert.strictEqual(button_objects.length, 2, `correct chord for measure ${timing_info.measure.idx+1n}`);
                    break;
                case 6: case 7: case 8: case 9: case 10: case 11:
                    assert.strictEqual(button_objects.length, 3, `correct chord for measure ${timing_info.measure.idx+1n}`);
                    break;
                case 12: case 13: case 14: case 15: case 16:
                    assert.strictEqual(button_objects.length, 4, `correct chord for measure ${timing_info.measure.idx+1n}`);
                    break;
                case 17: case 18:
                    assert.strictEqual(button_objects.length, 5, `correct chord for measure ${timing_info.measure.idx+1n}`);
                    break;
                case 19:
                    assert.strictEqual(button_objects.length, 6, `correct chord for measure ${timing_info.measure.idx+1n}`);
                    break;
                default:
                    assert.fail(`invalid measure ${timing_info.measure.idx+1n}`);
            }

            let x = 0;
            for(const button_object of button_objects) {
                assert.isTrue(0 <= button_object.lane && button_object.lane < 6, `${button_object.lane} should be a valid lane`);
                assert.strictEqual(button_object.length, 0n, "all notes should be short");
                x |= 1 << button_object.lane;
            }

            ++combination_counts[x];
        }

        for(let i=1; i<64; ++i) {
            let desired_count = 1;

            switch(i) {
                case 0b01_0000:
                case 0b10_0000:
                case 0b11_0000:
                case 0b01_1111:
                case 0b10_1111:
                    desired_count = 2;
                    break;
                case 0b00_1111:
                case 0b11_1111:
                    desired_count = 4;
                    break;
            }

            assert.strictEqual(combination_counts[i], desired_count, `combination ${i} occurrences`);
        }
    });
});

TEST("testcase/03-nov.ksh", function(ctx) {
    it("should contain no note", function() {
        const {chart} = ctx;

        assert.deepStrictEqual(chart.note.bt.map((notes) => notes.size), [0, 0, 0, 0], "no bt note");
        assert.deepStrictEqual(chart.note.fx.map((notes) => notes.size), [0, 0], "no fx note");
    });

    it("should never contain incorrect laser conducts", function() {
        const {chart} = ctx;
        for(const [pulse, lasers] of chart.laserConducts()) {
            for(const laser of lasers) {
                assert.isTrue(laser.lane === 0 || laser.lane === 1, `[${pulse}, ${laser.lane}] lane must be either 0 or 1`);
                assert.isNotTrue(laser.length_before != null && laser.length_before < 0n, `[${pulse}, ${laser.lane}] length_before must be non-negative`)
                assert.isNotTrue((laser.action === LaserConductAction.Slam || laser.action === LaserConductAction.End) && (laser.length_after != null || laser.dir_after != null),
                    `[${pulse}, ${laser.lane}] after values must not exist for Slam or End actions`)
                assert.isNotTrue(laser.length_after != null && laser.length_after < 0n, `[${pulse}, ${laser.lane}] length_after must be non-negative`)
                assert.isNotTrue((laser.action === LaserConductAction.Slam || laser.action === LaserConductAction.Start) && (laser.length_before != null || laser.dir_before != null),
                    `[${pulse}, ${laser.lane}] before values must not exist for Slam or Start actions`)
                assert.isNotTrue(laser.action === LaserConductAction.Continue && laser.dir_before === laser.dir_after && laser.dir_slam == null,
                    `[${pulse}, ${laser.lane}] continue conducts must not be trivial`);
            }
        }
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

        assert.deepStrictEqual([...chart.laserNotes(0)], [
            [0n, {section_pulse: 0n, lane: 0, width: 1, length: PULSES_PER_WHOLE/4n, v: [0, 0], ve: 0, curve: [0, 0]}],
            [PULSES_PER_WHOLE, {section_pulse: PULSES_PER_WHOLE, lane: 0, width: 1, length: PULSES_PER_WHOLE/4n, v: [0, 0], ve: 1, curve: [0, 0]}],
            [2n*PULSES_PER_WHOLE, {section_pulse: 2n*PULSES_PER_WHOLE, lane: 0, width: 1, length: PULSES_PER_WHOLE/8n, v: [0, 0], ve: 1, curve: [0, 0]}],
            [2n*PULSES_PER_WHOLE+PULSES_PER_WHOLE/8n, {section_pulse: 2n*PULSES_PER_WHOLE, lane: 0, width: 1, length: PULSES_PER_WHOLE/8n, v: [1, 1], ve: 0, curve: [0, 0]}],
            [2n*PULSES_PER_WHOLE+PULSES_PER_WHOLE/4n, {section_pulse: 2n*PULSES_PER_WHOLE, lane: 0, width: 1, length: PULSES_PER_WHOLE/8n, v: [0, 0], ve: 0.5, curve: [0, 0]}],
            [2n*PULSES_PER_WHOLE+3n*PULSES_PER_WHOLE/8n, {section_pulse: 2n*PULSES_PER_WHOLE, lane: 0, width: 1, length: PULSES_PER_WHOLE/8n, v: [0.5, 0.5], ve: 0, curve: [0, 0]}],
            [3n*PULSES_PER_WHOLE, {section_pulse: 3n*PULSES_PER_WHOLE, lane: 0, width: 1, length: 0n, v: [0, 1], ve: 1, curve: [0, 0]}],
            [5n*PULSES_PER_WHOLE, {section_pulse: 5n*PULSES_PER_WHOLE, lane: 0, width: 1, length: PULSES_PER_WHOLE/4n, v: [0, 1], ve: 0, curve: [0, 0]}],
            [5n*PULSES_PER_WHOLE+PULSES_PER_WHOLE/4n, {section_pulse: 5n*PULSES_PER_WHOLE, lane: 0, width: 1, length: 0n, v: [0, 1], ve: 1, curve: [0, 0]}],
        ]);
    });

    it("should return correct laser objects", function() {
        const {chart} = ctx;

        assert.deepStrictEqual([...chart.laserNotes([
            2n * PULSES_PER_WHOLE + 5n * (PULSES_PER_WHOLE/16n),
            3n * PULSES_PER_WHOLE,
        ])], [
            [2n * PULSES_PER_WHOLE + 2n * (PULSES_PER_WHOLE/8n), [{lane: 0, width: 1, length: PULSES_PER_WHOLE/8n, section_pulse: 2n * PULSES_PER_WHOLE, curve: [0, 0], v: [0, 0], ve: 0.5}]],
            [2n * PULSES_PER_WHOLE + 3n * (PULSES_PER_WHOLE/8n), [{lane: 0, width: 1, length: PULSES_PER_WHOLE/8n, section_pulse: 2n * PULSES_PER_WHOLE, curve: [0, 0], v: [0.5, 0.5], ve: 0}]],
            [2n * PULSES_PER_WHOLE + 4n * (PULSES_PER_WHOLE/8n), [{lane: 1, width: 1, length: PULSES_PER_WHOLE/8n, section_pulse: 2n * PULSES_PER_WHOLE + PULSES_PER_WHOLE/2n, curve: [0, 0], v: [1, 1], ve: 0}]],
            [2n * PULSES_PER_WHOLE + 5n * (PULSES_PER_WHOLE/8n), [{lane: 1, width: 1, length: PULSES_PER_WHOLE/8n, section_pulse: 2n * PULSES_PER_WHOLE + PULSES_PER_WHOLE/2n, curve: [0, 0], v: [0, 0], ve: 1}]],
            [2n * PULSES_PER_WHOLE + 6n * (PULSES_PER_WHOLE/8n), [{lane: 1, width: 1, length: PULSES_PER_WHOLE/8n, section_pulse: 2n * PULSES_PER_WHOLE + PULSES_PER_WHOLE/2n, curve: [0, 0], v: [1, 1], ve: 0.5}]],
            [2n * PULSES_PER_WHOLE + 7n * (PULSES_PER_WHOLE/8n), [{lane: 1, width: 1, length: PULSES_PER_WHOLE/8n, section_pulse: 2n * PULSES_PER_WHOLE + PULSES_PER_WHOLE/2n, curve: [0, 0], v: [0.5, 0.5], ve: 1}]],
        ], "partial lasers");
    })
});

TEST("testcase/03-adv.ksh", function(ctx) {
    it("should contain no note", function() {
        const {chart} = ctx;

        assert.deepStrictEqual(chart.note.bt.map((notes) => notes.size), [0, 0, 0, 0], "no bt note");
        assert.deepStrictEqual(chart.note.fx.map((notes) => notes.size), [0, 0], "no fx note");
    });

    it("should never contain incorrect laser conducts", function() {
        const {chart} = ctx;
        for(const [pulse, lasers] of chart.laserConducts()) {
            for(const laser of lasers) {
                assert.isTrue(laser.lane === 0 || laser.lane === 1, `[${pulse}, ${laser.lane}] lane must be either 0 or 1`);
                assert.isNotTrue(laser.length_before != null && laser.length_before < 0n, `[${pulse}, ${laser.lane}] length_before must be non-negative`)
                assert.isNotTrue((laser.action === LaserConductAction.Slam || laser.action === LaserConductAction.End) && (laser.length_after != null || laser.dir_after != null),
                    `[${pulse}, ${laser.lane}] after values must not exist for Slam or End actions`)
                assert.isNotTrue(laser.length_after != null && laser.length_after < 0n, `[${pulse}, ${laser.lane}] length_after must be non-negative`)
                assert.isNotTrue((laser.action === LaserConductAction.Slam || laser.action === LaserConductAction.Start) && (laser.length_before != null || laser.dir_before != null),
                    `[${pulse}, ${laser.lane}] before values must not exist for Slam or Start actions`)
                assert.isNotTrue(laser.action === LaserConductAction.Continue && laser.dir_before === laser.dir_after && laser.dir_slam == null,
                    `[${pulse}, ${laser.lane}] continue conducts must not be trivial`);
            }
        }
    });
});