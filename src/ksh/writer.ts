import {
    toLaserChar,
    Chart,
    Line, BarLine, CommentLine, OptionLine, ChartLine, AudioEffectLine, UnknownLine,
    LaneSpin,
} from "./types.js";

/**
 * A class for writing KSH chart data
 */
export default class Writer {
    static serializeLaneSpin(spin: LaneSpin): string {
        let spin_head = '';
        switch(`${spin.type}${spin.direction < 0 ? '<' : '>'}`) {
            case "normal<": spin_head = '@('; break;
            case "normal>": spin_head = '@)'; break;
            case "half<": spin_head = '@<'; break;
            case "half>": spin_head = '@>'; break;
            case "swing<": spin_head = 'S<'; break;
            case "swing>": spin_head = 'S>'; break;
        }
        if(spin.type === 'swing') {
            return `${spin_head}${spin.length};${spin.amplitude};${spin.repeat};${spin.decay}`;
        } else {
            return `${spin_head}${spin.length}`;
        }
    }
    static serializeLine(line: BarLine): string;
    static serializeLine(line: CommentLine): string;
    static serializeLine(line: OptionLine): string;
    static serializeLine(line: ChartLine): string;
    static serializeLine(line: UnknownLine): string;
    static serializeLine(line: AudioEffectLine): string;
    static serializeLine(line: Line): string {
        switch(line.type) {
            case 'bar': return "--";
            case 'comment': return `//${line.value}`;
            case 'option': return `${line.name}=${line.value}`;
            case 'chart': {
                const bt = line.bt ? line.bt.map((x) => "012"[x]).join('') : "0000";
                const fx = line.fx ? line.fx.map((x) => "021"[x]).join('') : "00";
                const laser = line.laser ? line.laser.map(toLaserChar).join('') : "--";
                const spin = line.spin ? Writer.serializeLaneSpin(line.spin) : '';
                return `${bt}|${fx}|${laser}${spin}`;
            }
            case 'unknown': return `${line.value}`;
            case 'define_fx': case 'define_filter':
                return `#${line.type} ${line.name} ${line.params.map(([name, value]) => `${name}=${value}`).join(';')}`;
        }
    }

    static serialize(chart: Readonly<Chart>): string {
        const lines: string[] = [];

        for(const option of chart.header) {
            lines.push(Writer.serializeLine(option));
        }

        for(const unknown of chart.unknown.header) {
            lines.push(Writer.serializeLine(unknown));
        }

        lines.push('--');

        for(const measure of chart.measures) {
            for(const line of measure.lines) {
                if(line.options) for(const option of line.options) {
                    lines.push(Writer.serializeLine(option));
                }

                lines.push(Writer.serializeLine({
                    type: 'chart',
                    bt: line.bt, fx: line.fx, laser: line.laser, spin: line.spin
                }));
            }
            lines.push('--');
        }

        for(const audio_effect of chart.audio_effects) {
            lines.push(Writer.serializeLine(audio_effect));
        }

        return lines.join('\n');
    }
}