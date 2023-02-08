import {
    toLaserChar,
    Line, BarLine, CommentLine, OptionLine, ChartLine, AudioEffectLine, UnknownLine,
    LaneSpin,
} from "./types.js";

/**
 * A class for writing KSH chart data
 */
export default class Writer {
    static serializeLaneSpin(spin: LaneSpin): string {
         // TODO: serialize spin
         return '';
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
                const bt = line.bt.map((x) => "012"[x]).join('');
                const fx = line.fx.map((x) => "021"[x]).join('');
                const laser = line.laser.map(toLaserChar).join('');
                const spin = line.spin ? Writer.serializeLaneSpin(line.spin) : '';
                return `${bt}|${fx}|${laser}${spin}`;
            }
            case 'unknown': return `${line.value}`;
            case 'define_fx': case 'define_filter':
                return `#${line.type} ${line.name} ${line.params.map(([name, value]) => `${name}=${value}`).join(';')}`;
        }
    }
}