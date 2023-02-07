export * from "./types.js";
export {default as Reader} from "./reader.js";
export {default as Writer} from "./writer.js";

import {default as Reader} from "./reader.js";

/**
 * Parses the given KSH chart. This function is the alias for {@link Reader.parse `ksh.Reader.parse`}.
 * 
 * This function only handles parsing, and the result object(`Chart`) contains
 * minimal information (measure/tick information) required to understand the chart.
 * 
 * In specific, other than `beat`, no option will be processed and metadata must be processed later.
 * Also, zoom values, lasers, and long notes are not processed further.
 * 
 * @param chart_str a string representing the chart (with or without the BOM)
 * @returns parsed data
 * @throws when the chart is malformed
 */
export const parse = (x: string) => Reader.parse(x);