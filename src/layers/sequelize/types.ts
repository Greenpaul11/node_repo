import { EntityBase, ExternalReferences } from "../../types/entity/Root";
import { EntityTransform, TransformNoExternal, FunctionsToTransformRules } from "../../types/entity/Converters";

import { converterDialectsBuild } from "./output/formater";


/**
 * Transformation rules for the MySQL "native" converter family.
 * To match sequelize native entity transform:
 * - decimal to string
 */
type SequelizeNativeTransformRules = FunctionsToTransformRules<typeof converterDialectsBuild['mysql']['native']>

/**
 * Transformation rules for the MySQL "raw" converter family.
 * To match sequelize raw entity transform:
 *  - decimal to string
 *  - boolean to number
 */
type SequelizeRawTransformRules = FunctionsToTransformRules<typeof converterDialectsBuild['mysql']['raw']>

/**
 * Applies {@link EntityTransform} with {@link SequelizeNativeTransformRules} to map an entity’s 
 * fields to the types Sequelize returns from model.toJSON().
 */
export type SequelizeEntity<E extends EntityBase> = EntityTransform<E, SequelizeNativeTransformRules>

/**
 * Sequelize raw row with has‑many relations collapsed into single objects,
 * recursively transformed using `SequelizeRawTransformRules`.
 */
export type SequelizeRawEntityNotGrouped<E extends EntityBase> = 
    TransformNoExternal<E, SequelizeRawTransformRules> & {
        [Key in keyof ExternalReferences<E>]?: SequelizeRawEntityNotGrouped<ExternalReferences<E>[Key]> | null
    }

/**
 * Represents a deduplicated raw Sequelize entity(row that is returned from sequelize 
 * when query options 'raw' and 'nest' are set to true) that has been merged into
 * a single entity shape, with relations normalized so that "to‑many"
 * associations are expressed as collections instead of single objects.
 */

export type SequelizeRawEntity<E extends EntityBase> = EntityTransform<E, SequelizeRawTransformRules>
