import { Dialect, Sequelize } from "sequelize";
import type { OrmOptions, DialectOptions, OrmMap, DialectName } from "../types/Registry.js";
import type { OrmName } from "../types/Registry.js";
import type { OrmDetector } from "../types/entity/Repository.js";


const ormDetectors: readonly OrmDetector[] = [
    {
        name: 'sequelize',
        matches: (connection) => connection instanceof Sequelize,
    },
];

const dialectDetectors: Record<OrmName, (connection: OrmOptions) => DialectName<OrmName>> = {
    sequelize: (connection) => {
        if (!(connection instanceof Sequelize)) {
            throw new Error('Unknown Sequelize connection');
        }

        const dialect = connection.getDialect();
        switch (dialect) {
            case 'mysql':
            case 'sqlite':
            case 'postgres':
            case 'mariadb':
                return dialect;
            default:
                throw new Error(`Unsupported Sequelize dialect: ${dialect}`);
        }
    },
};

function describeConnection(connection: unknown): string {
    if (typeof connection === 'object' && connection !== null) {
        return connection.constructor?.name ?? typeof connection;
    }

    return typeof connection;
}

/**
 * Detect the ORM implementation behind a live connection.
 *
 * ORM matchers live in a registry so supporting another ORM requires
 * adding its matcher without changing the detection algorithm.
 *
 * @param connection The live ORM connection to inspect.
 * @returns The normalized ORM identifier.
 * @throws When no registered ORM recognizes the connection.
 */
export function detectOrm(connection: OrmOptions): OrmName {
    const detector = ormDetectors.find(({ matches }) => matches(connection));
    if (detector) {
        return detector.name;
    }

    throw new Error(`Unknown ORM connection: ${describeConnection(connection)}`);
}

/**
 * Detect and validate the dialect behind a live ORM connection.
 *
 * Dialect resolution is delegated per ORM so a future ORM can provide
 * its own dialect semantics.
 *
 * @param connection The live ORM connection to inspect.
 * @param orm The detected ORM name, calculated when omitted.
 * @returns The supported dialect identifier.
 * @throws When dialect resolution is unavailable or fails.
 */
export function detectDialect(
    connection: OrmOptions,
    orm: OrmName = detectOrm(connection),
): DialectName<OrmName> {
    const detector = dialectDetectors[orm];
    if (!detector) {
        throw new Error(`Dialect detection is not implemented for ${orm}`);
    }

    return detector(connection);
}
