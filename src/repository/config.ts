import queryConverterConfig from '../converters/query/config.js'
import outputConverterConfig from '../converters/output/config.js'
import { RepositoryConfig } from '../types/entity/Repository.js'

export const SUB_ENTITIES_DEPTH = 5 // limit query & output converter relation depth

export default {
    query: queryConverterConfig, // query configurations
    output: outputConverterConfig, // output configurations
    subEntitiesDepth: SUB_ENTITIES_DEPTH
} satisfies RepositoryConfig

