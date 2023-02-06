// Note that the schema accepts a superset of the KSON spec (i.e. Schema.Kson accepts every valid KSON chart as long as values are sensible),
// but the type type is a strict subset of the spec (i.e. Kson.Type is a strict subset of the KSON spec).
export * from "./type.js";
export * as Schema from "./schema.js";
