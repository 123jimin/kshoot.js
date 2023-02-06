import {
    toLaserChar,
    Line, BarLine, CommentLine, OptionLine, ChartLine, AudioEffectLine, UnknownLine, 
} from "./type.js";

/**
 * A class for writing KSH chart data
 */
export default class Writer {
    static serialize(line: BarLine): string;
    static serialize(line: CommentLine): string;
    static serialize(line: OptionLine): string;
    static serialize(line: ChartLine): string;
    static serialize(line: UnknownLine): string;
    static serialize(line: AudioEffectLine): string;
    static serialize(line: Line): string {
        switch(line.type) {
            case 'bar': return "--";
            case 'comment': return `//${line.value}`;
            case 'option': return `${line.name}=${line.value}`;
            case 'chart': {
                const bt = line.bt.map((x) => "012"[x]).join('');
                const fx = line.fx.map((x) => "021"[x]).join('');
                const laser = line.laser.map(toLaserChar).join('');
                return `${bt}|${fx}|${laser}`;
            }
            case 'unknown': return `${line.value}`;
            case 'define_fx': case 'define_filter':
                return `#${line.type} ${line.name} ${line.params.map(([name, value]) => `${name}=${value}`).join(';')}`;
        }
    }
}