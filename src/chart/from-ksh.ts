import {z} from 'zod';

import * as ksh from "../ksh/index.js";
import * as kson from "../kson/index.js";
import { Chart } from "./chart.js";
import { type Rest, camelToSnake } from "../util.js";

const PULSE_MULTIPLIER = kson.PULSES_PER_WHOLE / ksh.PULSES_PER_WHOLE;
const LASER_SLAM_PULSES_MAX = PULSE_MULTIPLIER * ksh.LASER_SLAM_PULSES_MAX;

type ConvertedChart = Chart & { compat: kson.CompatInfo };

const schema = Object.freeze({
    difficulty: z.union([z.enum(['light', 'challenge', 'extended', 'infinite']).transform((v) => ksh.difficultyToInt(v)), z.string()]),
    level: z.coerce.number().int().min(1).max(20).catch(1),
    bpm: z.coerce.number().finite().positive().default(120),
    curve_value: z.tuple([z.coerce.number().finite().min(0).max(1).default(0), z.coerce.number().finite().min(0).max(1).default(0)]),
    zoom_value: z.coerce.number().finite(),
    media_offset: z.coerce.number().finite().default(0),
    audio_volume: z.coerce.number().finite().nonnegative().default(100),
    gauge_total: z.coerce.number().finite().nonnegative().default(0),
} as const);

const versionToNumber = (ver: string): number => {
    ver = ver.trim();
    if(ver === "") return 0;
    const match = ver.match(/^(\d+)(\D*)$/);
    if(match == null) return 0;

    const ver_int = parseInt(match[1]);
    return ver_int + (match[2] ? 0.5 : 0);
};

const convertAudioEffectType = (type_str: string): string => {
    type_str = type_str.trim();
    switch(type_str.toLowerCase()) {
        case 'bitcrusher': return 'bitcrusher';
        case 'tapestop': return 'tapestop';
        case 'sidechain': return 'sidechain';
        default: return camelToSnake(type_str);
    }
};

const convertAudioEffectParamName = (param_name: string): string => {
    param_name = param_name.trim();
    switch(param_name.toLowerCase()) {
        case 'fileName': return 'filename';
        case 'volume': return 'vol';
        case 'lofreq': return 'freq_1';
        case 'hifreq': return 'freq_2';
        default: return camelToSnake(param_name);
    }
};

// Values from m4saka/libkson, MIT license
const TILT_SCALE_VALUES = Object.freeze({
    normal: 1.0,
    bigger: 1.75,
    biggest: 2.5,
    keep_normal: 1.0,
    keep_bigger: 1.75,
    keep_biggest: 2.5,
    zero: 0.0,
    big: 1.75,
    keep: 1.75,
} as const);

class Converter {
    private readonly _ksh_ver: number;
    readonly ksh_chart: ksh.Chart;
    chart: ConvertedChart;

    constructor(ksh_chart: Readonly<ksh.Chart>) {
        this._ksh_ver = versionToNumber(ksh_chart.version);
        this.ksh_chart = ksh_chart;
        this.chart = new Chart(kson.schema.Kson.parse({
            compat: kson.schema.CompatInfo.parse({}),
        })) as ConvertedChart;
    
        this._convertUnknown();
        this._convertHeader();
        this._convertMeasures();
        this._convertAudioEffects();
        this._convertComments();
    }

    private _convertUnknown(): void {
        const ksh_unknown = this.ksh_chart.unknown;
        const kson_unknown = this.chart.compat.ksh_unknown;
        for(const {name, value} of ksh_unknown.header) {
            kson_unknown.meta[name] = value;
        }
        for(const [pulse, line] of ksh_unknown.body) {
            switch(line.type) {
                case 'option':
                    if(line.name in kson_unknown.option) kson_unknown.option[line.name].push([pulse, line.value]);
                    else kson_unknown.option[line.name] = [[pulse, line.value]];
                    break;
                case 'unknown':
                    kson_unknown.line.push([pulse, line.value]);
                    break;
            }
        }
    }

