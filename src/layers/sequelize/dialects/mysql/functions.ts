import type { Model, InferAttributes, InferCreationAttributes } from 'sequelize'
import type { EntityBase } from '../../../../types/entity/Root.js'
import type { Query } from '../../../../types/entity/Query.js'
import type { ConverterFunctions } from '../../../../types/entity/Converters.js'
import { OutputConverterBase } from '../../../../converters/output/base.js'
import { SequelizeEntity, SequelizeRawEntityNotGrouped } from '../../types.js'
import { mergeRowsIntoEntities } from '../../output/mergeRowsIntoEntities.js'
import { convertRow } from '../../../../converters/output/convertRow.js'


export default function extract<
    E extends EntityBase,
    T extends Model<InferAttributes<T>, InferCreationAttributes<T>>
>(): ConverterFunctions<E, T, OutputConverterBase<E, T>> {
    return {
        asEntity(this: OutputConverterBase<E, T>, row: T | null, query: Query<E> = {}) {
            if (!row) return null
            const mappedSelect = this.mapSelects(query)
            const sequelizRow = row.toJSON() as unknown as SequelizeEntity<E>
            return convertRow(sequelizRow, mappedSelect, this.converters['native']) 
        },
        asEntities(this: OutputConverterBase<E, T>, rows: T[], query: Query<E> = {}) {
            const rawRaws = rows as unknown as SequelizeRawEntityNotGrouped<E>[]
            const mappedSelect = this.mapSelects(query)
            const merged = mergeRowsIntoEntities(mappedSelect, this.relationTree, rawRaws)
            return merged.map((row) => convertRow(row, mappedSelect, this.converters['raw']))
        }
    }
}
