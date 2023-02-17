import type {
    Chart, Timing,
} from "../../chart/index.js";

export * from "./button.js";
import {getButtonOnlyStat} from "./button.js";
import type {ButtonOnlyStat} from "./button.js";

export * from "./laser.js";
import {getLaserStat} from "./laser.js";
import type {LaserOnlyStat, OneHandStat} from "./laser.js";

interface BeatStat {
    bpm_changes: number;
    min_bpm: number;
    max_bpm: number;
    bpm_differences: number;
    bpm_inverse_differences: number;
}

export interface Stat extends ButtonOnlyStat, LaserOnlyStat, OneHandStat, BeatStat {}

export function getBeatStat(chart: Chart, timing: Timing): BeatStat {
    const stat: BeatStat = {
        bpm_changes: 0,
        min_bpm: 0, max_bpm: 0,
        bpm_differences: 0,
        bpm_inverse_differences: 0,
    };

    const [chart_begin, chart_end] = [chart.getFirstNotePulse(), chart.getLastNotePulse()];

    const prev_bpm_pair = timing.bpm_by_pulse.nextLowerPair(chart_begin);
    let prev_bpm = 0;
    if(prev_bpm_pair) {
        stat.min_bpm = stat.max_bpm = prev_bpm = prev_bpm_pair[1].bpm;
    }
    
    for(const [pulse, bpm_info] of timing.bpm_by_pulse.entries(chart_begin)) {
        if(pulse >= chart_end) break;

        if(pulse > 0 && prev_bpm > 0) {
            stat.bpm_differences += Math.abs(bpm_info.bpm - prev_bpm);
            stat.bpm_inverse_differences += Math.abs(1/bpm_info.bpm - 1/prev_bpm);
            ++stat.bpm_changes;
        }

        prev_bpm = bpm_info.bpm;

        if(stat.min_bpm === 0 || bpm_info.bpm < stat.min_bpm) {
            stat.min_bpm = bpm_info.bpm;
        }

        if(stat.max_bpm === 0 || stat.max_bpm < bpm_info.bpm) {
            stat.max_bpm = bpm_info.bpm;
        }
    }

    return stat;
}

export function getStat(chart: Chart, timing?: Timing): Stat {
    if(!timing) timing = chart.getTiming();
    const stat: Stat = {
        ...getButtonOnlyStat(chart, timing),
        ...getLaserStat(chart, timing),
        ...getBeatStat(chart, timing),
    }

    return stat;
}