    private _convertHeader(): void {
        const options = this.ksh_chart.header;
        const meta = this.chart.meta;
        for(const {name, value} of options) {
            switch(name) {
                case 'title':  meta.title = value; break;
                case 'title_img': meta.title_img_filename = value; break;
                case 'artist': meta.artist = value; break;
                case 'artist_img': meta.artist_img_filename = value; break;
                case 'effect': meta.chart_author = value; break;
                case 'jacket': meta.jacket_filename = value; break;
                case 'illustrator': meta.jacket_author = value; break;
                case 'difficulty': meta.difficulty = schema.difficulty.parse(value); break;
                case 'level': meta.level = schema.level.parse(value); break;
                case 't':
                    try {
                        const bpm = schema.bpm.parse(value);
                        this.chart.setBPM(0n, bpm);
                    } catch(_) { /* empty */ }
                    meta.disp_bpm = value;
                    break;
                case 'to':
                    if(value.trim() !== '0') try {
                        const bpm = schema.bpm.parse(value);
                        meta.std_bpm = bpm;
                    } catch(_) { /* empty */ }
                    break;
                case 'beat': {
                    const [numerator, denominator] = value.split('/').map((v) => parseInt(v));
                    this.chart.setTimeSignature(0n, numerator, denominator);
                    break;
                }
                case 'm': 
                    if(value.includes(';')) {
                        const arr = value.split(';');
                        this.chart.audio.bgm.filename = arr[0];
                        this.chart.audio.bgm.legacy = {
                            fp_filenames: arr.slice(1),
                        };
                    } else {
                        this.chart.audio.bgm.filename = value;
                    }
                    break;
                case 'mvol': this.chart.audio.bgm.vol = schema.audio_volume.parse(value)*(this._ksh_ver >= 120 ? 1.0 : 0.6)/100; break;
                case 'o': this.chart.audio.bgm.offset = schema.media_offset.parse(value); break;
                case 'bg': {
                    const bg = this.chart.bg;
                    const bg_legacy = bg.legacy ?? (bg.legacy = kson.schema.LegacyBGInfo.parse({}));
                    bg_legacy.bg = kson.schema.KSHBGInfoPair.parse(value.split(';').map((filename) => ({filename})));
                    break;
                }
                case 'layer': {
                    const bg = this.chart.bg;
                    const bg_legacy = bg.legacy ?? (bg.legacy = kson.schema.LegacyBGInfo.parse({}));
                    const value_arr = value.split(this._ksh_ver >= 167 ? ';' : '/');
                    const value_obj: {filename?: string, duration?: string, rotation?: {tilt: boolean, spin: boolean}} = {};
                    if(value_arr.length >= 1) {
                        value_obj.filename = value_arr[0];
                    }
                    if(value_arr.length >= 2) {
                        if(Number.isFinite(parseInt(value_arr[1]))) {
                            value_obj.duration = value_arr[1];
                        }
                    }
                    if(value_arr.length >= 3) {
                        const rotation_flag = parseInt(value_arr[2]);
                        if(Number.isSafeInteger(rotation_flag)) {
                            value_obj.rotation = {tilt: !!(rotation_flag & 1), spin: !!(rotation_flag & 2)};
                        }
                    }
                    bg_legacy.layer = kson.schema.KSHLayerInfo.parse(value_obj);
                    break;
                }
                case 'po': this.chart.audio.bgm.preview.offset = schema.media_offset.parse(value); break;
                case 'plength': this.chart.audio.bgm.preview.duration = schema.media_offset.parse(value); break;
                case 'total': this.chart.gauge.total = schema.gauge_total.parse(value); break;
                case 'chokkakuvol': break; // TODO
                case 'chokkakuautovol': {
                    const audio = this.chart.audio;
                    const key_sound = audio.key_sound ?? (audio.key_sound = kson.schema.KeySoundInfo.parse({}));
                    const laser = key_sound.laser ?? (key_sound.laser = kson.schema.KeySoundLaserInfo.parse({}));
                    const legacy = laser.legacy ?? (laser.legacy = kson.schema.KeySoundLaserLegacyInfo.parse({}));
                    legacy.vol_auto = !!parseInt(value);
                    break;
                }
                case 'filtertype': break; // TODO
                case 'pfiltergain': break; // TODO
                case 'pfilterdelay': break; // TODO
                case 'v':
                case 'vo': {
                    const bg = this.chart.bg;
                    const bg_legacy = bg.legacy ?? (bg.legacy = kson.schema.LegacyBGInfo.parse({}));
                    const bg_legacy_movie = bg_legacy.movie ?? (bg_legacy.movie = kson.schema.KSHMovieInfo.parse({}));
                    switch(name) {
                        case 'v': bg_legacy_movie.filename = value; break;
                        case 'vo': bg_legacy_movie.offset = schema.media_offset.parse(value); break;
                    }
                    break;
                }
                case 'ver': this.chart.compat.ksh_version = value; break;
                case 'information': meta.information = value; break;
                default:
                    this.chart.compat.ksh_unknown.meta[name] = value;
            }
        }
    }

