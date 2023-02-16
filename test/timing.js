import {assert} from 'chai';
import {Timing} from "../dist/chart/timing.js";

const assertMeasuresEqual = (generator, expected, label) => {
    let ind = 0;
    for(const v of generator) {
        assert.deepStrictEqual(v, expected[ind], label);
        ++ind;
    }
};

describe("Timing", function() {
    describe("#getTimeByPulse", function() {
        it("should return accurate values for simple cases", function() {
            const timing = new Timing({
                bpm: [[0n, 240]],
                time_sig: [[0n, [4, 4]]],
            });

            assert.strictEqual(timing.getTimeByPulse(0n), 0);
            assert.strictEqual(timing.getTimeByPulse(960n), 1000);
            assert.strictEqual(timing.getTimeByPulse(-960n), -1000);
        });

        it("should return accurate values for timings with BPM changes", function() {
            const timing = new Timing({
                bpm: [[0n, 240], [960n, 60], [1920n, 120]],
                time_sig: [[0n, [4, 4]]],
            });

            assert.strictEqual(timing.getTimeByPulse(-480n), -500);
            assert.strictEqual(timing.getTimeByPulse(0n), 0);
            assert.strictEqual(timing.getTimeByPulse(480n), 500);
            assert.strictEqual(timing.getTimeByPulse(960n), 1000);
            assert.strictEqual(timing.getTimeByPulse(1440n), 3000);
            assert.strictEqual(timing.getTimeByPulse(1920n), 5000);
            assert.strictEqual(timing.getTimeByPulse(2400n), 6000);
        });
    });

    describe("#measures", function() {
        it("should return measures for simple cases", function() {
            const timing = new Timing({
                bpm: [[0n, 240]],
                time_sig: [[0n, [4, 4]]],
            });

            assertMeasuresEqual(timing.measures([0n, 960n]), [
                [0n, {idx: 0n, pulse: 0n, time_sig: [4, 4], length: 960n, beat_length: 240n}],
            ]);

            assertMeasuresEqual(timing.measures([100n, 2000n]), [
                [0n, {idx: 0n, pulse: 0n, time_sig: [4, 4], length: 960n, beat_length: 240n}],
                [960n, {idx: 1n, pulse: 960n, time_sig: [4, 4], length: 960n, beat_length: 240n}],
                [1920n, {idx: 2n, pulse: 1920n, time_sig: [4, 4], length: 960n, beat_length: 240n}],
            ]);
        });
    })
});