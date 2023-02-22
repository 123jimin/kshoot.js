import { z } from 'zod';

import type {JSONObject, JSONValue} from "../util.js";
import * as kson from "../kson/index.js";

import type {Chart} from "./chart.js";

function isDefault<T extends z.ZodTypeAny>(schema: T, object: z.output<T>): boolean {
    return false;
}

function exportObject<T extends z.ZodTypeAny>(schema: T, object: z.output<T>): JSONValue {
    throw new Error("Not yet implemented!");
}

export default function(chart: Chart): JSONObject {
    return exportObject(kson.schema.Chart, chart.raw) as JSONObject;
}