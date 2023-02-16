import * as kson from "../kson/index.js";
import {BTree, type ISortedMap} from "../sorted-list.js";

type Pulse = kson.Pulse;
const PULSES_PER_WHOLE = kson.PULSES_PER_WHOLE;
type MeasureIdx = kson.MeasureIdx;

export type PulseRange = [begin: Pulse, end: Pulse];

export interface BPMInfo {
    /** Time from the beginning of the chart, in milliseconds. */
    time: number;
    /** BPM at this moment */
    bpm: number;
}

export interface MeasureInfo {
    /** `measure_idx` for this measure */
    idx: kson.MeasureIdx;
    /** Beginning of this measure */
    pulse: kson.Pulse;
    /** Time signature for this measure, in [numerator, denominator] */
    time_sig: Readonly<kson.TimeSig>;
    /** Length of this measure, in pulses */
    length: kson.Pulse;
    /** Beat length of this measure, in pulses */
    beat_length: kson.Pulse;
}

export function createMeasureInfo(base_idx: MeasureIdx, base_pulse: Pulse, time_sig: Readonly<kson.TimeSig>): MeasureInfo {
    const beat_length = PULSES_PER_WHOLE / BigInt(time_sig[1]);
    const length = beat_length * BigInt(time_sig[0]);

    return {
        idx: base_idx, pulse: base_pulse,
        time_sig, length, beat_length,
    };
}

export function updateMeasureInfo(measure_info: MeasureInfo, pulse: Pulse) {
    const diff_idx = pulse >= measure_info.pulse ?
        (pulse - measure_info.pulse) / measure_info.length :
        -((measure_info.pulse - pulse) / measure_info.length);

    measure_info.idx += diff_idx;
    measure_info.pulse += diff_idx * measure_info.length;
}

/** Contains various timing informations for one point */
export interface TimingInfo extends BPMInfo {
    pulse: Pulse;
    /** Informations on the measure at this moment */
    measure: MeasureInfo;
}

type TimingIterators = {bpm: Iterator<[Pulse, Readonly<BPMInfo>]>, time_sig: Iterator<[Pulse, [MeasureIdx, Readonly<kson.TimeSig>]]>};
type TimingStatus = {bpm: [Pulse, Readonly<BPMInfo>], time_sig: [Pulse, [MeasureIdx, Readonly<kson.TimeSig>]]};

/** Class for managing  */
export class Timing {
    readonly bpm_by_pulse: ISortedMap<Pulse, Readonly<BPMInfo>>;
    readonly bpm_by_time: ISortedMap<number, Readonly<BPMInfo>>;
    readonly time_sig_by_pulse: ISortedMap<Pulse, [MeasureIdx, Readonly<kson.TimeSig>]>;
    readonly time_sig_by_idx: ISortedMap<MeasureIdx, [Pulse, Readonly<kson.TimeSig>]>;

    constructor(beat: kson.BeatInfo) {
        // Init BPM
        const bpm_by_pulse: [Pulse, BPMInfo][] = [];
        const bpm_by_time: [number, BPMInfo][] = [];

        let time_divider = 120 * Number(PULSES_PER_WHOLE);
        let base_pulse = 0n;
        let base_time = 0;

        for(const [pulse, bpm] of beat.bpm) {
            if(bpm_by_pulse.length === 0 && pulse > 0n) {
                bpm_by_pulse.push([0n, {time: 0, bpm: 120}]);
                bpm_by_time.push([0, {time: 0, bpm: 120}]);
            }

            base_time += Number(240_000n * (pulse - base_pulse)) / time_divider;
            base_pulse = pulse;
            time_divider = bpm * Number(PULSES_PER_WHOLE);

            const bpm_info = {time: base_time, bpm};
            bpm_by_pulse.push([pulse, bpm_info]);
            bpm_by_time.push([base_time, bpm_info]);
        }

        this.bpm_by_pulse = new BTree<Pulse, BPMInfo>(bpm_by_pulse);
        this.bpm_by_time = new BTree<number, BPMInfo>(bpm_by_time);

        // Init TimeSig
        const time_sig_arr: [MeasureIdx, Pulse, kson.TimeSig][] = [];

        let prev_time_sig = [4, 4];
        let base_measure_idx = 0n;
        base_pulse = 0n;

        for(const [measure_idx, time_sig] of beat.time_sig) {
            if(time_sig_arr.length == 0 && measure_idx > 0n) {
                time_sig_arr.push([0n, 0n, [4, 4]]);
            }
            
            base_pulse += (measure_idx - base_measure_idx) * (PULSES_PER_WHOLE / BigInt(prev_time_sig[1]) * BigInt(prev_time_sig[0]));
            base_measure_idx = measure_idx;
            prev_time_sig = time_sig;

            time_sig_arr.push([measure_idx, base_pulse, time_sig]);
        }

        this.time_sig_by_pulse = new BTree<Pulse, [MeasureIdx, kson.TimeSig]>(time_sig_arr.map(([measure_idx, pulse, time_sig]) => [pulse, [measure_idx, time_sig]]));
        this.time_sig_by_idx = new BTree<MeasureIdx, [Pulse, kson.TimeSig]>(time_sig_arr.map(([measure_idx, pulse, time_sig]) => [measure_idx, [pulse, time_sig]]));
    }

