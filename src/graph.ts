import type { GraphValue, GraphCurveValue, GraphPoint } from "./kson/index.js";
import { SortedList } from "./sorted-list.js";

export class Graph extends SortedList<GraphPoint> {}