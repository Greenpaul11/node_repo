import { DatabaseAttributeTypes } from "../types/entity/Metadata.js";
import { AttributeTypes } from "../types/entity/Root.js";

export const toAttributeTypes: Record<DatabaseAttributeTypes, AttributeTypes> = {
    string: 'string',

    number: 'number',
    decimal: 'decimal',

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