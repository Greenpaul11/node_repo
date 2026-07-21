import type { Model, InferAttributes, InferCreationAttributes } from 'sequelize'
import type { EntityBase } from '../../../../types/entity/Root'
import type { Query } from '../../../../types/entity/Query'
import type { ConverterFunctions } from '../../../../types/entity/Converters'
import { OutputFormaterBase } from '../../../../formaters/output/outputFormaterBase'
import { SequelizeEntity, SequelizeRawEntity, SequelizeRawEntityNotGrouped } from '../../types'
import { mergeRowsIntoEntities } from '../../output/mergeRowsIntoEntities'
import { convertRow } from '../../../../formaters/output/convertRow'


export default function extract<
    E extends EntityBase,
    T extends Model<InferAttributes<T>, InferCreationAttributes<T>>
>(): ConverterFunctions<E, T, OutputFormaterBase<E, T>> {
    return {
        asEntity(this: OutputFormaterBase<E, T>, row: T | null, query: Query<E> = {}) {
            if (!row) return null
            const raw = row as unknown as SequelizeRawEntityNotGrouped<E>
            const mappedSelect = this.mapSelects(query)
            const merged = mergeRowsIntoEntities(mappedSelect, this.relationTree, raw)
            return convertRow(merged, mappedSelect, this.converters['raw']) 
        },
        asEntities(this: OutputFormaterBase<E, T>, rows: T[], query: Query<E> = {}) {
            const raw = rows as unknown as SequelizeRawEntityNotGrouped<E>[]
            const mappedSelect = this.mapSelects(query)
            const merged = mergeRowsIntoEntities(mappedSelect, this.relationTree, raw)
            return merged.map((row) => convertRow(row, mappedSelect, this.converters['raw']))
        }
    }
}

