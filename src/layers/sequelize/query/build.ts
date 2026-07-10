import { ConvertersBuild, Query, EntityQueryable } from "../../../types/entity/Query"
import { EntityBase } from "../../../types/entity/Root"
import { FindOptions, Model, InferAttributes, InferCreationAttributes } from "sequelize"
import { QueryEntityAttributeValidator } from "../../../types/entity/Query"


export default function sequelizeConvertersBuild<E extends EntityBase, T extends Model<InferAttributes<T>, InferCreationAttributes<T>>, F extends FindOptions<InferAttributes<T>> = FindOptions<InferAttributes<T>>>(): ConvertersBuild<E, F> {
    return {
        baseAttributes: {
            string: <K extends keyof EntityQueryable<E>>(
                value: Query<E>[K], 
                attribute: K, 
                formated: F,
                validate: QueryEntityAttributeValidator<E>
            ): F => {
                return formated
            },
            //
            //number: <K extends keyof EntityQueryable<E>, F>(
            //    value: Query<E>[K], 
            //    attribute: K, 
            //    formated: F,
            //    validate?: QueryEntityAttributeValidator<E>
            //): F => {
            //    return formated
            //},
            //
            //date: <K extends keyof EntityQueryable<E>, F>(
            //    value: Query<E>[K], 
            //    attribute: K, 
            //    formated: F,
            //    validate?: QueryEntityAttributeValidator<E>
            //): F => {
            //    return formated
            //},
            //
            //boolean: <K extends keyof EntityQueryable<E>, F>(
            //    value: Query<E>[K], 
            //    attribute: K, 
            //    formated: F,
            //    validate?: QueryEntityAttributeValidator<E>
            //): F => {
            //    return formated
            //}
        }
    }
}
