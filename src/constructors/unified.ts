import { DatabaseAttributeTypes } from "../types/entity/Metadata.js";
import { AttributeTypes } from "../types/entity/Root.js";

export const unifiedTypesToAttributeTypes: Record<DatabaseAttributeTypes, AttributeTypes> = {
    string: 'string',

    number: 'number',
    decimal: 'number',

    boolean: 'boolean',

    date: 'date',
    datetime: 'date',
    time: 'date',

    json: 'object',
    binary: 'object',
    array: 'object',
    enum: 'string',
    uuid: 'string',

    geometry: 'object',
    relation: 'object',
    unknown: 'object'
};

export const unifiedTypesToEntityInterfaceTypes: Record<DatabaseAttributeTypes, string> = {
    string: 'string',

    number: 'number',
    decimal: 'number',

    boolean: 'boolean',

    date: 'Date',
    datetime: 'Date',
    time: 'Date',

    json: 'object',
    binary: 'object',
    array: 'object',
    enum: 'string',
    uuid: 'string',

    geometry: 'object',
    relation: 'object',
    unknown: 'object'
};

export const sequelizeAttributeTypesToUnified: Record<string, DatabaseAttributeTypes> = {
    // strings
    STRING: "string",
    CHAR: "string",
    TEXT: "string",

    // numbers
    TINYINT: "number",
    SMALLINT: "number",
    MEDIUMINT: "number",
    INTEGER: "number",
    BIGINT: "number",
    FLOAT: "number",
    DOUBLE: "number",
    REAL: "number",

    // exact decimal numbers
    DECIMAL: "decimal",

    // boolean
    BOOLEAN: "boolean",

    // dates
    DATE: "datetime",
    DATEONLY: "date",
    TIME: "time",
    NOW: "datetime",

    // identifiers
    UUID: "uuid",
    UUIDV1: "uuid",
    UUIDV4: "uuid",

    // structured data
    JSONTYPE: "json",
    JSONB: "json",

    // binary data
    BLOB: "binary",

    // special types
    ENUM: "enum",
    ARRAY: "array",
    RANGE: "array",

    // spatial
    GEOMETRY: "geometry",
    GEOGRAPHY: "geometry"
};