    private _convertMeasures(): void {
        let curr_time_sig: [number, number] = [4, 4];
        for(const [_, time_sig] of this.chart.beat.time_sig) {
            curr_time_sig = time_sig; break;
        }

        type LastNote = kson.ButtonNote|null;
        const last_notes: [LastNote, LastNote, LastNote, LastNote, LastNote, LastNote] = [null, null, null, null, null, null];
        
        type LastLaserSection = ReturnType<typeof kson.schema.LaserSection.parse>|null;
        const last_lasers: [LastLaserSection, LastLaserSection] = [null, null];

        let measure_idx = 0n;
        for(const measure of this.ksh_chart.measures) {
            if(curr_time_sig[0] !== measure.time_signature[0] || curr_time_sig[1] !== measure.time_signature[1]) {
                curr_time_sig = measure.time_signature;
                this.chart.setTimeSignature(measure_idx, ...curr_time_sig);
            }

            let pulse = measure.pulse * PULSE_MULTIPLIER;
            const pulses_per_line = (measure.length * PULSE_MULTIPLIER) / BigInt(measure.lines.length);

            for(const measure_line of measure.lines) {
                const options: Record<string, string> = {};
                if(measure_line.options) for(const option of measure_line.options) {
                    options[option.name] = option.value;

                    switch(option.name) {
                        case 't': {
                            const bpm = schema.bpm.parse(option.value);
                            this.chart.setBPM(pulse, bpm);
                            break;
                        }
                        case 'beat': break; // already handled
                        case 'chokkakuvol': break; // TODO
                        case 'chokkakuse': break; // TODO
                        case 'pfiltergain': break; // TODO
                        case 'stop': break; // TODO
                        case 'tilt': this._addTilt(pulse, option.value); break;
                        case 'zoom_top': this._addCamGraphPoint('rotation_x', pulse, schema.zoom_value.parse(option.value)/100); break;
                        case 'zoom_bottom': this._addCamGraphPoint('zoom', pulse, schema.zoom_value.parse(option.value)/100); break;
                        case 'zoom_side': this._addCamGraphPoint('shift_x', pulse, schema.zoom_value.parse(option.value)/100); break;
                        case 'center_split': this._addCamGraphPoint('center_split', pulse, schema.zoom_value.parse(option.value)/100); break;
                        case 'laserrange_l': break; // will be handled in loop_laser
                        case 'laserrange_r': break; // will be handled in loop_laser
                        case 'fx-l': break; // TODO
                        case 'fx-r': break; // TODO
                        case 'fx-l_param1': break; // TODO
                        case 'fx-r_param1': break; // TODO
                        case 'fx-l_se': break; // TODO
                        case 'fx-r_se': break; // TODO
                        case 'filtertype': break; // TODO
                        // Deprecated and unknown parameters
                        case 'chiprate':
                        case 'longrate':
                        case 'laserrate':
                        default: {
                            const unknown_options = this.chart.compat.ksh_unknown.option;
                            if(option.name in unknown_options) unknown_options[option.name].push([pulse, option.value]);
                            else unknown_options[option.name] = [[pulse, option.value]]
                        }
                    }
                }

                loop_note: for(let i=0; i<6; ++i) {
                    const kind = i<4 ? (measure_line.bt ? measure_line.bt[i] : ksh.NoteKind.Empty) : (measure_line.fx ? measure_line.fx[i-4] : ksh.NoteKind.Empty);
                    const last_note = last_notes[i];
                    if(kind === ksh.NoteKind.Long && last_note && last_note[0] + last_note[1] >= pulse) {
                        last_note[1] = pulse + pulses_per_line - last_note[0];
                        continue loop_note;
                    }
                    
                    if(last_note != null) {
                        this.chart.addButtonNote(i, last_note);
                        last_notes[i] = null;
                    }

                    switch(kind) {
                        case ksh.NoteKind.Empty:
                            // Nothing
                            break;
                        case ksh.NoteKind.Short:
                            this.chart.addButtonNote(i, [pulse, 0n]);
                            break;
                        case ksh.NoteKind.Long:
                            last_notes[i] = [pulse, pulses_per_line];
                            break;
                    }
                }

                loop_laser: for(let i=0; i<2; ++i) {
                    const kind = (measure_line.laser ? measure_line.laser[i] : null);
                    let last_laser = last_lasers[i];

                    if(kind == null) {
                        last_lasers[i] = null;
                        continue loop_laser;
                    }

                    if(kind === ksh.LASER_CHAR_CONNECTION) {
                        continue loop_laser;
                    }

                    if(!last_laser) {
                        last_laser = last_lasers[i] = this.chart.addLaserSection(i, [
                            pulse, [], (options[`laserrange_${i === 0 ? 'l' : 'r'}`] === "2x" ? 2 : 1),
                        ]);
                    }

                    const pos = kind / ksh.LASER_POS_MAX;
                    const laser_sections = last_laser[1];

                    const last_laser_section: [kson.Pulse, Rest<kson.GraphSectionPoint>]|undefined = laser_sections.entriesReversed().next().value;
                    if(last_laser_section) {
                        // Handle slams
                        if(pulse - (last_laser_section[0] + last_laser[0]) <= LASER_SLAM_PULSES_MAX) {
                            last_laser_section[1][0][1] = pos;
                            continue loop_laser;
                        }
                    }

                    let curve: [number, number] = [0, 0];
                    const curve_opt = options[`lasercurve_${i === 0 ? 'l' : 'r'}`];
                    if(curve_opt) {
                        curve = schema.curve_value.parse(curve_opt.split(';'));
                    }

                    last_laser[1].put([pulse - last_laser[0], [pos, pos], curve]);
                }

                if(measure_line.spin) {
                    this._addSpin(pulse, measure_line.spin);
                }

                pulse += pulses_per_line;
            }

            ++measure_idx;
        }

        for(let i=0; i<6; ++i) {
            const last_note = last_notes[i];
            if(last_note != null) {
                this.chart.addButtonNote(i, last_note);
            }
        }
    }

