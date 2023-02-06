import { BarLine, CommentLine, OptionLine, ChartLine, AudioEffectLine, UnknownLine } from "./type.js";
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
}
