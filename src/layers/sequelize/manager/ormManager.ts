import type { Model, InferAttributes, InferCreationAttributes, ModelStatic, FindOptions } from 'sequelize'
import type { EntityBase } from '../../../types/entity/Root'
import type { CreationOptional, EntityCreationAttributes } from '../../../types/entity/Creation'
import { OrmManagerBase } from '../../../ormManager/ormMenagerBase'
import { DialectOptions } from '../../../types/Config'
import { EntityQueryable } from '../../../types/entity/Query'
import { Query } from '../../../types/entity/Query'



export class OrmManager<
    E extends EntityBase,
    T extends Model<InferAttributes<T>, InferCreationAttributes<T>>
> extends OrmManagerBase<E, T, ModelStatic<T>, FindOptions<InferAttributes<T>>> {

    constructor(
        manager: ModelStatic<T>,
        dialect: DialectOptions,
        convertQuery: <Q extends Query<E>>(query: Q) => FindOptions<InferAttributes<T>>
    ) {
        super(manager, dialect, convertQuery)
    }

    async createOne(data: EntityCreationAttributes<E, CreationOptional<E>>): Promise<T> {
        const created = await this.manager.create(data as any)
        return created
    }

    async deleteOne(id: number): Promise<boolean> {
        const record = await this.manager.findByPk(id) as T | null
        if (record) {
            await record.destroy()
            return true
        }
        return false
    }

    async destroyAll(where?: EntityQueryable<E>): Promise<number> {
        const options: { where?: any; truncate?: boolean } = {}
        if (where === undefined) {
            options.truncate = true
        } else {
            options.where = where 
        }
        const count = await this.manager.destroy(options)
        return count
    }

    async getAll<Q extends Query<E>>(query: Q): Promise<T[]> {
        const ormQuery = this.convertQuery(query) 
        return await this.manager.findAll(ormQuery)
    }
}