import type {
    Chart, Pulse, Timing,
    ButtonConduct,
} from "../../chart/index.js";

import {ButtonConductAction} from "../../chart/index.js";

import {PEAK_WINDOW} from "./common.js";

// 130BPM 16ths
const MAX_JACK_INTERVAL = 15_000 / 130;

export interface ButtonCountStat {
    /** \# of short notes */
    chips: number;
    /** \# of long notes */
    holds: number;
    /** \# of chains for long notes */
    hold_chains: number;
    /** `chips` + `holds` */
    buttons: number;
    /** `chips` + `hold_chains` */
    button_chains: number;

    jacks: number;
}

export type ButtonCountStatByLane = [ButtonCountStat, ButtonCountStat, ButtonCountStat, ButtonCountStat, ButtonCountStat, ButtonCountStat];

export function createButtonCountStat(): ButtonCountStat { return {chips: 0, holds: 0, hold_chains: 0, buttons: 0, button_chains: 0, jacks: 0}; }
export function createButtonCountStatByLane(): ButtonCountStatByLane { return ([0, 1, 2, 3, 4, 5] as const).map(() => createButtonCountStat()) as ButtonCountStatByLane; }

export interface ButtonOnlyStat extends ButtonCountStat {
    by_button_lane: ButtonCountStatByLane;
    /** max note density of chip/holds within `PEAK_WINDOW` milliseconds */
    peak_note_density: number;
    peak_note_density_range: [begin: Pulse, end: Pulse];
    peak_note_chain_density: number;
    peak_note_chain_density_range: [begin: Pulse, end: Pulse];
}

export function getButtonCountStats(chart: Chart, timing: Timing): ButtonCountStat & {by_button_lane: ButtonCountStatByLane} {
    const stat: ReturnType<typeof getButtonCountStats> = {
        ...createButtonCountStat(),
        by_button_lane: createButtonCountStatByLane(),
    };

    const addStat = (key: keyof ButtonCountStat, lane: number, value: number): void => {
        stat[key] += value;
        stat.by_button_lane[lane][key] += value;
    };

    const front_note_time = [0, 0, 0, 0, 0, 0];
    const front_note_jack_count = [0, 0, 0, 0, 0, 0];

    for(const [timing_info, button_notes] of timing.withTimingInfo(chart.buttonNotes())) {
        for(const note of button_notes) {
            if(note.length === 0n) {
                addStat('chips', note.lane, 1);
                addStat('buttons', note.lane, 1);
                addStat('button_chains', note.lane, 1);
            } else {
                const chains = chart.getChains([timing_info.pulse, timing_info.pulse + note.length]);

                addStat('holds', note.lane, 1);
                addStat('buttons', note.lane, 1);
                addStat('hold_chains', note.lane, chains);
                addStat('button_chains', note.lane, chains);
            }
            
            if(front_note_jack_count[note.lane] === 0) {
                front_note_jack_count[note.lane] = 1;
            } else if(front_note_time[note.lane] + MAX_JACK_INTERVAL <= timing_info.time) {
                front_note_jack_count[note.lane] = 1;
            } else {
                const jack_count = ++front_note_jack_count[note.lane];
                if(jack_count === 3) {
                    addStat('jacks', note.lane, 3);
                } else if(jack_count > 3) {
                    addStat('jacks', note.lane, 1);
                }
            }

            front_note_time[note.lane] = timing_info.time;
        }
    }

    return stat;
}

export function getButtonOnlyStat(chart: Chart, timing: Timing): ButtonOnlyStat {
    const stat: ButtonOnlyStat = {
        ...getButtonCountStats(chart, timing),
        peak_note_density: 0, peak_note_density_range: [0n, 0n],
        peak_note_chain_density: 0, peak_note_chain_density_range: [0n, 0n],
    };

    const conduct_history: [time: number, pulse: Pulse, conducts: ButtonConduct[]][] = [];
    let window_begin_ind = 0;

    const hold_ends: [Pulse, Pulse, Pulse, Pulse, Pulse, Pulse] = [-1n, -1n, -1n, -1n, -1n, -1n];
    const hold_starts: [Pulse, Pulse, Pulse, Pulse, Pulse, Pulse] = [-1n, -1n, -1n, -1n, -1n, -1n];
    
    let curr_chips = 0;
    let curr_holds = 0;
    let curr_hold_chains = 0;
    
    let window_begin_pulse = 0n;

    for(const [timing_info, conducts] of timing.withTimingInfo(chart.buttonConducts())) {
        while(window_begin_ind < conduct_history.length && conduct_history[window_begin_ind][0] + PEAK_WINDOW < timing_info.time) {
            for(const discarded_conduct of conduct_history[window_begin_ind][2]) {
                switch(discarded_conduct.action) {
                    case ButtonConductAction.Chip:
                        --curr_chips;
                        break;
                    case ButtonConductAction.HoldStart:
                        curr_hold_chains -= timing.getChains([window_begin_pulse, window_begin_pulse + discarded_conduct.length]);
                        hold_ends[discarded_conduct.lane] = window_begin_pulse + discarded_conduct.length;
                        break;
                    case ButtonConductAction.HoldEnd:
                        hold_ends[discarded_conduct.lane] = -1n;
                        --curr_holds;
                        break;
                }
            }
            
            ++window_begin_ind;
            window_begin_pulse = window_begin_ind < conduct_history.length ? conduct_history[window_begin_ind][1] : timing_info.pulse;
        }

        for(const new_conduct of conducts) {
            switch(new_conduct.action) {
                case ButtonConductAction.Chip:
                    ++curr_chips;
                    break;
                case ButtonConductAction.HoldStart:
                    hold_starts[new_conduct.lane] = timing_info.pulse;
                    ++curr_holds;
                    break;
                case ButtonConductAction.HoldEnd:
                    curr_hold_chains += timing.getChains([hold_starts[new_conduct.lane], timing_info.pulse]);
                    hold_starts[new_conduct.lane] = -1n;
                    break;
            }
        }

        conduct_history.push([timing_info.time, timing_info.pulse, conducts]);

        if(stat.peak_note_density < curr_chips + curr_holds) {
            stat.peak_note_density = curr_chips + curr_holds;
            stat.peak_note_density_range = [window_begin_pulse, timing_info.pulse];
        }

        let curr_partial_chains = 0;
        for(const hold_end_tick of hold_ends) {
            if(hold_end_tick > timing_info.pulse) continue; // this hold is also included in hold_starts
            if(hold_end_tick >= window_begin_pulse) curr_partial_chains += timing.getChains([window_begin_pulse, hold_end_tick]);
        }
        for(let hold_start_tick of hold_starts) {
            if(hold_start_tick < 0n) continue;
            if(hold_start_tick < window_begin_pulse) hold_start_tick = window_begin_pulse;
            curr_partial_chains += timing.getChains([hold_start_tick, timing_info.pulse]);
        }

        const curr_chains = curr_chips + curr_hold_chains + curr_partial_chains;
        if(stat.peak_note_chain_density < curr_chains) {
            stat.peak_note_chain_density = curr_chains;
            stat.peak_note_chain_density_range = [window_begin_pulse, timing_info.pulse];
        }
    }

    return stat;
}