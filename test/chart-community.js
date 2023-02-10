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
        assert.deepStrictEqual([...chart.editor.comment], [
            [1n * PULSES_PER_WHOLE, "START"], [9n * PULSES_PER_WHOLE, "END"],
        ], "comments must be equal");

        assert.strictEqual(chart.compat.ksh_version, "171", "ksh_version must be equal");
        assert.deepStrictEqual(chart.compat.ksh_unknown.meta, {}, "no unknown meta");
        assert.deepStrictEqual(chart.compat.ksh_unknown.option, {}, "no unknown option");
        assert.strictEqual(chart.compat.ksh_unknown.line.length, 0, "no unknown line");
    });

    it("should contain the correct amounts of notes", function() {
        assert.deepStrictEqual(chart.note.bt.map((notes) => notes.length), [1341, 1341, 1341, 1341], "1341 notes for each bt lane");
        assert.deepStrictEqual(chart.note.fx.map((notes) => notes.length), [1341, 1341], "1341 notes for each fx lane");
    });

    it("should contain correct lasers", function() {
        for(const [laser_ind, laser_val, pulse_start, pulse_end] of [
            [0, 0, 0n, 9n*PULSES_PER_WHOLE],
            [1, 1, 5n, 9n*PULSES_PER_WHOLE - 5n],
        ]) {
            const lasers = chart.note.laser[laser_ind];
            const first_laser = lasers.at(0);

            assert.strictEqual(lasers.length, 1, `note.laser[${laser_ind}] contains 1 segment`);
            assert.strictEqual(first_laser[0], pulse_start, `start pulse of note.laser[${laser_ind}]`)
            assert.strictEqual(first_laser[2], 1, `note.laser[${laser_ind}] is not wide`)
            
            let prev_ry = -1n;
            for(const [ry, v, _curve] of first_laser[1]) {
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