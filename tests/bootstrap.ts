// set up test database
if (process.env.NODE_ENV !== 'test') {
    throw new Error('The test can not be run outside of test enviroment.')
}

const ormName = process.env.ORM

if (!ormName) {
    throw new Error('Orm name is not defined. Can not establish test setup.')
}

await import(`../tests/layers/${ormName}/config/setup`)
