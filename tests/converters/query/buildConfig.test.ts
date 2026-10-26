// test-override.mjs
import { describe, it } from 'node:test'
import assert from 'node:assert'
import build from '../../../src/converters/query/buildConfig.js'
import { OverridesQueryConverterConfig, QueryConverterConfig } from '../../../src/types/entity/Query.js'


describe('Build QueryConverterConfig - test build function', () => {
    const reference: QueryConverterConfig = {
        validation: {
            baseAttributes: {
                string: false,
                number: false,
                date: false,
                boolean: false
            },
            rangeAttributes: {
                number: false,
                date: false
            },
            queryAttributes: {
                select: false,
                order: false,
                group: false
            }
        }, 
        subEntitiesDepth: 2
    }
    const referenceClone = structuredClone(reference)
    const referenceIsUnchanged = () => {
        assert.deepStrictEqual(reference, referenceClone)
    }

    it('validation set to true', () => {
        const overrideConfig: OverridesQueryConverterConfig = {
            validation: true
        }
        const result = build(reference, overrideConfig)
        assert.deepStrictEqual(result, {
            validation: {
                baseAttributes: {
                    string: true,
                    number: true,
                    date: true,
                    boolean: true
                },
                rangeAttributes: {
                    number: true,
                    date: true
                },
                queryAttributes: {
                    select: true,
                    order: true,
                    group: true
                }
            }, 
            subEntitiesDepth: 2
        })
        referenceIsUnchanged()
    })
    
    it('validation of groups set to true', () => {
        const overrideConfig: OverridesQueryConverterConfig = {
            validation: {
                baseAttributes: true,
                rangeAttributes: true,
                queryAttributes: true
            }
        }
        const result = build(reference, overrideConfig)
        assert.deepStrictEqual(result, {
            validation: {
                baseAttributes: {
                    string: true,
                    number: true,
                    date: true,
                    boolean: true
                },
                rangeAttributes: {
                    number: true,
                    date: true
                },
                queryAttributes: {
                    select: true,
                    order: true,
                    group: true
                }
            }, 
            subEntitiesDepth: 2
        })
        referenceIsUnchanged()
    })

    it('validation of groups set to true partially', () => {
        const overrideConfig: OverridesQueryConverterConfig = {
            validation: {
                baseAttributes: true,
                queryAttributes: true
            }
        }
        const result = build(reference, overrideConfig)
        assert.deepStrictEqual(result, {
            validation: {
                baseAttributes: {
                    string: true,
                    number: true,
                    date: true,
                    boolean: true
                },
                rangeAttributes: {
                    number: false,
                    date: false
                },
                queryAttributes: {
                    select: true,
                    order: true,
                    group: true
                }
            }, 
            subEntitiesDepth: 2
        })
        referenceIsUnchanged()
    })

    it('validation of groups set to true partially with all group attributes enabled', () => {
        const overrideConfig: OverridesQueryConverterConfig = {
            validation: {
                rangeAttributes: true,
                queryAttributes: {
                    select: true,
                    order: true,
                    group: true
                }
            }
        }
        const result = build(reference, overrideConfig)
        assert.deepStrictEqual(result, {
            validation: {
                baseAttributes: {
                    string: false,
                    number: false,
                    date: false,
                    boolean: false
                },
                rangeAttributes: {
                    number: true,
                    date: true
                },
                queryAttributes: {
                    select: true,
                    order: true,
                    group: true
                }
            }, 
            subEntitiesDepth: 2
        })
        referenceIsUnchanged()
    })

    it('validation of groups set to true partially with specific attributes enabled', () => {
        const overrideConfig: OverridesQueryConverterConfig = {
            validation: {
                rangeAttributes: {
                    number: true,
                    date: true
                },
                queryAttributes: {
                    select: true,
                    order: true,
                    group: true
                }
            }
        }
        const result = build(reference, overrideConfig)
        assert.deepStrictEqual(result, {
            validation: {
                baseAttributes: {
                    string: false,
                    number: false,
                    date: false,
                    boolean: false
                },
                rangeAttributes: {
                    number: true,
                    date: true
                },
                queryAttributes: {
                    select: true,
                    order: true,
                    group: true
                }
            }, 
            subEntitiesDepth: 2
        })
        referenceIsUnchanged()
    })

    it('validation with specific attributes of group enabled', () => {
        const overrideConfig: OverridesQueryConverterConfig = {
            validation: {
                rangeAttributes: {
                    number: true
                },
                queryAttributes: {
                    select: true,
                    order: true
                }
            }
        }
        const result = build(reference, overrideConfig)
        assert.deepStrictEqual(result, {
            validation: {
                baseAttributes: {
                    string: false,
                    number: false,
                    date: false,
                    boolean: false
                },
                rangeAttributes: {
                    number: true,
                    date: false
                },
                queryAttributes: {
                    select: true,
                    order: true,
                    group: false
                }
            }, 
            subEntitiesDepth: 2
        })
        referenceIsUnchanged()
    })

    it('overriding other root level attributes', () => {
        const overrideConfig: OverridesQueryConverterConfig = {
            subEntitiesDepth: 4
        }
        const result = build(reference, overrideConfig)
        assert.deepStrictEqual(result, {
            validation: {
                baseAttributes: {
                    string: false,
                    number: false,
                    date: false,
                    boolean: false
                },
                rangeAttributes: {
                    number: false,
                    date: false
                },
                queryAttributes: {
                    select: false,
                    order: false,
                    group: false
                }
            }, 
            subEntitiesDepth: 4
        })
        referenceIsUnchanged()
    })

    it('overriding mixed attributes', () => {
        const overrideConfig: OverridesQueryConverterConfig = {
            validation: {
                baseAttributes: true,
                queryAttributes: {
                    group: true
                }
            },
            subEntitiesDepth: 10
        }
        const result = build(reference, overrideConfig)
        assert.deepStrictEqual(result, {
            validation: {
                baseAttributes: {
                    string: true,
                    number: true,
                    date: true,
                    boolean: true
                },
                rangeAttributes: {
                    number: false,
                    date: false
                },
                queryAttributes: {
                    select: false,
                    order: false,
                    group: true
                }
            }, 
            subEntitiesDepth: 10
        })
        referenceIsUnchanged()
    })

    it('overriding with empty object has no effect', () => {
        const overrideConfig: OverridesQueryConverterConfig = {}
        const result = build(reference, overrideConfig)
        assert.deepStrictEqual(result, {
            validation: {
                baseAttributes: {
                    string: false,
                    number: false,
                    date: false,
                    boolean: false
                },
                rangeAttributes: {
                    number: false,
                    date: false
                },
                queryAttributes: {
                    select: false,
                    order: false,
                    group: false
                }
            }, 
            subEntitiesDepth: 2
        })
        referenceIsUnchanged()
    })

    it('overrideConfig argument has invalid type - should throw an error', () => {
    const invalidTypes = [0, 1, true, false, '', 'te', null, undefined, []]
    for (const invalid of invalidTypes) {
        try {
            build(reference, invalid as any)
            assert.fail('Expected error was not thrown')
        } catch (error: any) {
            assert.ok(error.message.includes(`Invalid type: "${typeof invalid}" for override argument.`))
        }
    }
})

    it('overrideConfig object has no existing properties - should throw an error', () => {
        const invalidConfigs = [{val: 1}, {test: 'test', second: 2}, {baseAttributes: false}]
        for (const invalid of invalidConfigs) {
            try {
                build(reference, invalid as any)
                assert.fail('Expected error was not thrown')
            } catch (error: any) {
                assert.ok(error.message.includes(`Override error at '${Object.keys(invalid)[0]}': key does not exist in target`))
            }
        }
    })

    it('overrideConfig object with invalid shape of "validation" - should throw an error', () => {
        const invalidTypes = [0, 1, false, '', 'te', null, []]
        const invalidConfigs = invalidTypes.map((t) => {
            return {validation: t}
        })
        for (const [index, invalid] of invalidConfigs.entries()) {
            try {
                build(reference, invalid as any)
                assert.fail('Expected error was not thrown')
            } catch (error: any) {
                assert.ok(error.message.includes(`Invalid type for "validation" attribute: "${typeof invalidTypes[index]}" expected object.`))
            }
        }
    })
    
    it('overrideConfig object with "validation" that has invalid attribute name - should throw an error', () => {
        const invalidConfigs = [{validation: {baseAttr: true}}, {validation: {rangeAttr: true}}]
        for (const [index, invalid] of invalidConfigs.entries()) {
            try {
                build(reference, invalid as any)
                assert.fail('Expected error was not thrown')
            } catch (error: any) {
                assert.ok(error.message.includes(`Validation configuration has no member: ${Object.keys(invalidConfigs[index].validation)[0]}.`))
            }
        }
    })

    it('overrideConfig object with "validation" that has invalid value types - should throw an error', () => {
        const invalidConfigs = [{validation: {baseAttributes: false}}, {validation: {rangeAttributes: 0}}]
        for (const invalid of invalidConfigs) {
            try {
                build(reference, invalid as any)
                assert.fail('Expected error was not thrown')
            } catch (error: any) {
                assert.ok(error.message.includes(`Invalid type for enabling validation members.`))
            }
        }

        const invalidConfigsDeep = [{validation: {baseAttributes: {string: false}}}, {validation: {rangeAttributes: {number: 0}}}]
        for (const invalid of invalidConfigsDeep) {
            try {
                build(reference, invalid as any)
                assert.fail('Expected error was not thrown')
            } catch (error: any) {
                assert.ok(error.message.includes(`Invalid type for enabling validation members.`))
            }
        }
    })

    it('overriding root attributes with invalid value types - should throw an error', () => {
        const invalidTypes = [true, false, '', 'te', null, undefined, []]
        const invalidConfigs = invalidTypes.map((t) => {
            return {subEntitiesDepth: t} // accepted number type
        })
        
        for (const [index, invalid] of invalidConfigs.entries()) {
            assert.throws(
                () => build(reference, invalid as any),
                /Override error at 'subEntitiesDepth':/
            )
        }
    })
})