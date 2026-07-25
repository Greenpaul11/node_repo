import { strict as assert } from 'node:assert'
import { describe, it } from 'node:test'
import { overrideObject } from '../../src/lib/override'

describe('overrideObject', () => {
    //  Simple primitive overrides
    describe('primitive overrides', () => {

        it('overrides boolean true -> false', () => {
            const target = { active: true }
            overrideObject(target, { active: false })
            assert.strictEqual(target.active, false)
        })

        it('overrides boolean false -> true', () => {
            const target = { active: false }
            overrideObject(target, { active: true })
            assert.strictEqual(target.active, true)
        })

        it('overrides number', () => {
            const target = { depth: 5 }
            overrideObject(target, { depth: 2 })
            assert.strictEqual(target.depth, 2)
        })

        it('overrides zero', () => {
            const target = { depth: 5 }
            overrideObject(target, { depth: 0 })
            assert.strictEqual(target.depth, 0)
        })

        it('overrides string', () => {
            const target = { name: 'default' }
            overrideObject(target, { name: 'custom' })
            assert.strictEqual(target.name, 'custom')
        })

        it('overrides empty string', () => {
            const target = { name: 'default' }
            overrideObject(target, { name: '' })
            assert.strictEqual(target.name, '')
        })
    })

    //  Array replacement
    describe('array replacement', () => {

        it('replaces array entirely (no merge)', () => {
            const target = { ids: [1, 2, 3] }
            overrideObject(target, { ids: [4, 5] })
            assert.deepStrictEqual(target.ids, [4, 5])
        })

        it('replaces with empty array', () => {
            const target = { ids: [1, 2, 3] }
            overrideObject(target, { ids: [] })
            assert.deepStrictEqual(target.ids, [])
        })
    })

    //  Nested object overrides
    describe('nested object overrides', () => {

        it('overrides one level deep', () => {
            const target = {
                validation: { string: true, number: false }
            }
            overrideObject(target, {
                validation: { string: false }
            })
            assert.strictEqual(target.validation.string, false)
            assert.strictEqual(target.validation.number, false)
        })

        it('overrides multiple levels deep', () => {
            const target = {
                validation: {
                    baseAttributes: { string: true, number: true },
                    rangeAttributes: { number: true }
                }
            }
            overrideObject(target, {
                validation: {
                    baseAttributes: { string: false }
                }
            })
            assert.strictEqual(target.validation.baseAttributes.string, false)
            assert.strictEqual(target.validation.baseAttributes.number, true)
            assert.strictEqual(target.validation.rangeAttributes.number, true)
        })

        it('overrides deeper level while preserving siblings', () => {
            const target = {
                validation: {
                    baseAttributes: { string: true, number: true, date: true, boolean: true },
                    rangeAttributes: { number: true, date: true },
                    queryAttributes: { select: true }
                },
                subEntityRelationDepth: 5
            }
            overrideObject(target, {
                validation: {
                    baseAttributes: { string: false }
                }
            })
            const expected = {
                validation: {
                    baseAttributes: { string: false, number: true, date: true, boolean: true },
                    rangeAttributes: { number: true, date: true },
                    queryAttributes: { select: true }
                },
                subEntityRelationDepth: 5
            }
            assert.deepStrictEqual(target, expected)
        })

        it('the return value is the mutated target object', () => {
            const target = { key: 'value' }
            const returned = overrideObject(target, { key: 'new' })
            assert.strictEqual(returned, target)
        })
    })

    //  Multiple keys at once
    describe('multiple key overrides', () => {

        it('overrides several unrelated keys in one call', () => {
            const target = {
                name: 'default',
                count: 10,
                active: false,
                tags: ['a', 'b']
            }
            overrideObject(target, {
                name: 'changed',
                count: 42,
                active: true,
                tags: ['x']
            })
            assert.strictEqual(target.name, 'changed')
            assert.strictEqual(target.count, 42)
            assert.strictEqual(target.active, true)
            assert.deepStrictEqual(target.tags, ['x'])
        })

        it('empty source leaves target unchanged', () => {
            const target = { key: 'value', num: 1 }
            const before = { ...target }
            overrideObject(target, {})
            assert.deepStrictEqual(target, before)
        })
    })

    //  Error cases
    describe('error handling', () => {

        it('throws when source key does not exist in target', () => {
            const target = { existing: true }
            assert.throws(
                () => overrideObject(target, { unknown: 'x' }),
                /unknown.*does not exist/
            )
        })

        it('throws when source value is null', () => {
            const target = { key: 'value' }
            assert.throws(
                () => overrideObject(target, { key: null }),
                /key.*null/
            )
        })

        it('throws when source value is undefined and type mismatches', () => {
            const target = { key: 'value' }
            assert.throws(
                () => overrideObject(target, { key: undefined }),
                /expected string, got undefined/
            )
        })

        it('throws when source boolean does not match target string', () => {
            const target = { key: 'value' }
            assert.throws(
                () => overrideObject(target, { key: false }),
                /expected string, got boolean/
            )
        })

        it('throws when source number does not match target boolean', () => {
            const target = { key: true }
            assert.throws(
                () => overrideObject(target, { key: 42 }),
                /expected boolean, got number/
            )
        })

        it('throws when source string does not match target number', () => {
            const target = { key: 5 }
            assert.throws(
                () => overrideObject(target, { key: 'x' }),
                /expected number, got string/
            )
        })

        it('throws when source object does not match target array', () => {
            const target = { key: [1, 2] }
            assert.throws(
                () => overrideObject(target, { key: {} }),
                /expected array, got object/
            )
        })

        it('throws when source array does not match target object', () => {
            const target = { key: { sub: 1 } }
            assert.throws(
                () => overrideObject(target, { key: [1] }),
                /expected object, got array/
            )
        })

        it('reports full object path on nested errors', () => {
            const target = { a: { b: { c: true } } }
            assert.throws(
                () => overrideObject(target, { a: { b: { c: 42 } } }),
                /a\.b\.c/
            )
        })

        it('does not mutate target on unknown key error', () => {
            const target = { existing: true }
            const before = { ...target }
            assert.throws(
                () => overrideObject(target, { unknown: 'x' })
            )
            assert.deepStrictEqual(target, before)
        })

        it('does not mutate target on null source error', () => {
            const target = { key: 'original' }
            const before = { ...target }
            assert.throws(
                () => overrideObject(target, { key: null })
            )
            assert.deepStrictEqual(target, before)
        })

        it('does not mutate target on type mismatch error', () => {
            const target = { key: 'original' }
            const before = { ...target }
            assert.throws(
                () => overrideObject(target, { key: 99 })
            )
            assert.deepStrictEqual(target, before)
        })
    })
})