    private _cam_graph_point_last_added: Partial<Record<keyof kson.CamGraphs, kson.GraphPoint>> = {};
    private _addCamGraphPoint(key: keyof kson.CamGraphs, pulse: kson.Pulse, value: number): void {
        const last_added = this._cam_graph_point_last_added[key];
        if(last_added != null && last_added[0] === pulse) {
            last_added[1][1] = value;
            return;
        }
        
        const new_point: kson.GraphPoint = [pulse, [value, value], [0, 0]];

        const cam_graph = this.chart.camera.cam.body[key];
        cam_graph.put(new_point);

        this._cam_graph_point_last_added[key] = new_point;
    }

    private _tilt_last_scale = 1.0;
    private _tilt_last_keep = false;
    private _tilt_last_manual: [kson.Pulse, z.output<typeof kson.schema.GraphSectionPointList>]|null = null;
    private _addTilt(pulse: kson.Pulse, str_value: string): void {
        const tilt = this.chart.camera.tilt;

        if(str_value in TILT_SCALE_VALUES) {
            this._tilt_last_manual = null;

            const curr_scale = TILT_SCALE_VALUES[str_value as keyof typeof TILT_SCALE_VALUES];
            if(curr_scale !== this._tilt_last_scale) {
                tilt.scale.put([pulse, curr_scale]);
                this._tilt_last_scale = curr_scale;
            }

            const curr_keep = str_value.startsWith('keep');
            if(curr_keep !== this._tilt_last_keep) {
                tilt.keep.put([pulse, curr_keep]);
                this._tilt_last_keep = curr_keep;
            }

            return;
        }

        const value = schema.zoom_value.parse(str_value);

        if(this._tilt_last_manual == null) {
            const tilt_manual_list = kson.schema.GraphSectionPointList.parse([[0n, [value, value]]]);
            tilt.manual.put([pulse, tilt_manual_list]);
            this._tilt_last_manual = [pulse, tilt_manual_list];
            return;
        }

        const [start_pulse, tilt_manual_list] = this._tilt_last_manual;
        if(tilt_manual_list.maxKey() === pulse - start_pulse) {
            const entry = tilt_manual_list.nextLowerPair(void 0);
            if(entry /* always exist */) {
                entry[1][0][1] = value;
            }
            return;
        }

        tilt_manual_list.put([pulse - start_pulse, [value, value], [0, 0]]);
    }

