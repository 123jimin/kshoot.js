export class Chart {
    constructor() {}

    /**
     * Reads the given KSH chart.
     * @param chart_str a string representing the chart (with or without the BOM)
     * @returns parsed chart data
     * @throws when the given string represents an invalid KSH chart
     */
    static parseKSH(chart_str: string): Chart {
        return new Chart();
    }

    /**
     * Reads the given KSON chart.
     * @param chart_obj a string or an object representing the chart file
     * @returns parsed chart data
     * @throws when the given argument represents an invalid KSON chart 
     */
    static parseKSON(chart_obj: string|object): Chart {
        return new Chart();
    }
};