    *measures(range: PulseRange): Generator<[Pulse, MeasureInfo]> {
        const start: Pulse = this.time_sig_by_pulse.nextLowerKey(range[0]+1n) ?? 0n;
        const it = this.time_sig_by_pulse.entries(start);

        let curr_info: [Pulse, [MeasureIdx, Readonly<kson.TimeSig>]] = it.next().value;
        let next_info: (typeof curr_info)|undefined = it.next().value;

        while(next_info && next_info[0] < range[1]) {
            const measure_info = createMeasureInfo(curr_info[1][0], curr_info[0], curr_info[1][1]);
            for(let idx = curr_info[1][0]; idx < next_info[1][0]; ++idx) {
                yield [measure_info.pulse, measure_info];

                ++measure_info.idx;
                measure_info.pulse += measure_info.length;
            }

            curr_info = next_info;
            next_info = it.next().value;
        }

        const measure_info = createMeasureInfo(curr_info[1][0], curr_info[0], curr_info[1][1]);
        while(measure_info.pulse < range[1]) {
            yield [measure_info.pulse, measure_info];
            ++measure_info.idx;
            measure_info.pulse += measure_info.length;
        }
    }

    /**
     * Converts an iterator of `[Pulse, ...]` into `[TimingInfo, ...]`.
     * 
     * **WARNING**: since `TimingInfo` is reused for all iterations, be sure to copy it (`{...timing_object}` is enough) if you have to keep the information.
     * 
     * @param it An iterator for a pair of `Pulse` and any object
     * @yields {[TimingInfo, T]} `it` but `Pulse` replaced with the timing info
     */
    *withTimingInfo<T>(it: IterableIterator<[Pulse, T]>): Generator<[Readonly<TimingInfo>, T]> {
        let iterators: TimingIterators|null = null;
        let curr_status: TimingStatus|null = null;
        let next_status: Partial<TimingStatus> = {};

        let measure_info: MeasureInfo|null = null;
        const createMeasureInfoFromCurrStatus = (): MeasureInfo => {
            if(curr_status == null) throw new Error(`Invalid internal state while initializing measure info`);
            else return createMeasureInfo(curr_status.time_sig[1][0], curr_status.time_sig[0], curr_status.time_sig[1][1]);
        };
        
        let time_divider = 120 * Number(PULSES_PER_WHOLE);
        for(const [pulse, data] of it) {
            if(iterators == null) {
                const prev_bpm_pulse = this.bpm_by_pulse.nextLowerKey(pulse + 1n);
                const prev_time_sig_pulse = this.time_sig_by_pulse.nextLowerKey(pulse + 1n);

                if(prev_bpm_pulse == null || prev_time_sig_pulse == null) {
                    throw new Error(`Invalid initial state at pulse: ${pulse}!`);
                }

                iterators = {
                    bpm: this.bpm_by_pulse.entries(prev_bpm_pulse),
                    time_sig: this.time_sig_by_pulse.entries(prev_time_sig_pulse),
                };

                curr_status = {
                    bpm: iterators.bpm.next().value,
                    time_sig: iterators.time_sig.next().value,
                };

                next_status = {
                    bpm: iterators.bpm.next().value,
                    time_sig: iterators.time_sig.next().value,
                };

                time_divider = curr_status.bpm[1].bpm * Number(PULSES_PER_WHOLE);
                measure_info = createMeasureInfoFromCurrStatus();
            }

            if(iterators == null || curr_status == null || measure_info == null) {
                throw new Error(`Invalid internal state at pulse ${pulse}!`);
            }

            while(next_status.bpm && next_status.bpm[0] <= pulse) {
                curr_status.bpm = next_status.bpm;
                next_status.bpm = iterators.bpm.next().value;
                
                time_divider = curr_status.bpm[1].bpm * Number(PULSES_PER_WHOLE);
            }

            while(next_status.time_sig && next_status.time_sig[0] <= pulse) {
                curr_status.time_sig = next_status.time_sig;
                measure_info = createMeasureInfoFromCurrStatus();
                next_status.time_sig = iterators.time_sig.next().value;
            }

            updateMeasureInfo(measure_info, pulse);

            yield [{
                pulse,
                time: curr_status.bpm[1].time + Number(240_000n * (pulse - curr_status.bpm[0]))/time_divider,
                bpm: curr_status.bpm[1].bpm,
                measure: measure_info,
            }, data];
        }
    }

    /** Get the {@link MeasureInfo} from its index. */
    getMeasureInfoByIdx(measure_idx: MeasureIdx): MeasureInfo {
        let pair = this.time_sig_by_idx.nextLowerPair(measure_idx + 1n);
        if(!pair) {
            pair = this.time_sig_by_idx.entries().next().value;

            if(!pair) throw new Error(`Invalid internal state`);
        }

        const measure_info = createMeasureInfo(pair[0], pair[1][0], pair[1][1]);
        measure_info.pulse += measure_info.length * (measure_idx - measure_info.idx);
        measure_info.idx = measure_idx;

        return measure_info;
    }

    /** Get the {@link MeasureInfo} from a pulse. */
    getMeasureInfoByPulse(pulse: Pulse): MeasureInfo {
        let pair = this.time_sig_by_pulse.nextLowerPair(pulse + 1n);
        if(!pair) {
            pair = this.time_sig_by_pulse.entries().next().value;
            if(!pair) throw new Error(`Invalid internal state`);
        }

        const measure_info = createMeasureInfo(pair[1][0], pair[0], pair[1][1]);
        updateMeasureInfo(measure_info, pulse);

        return measure_info;
    }

    /** Convert the given pulse to time (in milliseconds). */
    getTimeByPulse(pulse: Pulse): number {
        let pair = this.bpm_by_pulse.nextLowerPair(pulse + 1n);
        if(!pair) {
            pair = this.bpm_by_pulse.entries().next().value;
            if(!pair) throw new Error(`Invalid internal state`);
        }

        return pair[1].time + Number(240_000n * (pulse - pair[0])) / (pair[1].bpm * Number(PULSES_PER_WHOLE));
    }

    toString(): string {
        return `[Timing with ${this.bpm_by_pulse.size} bpm and ${this.time_sig_by_pulse.size} time_sig]`;
    }
}