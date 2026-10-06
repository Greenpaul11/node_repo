import { Sequelize } from 'sequelize';

const tablesInDeletionOrder = [
    'rate',
    'specification',
    'product_category',
    'comment',
    'price',
    'specification_tree',
    'product',
    'category',
    'shop',
    'user',
    'product_importer',
] as const;

async function cleanTables(connection: Sequelize): Promise<void> {
    const queryInterface = connection.getQueryInterface();

    await connection.transaction(async (transaction) => {
        for (const table of tablesInDeletionOrder) {
            await connection.query(
                `DELETE FROM ${queryInterface.quoteIdentifier(table)}`,
                { transaction }
            );
        }
    });
}

export async function applayClean(connection: Sequelize) {
    await cleanTables(connection)
}

