import { Model, InferAttributes, InferCreationAttributes, ModelStatic } from "sequelize"
import { OrmName, OrmOptions } from "../Registry.js"

export type ResolveManager<T> =
    T extends Model<InferAttributes<any>, InferCreationAttributes<any>>
        ? ModelStatic<T>
        : unknown
        
        
export type ManagerMetadata<T> =
    T extends ModelStatic<any>
        ? ManagerMetadataSequelize
        : unknown

export type ManagerMetadataSequelize = {
    name: string
}

/**
* Represents an ORM detection strategy.
*
* Each detector is responsible for identifying whether a given
* connection instance belongs to a specific ORM implementation.
*
* The `matches` function should return `true` when the provided
* connection object is recognized as the ORM associated with `name`.
*/
export type OrmDetector = {
    name: OrmName;
    matches: (connection: OrmOptions) => boolean;
};