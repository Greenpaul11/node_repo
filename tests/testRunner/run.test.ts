// test-runner.test.js
import { it,  describe, beforeEach, afterEach, mock } from 'node:test'
import assert from 'node:assert'
import process from 'node:process'

// Mock the modules that are imported
const mockORM_MAP = {
  sequelize: ['mysql', 'postgres', 'sqlite'],
  mongoose: ['mongodb'],
  prisma: ['mysql', 'postgres', 'sqlite', 'sqlserver']
}

const assertExitInResolveTarget = async (args: string[]) => {
  const { resolveTarget } = await import('../run.js')
      
    // mock process.exit to avoid actual exit
    let exitCalled = false
    const mockedExit = mock.method(process, 'exit', (code: number) => {
      exitCalled = true
      assert.strictEqual(code, 2)
      throw new Error('process.exit called')
    })
    
    try {
      resolveTarget(args)
    } catch (e) {
      // expected to throw due to mocked exit
    } finally {
      mockedExit.mock.restore()
    }
    
    assert.ok(exitCalled)
}

// Mock the actual module imports
mock.method(process, 'exit', () => {})

// Since we're testing functions that are imported from other files,
// we'll create a simplified version to test logic
describe('Test Runner Functions', () => {
  let mockedCwd: it.Mock<(() => string)>
  let originalEnv: NodeJS.ProcessEnv
  
  beforeEach(() => {
    originalEnv = process.env
    
    // Mock process.cwd() to return a test directory
    mockedCwd = mock.method(process, 'cwd', () => '/test/project')
    
    // Mock environment variables
    process.env = { ...process.env }
  })
  
  afterEach(() => {
    mockedCwd.mock.restore()
    process.env = originalEnv
  })

  describe('isOrm function', async () => {
    it('should return true for valid ORM names', async () => {
      const { isOrm } = await import('../run.js')
      
      assert.ok(isOrm('sequelize'))
    })
    
    it('should return false for invalid ORM names', async () => {
      const { isOrm } = await import('../run.js')
      
      assert.ok(!isOrm('invalid-orm'))
      assert.ok(!isOrm('typeorm'))
      assert.ok(!isOrm(''))
    })
  })

  describe('isDialect function', () => {
    it('should return true for valid dialects of given ORM', async () => {
      const { isDialect } = await import('../run.js')
      
      assert.ok(isDialect('sequelize', 'mysql'))
      assert.ok(isDialect('sequelize', 'postgres'))
    })
    
    it('should return false for invalid dialects of given ORM', async () => {
      const { isDialect } = await import('../run.js')
      
      assert.ok(!isDialect('sequelize', 'mongodb'))
    })
  })

  describe('resolveTarget function', () => {
    it('should handle empty positional arguments (core tests only)', async () => {
      const { resolveTarget } =  await import('../run.js')
      
      const result = resolveTarget([])
      
      assert.deepStrictEqual(result.orms, [])
      assert.deepStrictEqual(result.dialects, [])
      assert.ok(Array.isArray(result.patterns))
      assert.ok(result.patterns.length > 0)
    })
    
    it('should handle "one" command with valid path', async () => {
      const { resolveTarget } =  await import('../run.js')
      
      const result = resolveTarget(['one', 'path/to/test.test.ts'])
      
      assert.deepStrictEqual(result.orms, [])
      assert.deepStrictEqual(result.dialects, [])
      assert.deepStrictEqual(result.patterns, ['path/to/test.test.ts'])
    })
    
    it('should handle "all" command', async () => {
      const { resolveTarget } = await import('../run.js')
      
      const result = resolveTarget(['all'])
      
      assert.deepStrictEqual(result.orms, ['sequelize'])
      assert.deepStrictEqual(result.dialects, [
        ['mysql', 'postgres', 'mariadb', 'sqlite']
      ])
      assert.deepStrictEqual(result.patterns, [
        [`tests/layers/sequelize/**/*.test.ts`]
      ])
    })
    
    it('should handle ORM name with "all" dialects', async () => {
      const { resolveTarget } = await import('../run.js')
      
      const result = resolveTarget(['sequelize', 'all'])
      
      assert.deepStrictEqual(result.orms, ['sequelize'])
      assert.deepStrictEqual(result.dialects, [['mysql', 'postgres', 'mariadb', 'sqlite']])
      assert.deepStrictEqual(result.patterns, [[`tests/layers/sequelize/**/*.test.ts`]])
    })
    
    it('should handle ORM name with specific dialects', async () => {
      const { resolveTarget } = await import('../run.js')
      
      const result = resolveTarget(['sequelize', 'mysql', 'postgres'])
      
      assert.deepStrictEqual(result.orms, ['sequelize'])
      assert.deepStrictEqual(result.dialects, [['mysql', 'postgres']])
      assert.deepStrictEqual(result.patterns, [[`tests/layers/sequelize/**/*.test.ts`]])
    })
    
    it('should handle multiple ORM names with all dialects', async () => {
      const { resolveTarget } = await import('../run.js')
      
      const result = resolveTarget(['sequelize'])
      
      assert.deepStrictEqual(result.orms, ['sequelize'])
      assert.deepStrictEqual(result.dialects, [
        ['mysql', 'postgres', 'mariadb', 'sqlite']
      ])
      assert.deepStrictEqual(result.patterns, [
        `tests/layers/sequelize/**/*.test.ts`
      ])
    })

    it('should fail when "one" command has no path', async () => {
      await assertExitInResolveTarget(['one'])
    })
    
    it('should fail with invalid ORM name', async () => {
      await assertExitInResolveTarget(['invalid-orm'])
    })
    
    it('should fail with invalid dialect for ORM', async () => {
      await assertExitInResolveTarget(['sequelize', 'invalid-dialect'])
    })
    
    it('should fail with too many arguments for "one"', async () => {
      await assertExitInResolveTarget(['one', 'path1', 'path2'])
    })
    
    it('should fail with too many arguments for "all"', async () => {
      await assertExitInResolveTarget(['all', 'extra-arg'])
    })
    
    it('should fail when ORM name is missing with dialects', async () => {
      await assertExitInResolveTarget(['mysql', 'postgres'])
    })
  })
})