    private _addSpin(pulse: kson.Pulse, spin: ksh.LaneSpin): void {
        const cam = this.chart.camera.cam;
        const pattern = cam.pattern ?? (cam.pattern = kson.schema.CamPatternInfo.parse({}));
        const slam_event = pattern.laser.slam_event;

        switch(spin.type) {
            case 'normal':
                slam_event.spin.put([pulse, spin.direction, spin.length * PULSE_MULTIPLIER]);
                break;
            case 'half':
                slam_event.half_spin.put([pulse, spin.direction, spin.length * PULSE_MULTIPLIER]);
                break;
            case 'swing': {
                const swing_value: kson.CamPatternInvokeSwingValue = {scale: spin.amplitude/60, repeat: spin.repeat, decay_order: spin.decay};
                slam_event.swing.put([pulse, spin.direction, spin.length, swing_value]);
                break;
            }
        }
    }

    private _convertAudioEffects(): void {
        const audio_effect_info = this.chart.audio.audio_effect ?? (this.chart.audio.audio_effect = kson.schema.AudioEffectInfo.parse({}));
        for(const audio_effect of this.ksh_chart.audio_effects) {
            let defs: Record<string, kson.AudioEffectDef>|null = null;
            switch(audio_effect.type) {
                case 'define_fx':
                    defs = audio_effect_info.fx.def;
                    break;
                case 'define_filter':
                    defs = audio_effect_info.laser.def;
                    break;
            }
            if(defs == null) continue;

            const def: kson.AudioEffectDef = {
                type: "",
                v: {},
            };
            for(const [param_name, param_value] of audio_effect.params) {
                if(param_name === 'type') {
                    def.type = convertAudioEffectType(param_value);
                } else {
                    def.v[convertAudioEffectParamName(param_name)] = param_value;
                }
            }
            defs[audio_effect.name] = def;
        }
    }

    private _convertComments(): void {
        for(const [pulse, comment] of this.ksh_chart.comments) {
            this.chart.addComment(pulse * PULSE_MULTIPLIER, comment.value);
        }
    }
}
export default function(ksh_chart: ksh.Chart): ConvertedChart {
    return (new Converter(ksh_chart)).chart;
}