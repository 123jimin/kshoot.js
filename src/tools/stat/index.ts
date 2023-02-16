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
    bpm_change_intensity: number;
}

export interface Stat extends ButtonOnlyStat, LaserOnlyStat, OneHandStat, BeatStat {}

export function getBeatStat(chart: Chart, timing: Timing): BeatStat {
    const stat: BeatStat = {
        bpm_changes: 0,
        bpm_change_intensity: 0,
    };

    const [chart_begin, chart_end] = [chart.getFirstNotePulse(), chart.getLastNotePulse()];

    const prev_bpm_pair = timing.bpm_by_pulse.nextLowerPair(chart_begin);
    let prev_bpm = 0;
    if(prev_bpm_pair) {
        prev_bpm = prev_bpm_pair[1].bpm;
    }
    
    for(const [pulse, bpm_info] of timing.bpm_by_pulse.entries(chart_begin)) {
        if(pulse >= chart_end) break;

        if(pulse > 0 && prev_bpm > 0) {
            stat.bpm_change_intensity += Math.abs(bpm_info.bpm - prev_bpm);
            ++stat.bpm_changes;
        }

        prev_bpm = bpm_info.bpm;
    }

    return stat;
}

export function getStat(chart: Chart, timing?: Timing): Stat {
    if(!timing) timing = chart.getTiming();
    const stat: Stat = {
        ...getButtonOnlyStat(chart, timing),
        ...getLaserStat(chart),
        ...getBeatStat(chart, timing),
    }

    return stat;
}