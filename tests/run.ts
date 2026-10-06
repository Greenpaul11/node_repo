import { spawn } from 'node:child_process'
import path from 'path'
import process from 'node:process'
import { ORM_MAP, ORMS } from '../src/registry/constants.js'
import { DialectName, OrmName } from '../src/types/Registry.js'


const rootDir = process.cwd()
const envTestPath = path.join(rootDir, 'config', '.env.test')
const coreTestLocations = [
    'tests/constructors/**/*.test.ts',
    'tests/converters/**/*.test.ts',
    'tests/lib/**/*.test.ts'
]
const getLayerTestLocation = (orm: string) => {
    return [
        `tests/layers/${orm}/**/*.test.ts`
    ]
}
const toHelp = (cause: string) => `
Invalid use: ${cause}.
Run "npm test help" to see correct usage examples.`
const usage = `
Usage: npm test [all | one | [orm name]] [all | [dialect name] | [test path]]

Examples:
  
  npm test  => run only tests that are not layer tests (test core)
  
  npm test one path/toSpecific/xxx.test.ts | path/toSpecific/testDirectory/**/*.test.ts  => run one specific test or tests included in specific directory
  
  npm test all  => run all possible layer tests (all possible layers with their dialects, core tests are excluded)
  
  npm test sequelize prisma   => run choosen layers tests with all possible dialects for each layer
  
  npm test sequelize all  => run one choosen layer tests with all possible dialects
  
  npm test sequelize mysql sqlite  => run one choosen layer tests with specific dialects
`

export function fail(message: string): never {
    console.error(`\n  ${message}\n`)
    process.exit(2)
}

export function isOrm(orm: string) {
    return Object.hasOwn(ORM_MAP, orm)
}

export function isDialect(orm: OrmName, dialect: string) {
    return (ORM_MAP[orm] as readonly string[]).includes(dialect)
}

export function isHelp(argv: string[]): boolean {
    return argv[0] === 'help' ? true : false
}

export function resolveTarget(
    positional: string[]
): { 
    orms: OrmName[] 
    dialects: DialectName<OrmName>[][], 
    patterns: string[] | string[][]
} {
    // case: npm test
    if (positional.length === 0) {
        return {
            orms: [],
            dialects: [],
            patterns: coreTestLocations
        }
    }

    const [arg1, arg2, ...args] = positional

    // case: npm test one path/toSpecific/test
    if (arg1 === 'one') {
        if (!arg2) {
            fail(toHelp('MISSING PATH FOR SPECIFIC TEST'))
        }
        if (args.length) {
            fail(toHelp('TOO MANY ARGUMENTS'))
        }
        return {
            orms: [],
            dialects: [],
            patterns: [arg2]
        }
    }
    
    // case: npm test all
    if (arg1 === 'all') {
        if (arg2) {
            fail(toHelp('TOO MANY ARGUMENTS'))
        }
        const orms = Object.keys(ORM_MAP) as OrmName[]
        return {
            orms: orms,
            dialects: orms.map((orm) => [...ORM_MAP[orm]]),
            patterns: orms.map((orm) => getLayerTestLocation(orm))
        }
    }

    if (!isOrm(arg1)) {
        fail(`Unsupported ARGUMENT: "${arg1}". Expected: all | one | ${ORMS.join(' | ')}`)
    }
    const orm = arg1 as OrmName
    if (arg2 === undefined) {
        fail(toHelp('MISSING ARGUMENT'))
    // case: npm test 'orm name' all
    } else if (arg2 === 'all') {
        return {
            orms: [orm],
            dialects: [[...ORM_MAP[orm]]],
            patterns: [getLayerTestLocation(orm)]
        }
    // case: npm test 'orm name' 'orm name'
    } else if (Object.hasOwn(ORM_MAP, arg2)) {
        const layers = new Set([arg2, ...args] as OrmName[])
        layers.forEach((layer) => {
            if (!isOrm(layer)) {
                fail(`Unsupported layer: "${layer}". Expected: ${ORMS.join(' | ')}`)
            }
        })
        const asOrms = [...layers]
        return {
            orms: asOrms,
            dialects: asOrms.map((orm) => [...ORM_MAP[orm]]),
            patterns: asOrms.map((orm) => getLayerTestLocation(orm))
        }
    
    // case: npm test 'orm name' [...dialects]
    } else {
        const dialects = new Set([arg2, ...args] as DialectName<OrmName>[]) 
        dialects.forEach((dialect) => {
            if (!isDialect(orm, dialect)) {
                fail(`Unsupported DIALECT for ORM: "${orm}". Expected: ${ORM_MAP[orm].join(' | ')}`)
            }
        })
        return {
            orms: [orm],
            dialects: [[...dialects]],
            patterns: [getLayerTestLocation(orm)]
        }
    }
}


export async function runTests(
    orm: OrmName | null,
    dialect: DialectName<OrmName> | null,
    patterns: string[],
    signal: AbortSignal
): Promise<number> {
    return new Promise((resolve) => {
        const child = spawn(
            process.execPath,
            [
                '--trace-uncaught',
                `--env-file-if-exists=${envTestPath}`,
                '--import',
                'tsx',
                ...(orm && dialect ? ['--import', './tests/bootstrap.ts']: []),
                '--test',
                '--test-concurrency=1',
                '--test-force-exit',
                ...patterns,
            ],
            {
                cwd: rootDir,
                stdio: 'inherit',
                signal,
                env: (orm && dialect)
                    ? { ...process.env, NODE_ENV: 'test', ORM: orm, DIALECT: dialect }
                    : undefined,
            }
        )

        child.on('error', (error) => {
            console.error(`Failed to start test runner: ${error.message}`)
            resolve(1)
        })

        child.on('close', (code, childSignal) => {
            if (childSignal) {
                console.error(`\nTest runner terminated by signal ${childSignal}.`)
                resolve(1)
                return
            }
            resolve(code ?? 1)
        })
    })
}


export async function main(): Promise<void> {
    
    const controller = new AbortController()
    const forwardSignal = () => controller.abort()
    const positional = process.argv.slice(2)

    if (isHelp(positional)) {
        console.log(usage)
        return
    }

    const { orms, dialects, patterns } = resolveTarget(positional)

    process.on('SIGINT', forwardSignal)
    process.on('SIGTERM', forwardSignal)
    
    if (orms.length && dialects.length) {
        for (const [index, orm] of orms.entries()) {
            if (!Array.isArray(patterns[index])) {
                throw new Error('Accepted only array of dialects.')
            }
            const pattern = patterns[index] 
            for (const dialect of dialects[index]) {
                if (controller.signal.aborted) break

                console.log(`\n${'='.repeat(60)}`)
                console.log(`TEST FOR ORM: ${orm} WITH  DIALECT: ${dialect}`)
                
                const code = await runTests(orm, dialect, pattern, controller.signal)
               
                if (code !== 0 && dialects.length > 1) {
                    console.log(`\nSkipping remaining dialects after ${dialect} failed.`)
                    break
                }
            }      

        }
    } else {
        const pattern = patterns as string[]
        runTests(null, null, pattern, controller.signal)
    }
}

await main()
