import { Model, InferAttributes, InferCreationAttributes, ModelStatic } from "sequelize"


export type ResolveManager<T> =
    T extends Model<InferAttributes<any>, InferCreationAttributes<any>>
        ? ModelStatic<T>
        : unknown
        
        
        