/**
 * Property-based tests for KondisiAwalParser - Pickup-Pairing Integration
 * Tests universal correctness properties for parsing logic
 */

import { parseKondisiAwalEnhanced, extractProductSizeIdEnhanced } from '../kondisiAwalParser'

// Test data generators
const generateUuid = () => crypto.randomUUID()
const generateSize = () => ['S', 'M', 'L', 'XL', 'XXL'][Math.floor(Math.random() * 5)]
const generateAgeCategory = () => ['ADULT', 'CHILD', 'TODDLER'][Math.floor(Math.random() * 3)]
const generateCondition = () => ['baik', 'rusak', 'hilang'][Math.floor(Math.random() * 3)]

// Generate valid JSON kondisiAwal with optional linkedSarung
const generateJsonKondisiAwal = (withLinkedSarung = Math.random() > 0.5) => {
  //eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = {
    productSizeId: generateUuid(),
    size: generateSize(),
    ageCategory: generateAgeCategory(),
    condition: generateCondition(),
  }

  if (withLinkedSarung) {
    data.linkedSarung = {
      productId: generateUuid(),
      productSizeId: generateUuid(),
      quantity: Math.floor(Math.random() * 5) + 1,
      product:
        Math.random() > 0.5
          ? {
              name: `Sarung ${Math.floor(Math.random() * 100)}`,
              code: `SAR${Math.floor(Math.random() * 1000)}`,
            }
          : undefined,
    }
  }

  return data
}

// Generate valid pipe kondisiAwal
const generatePipeKondisiAwal = () => {
  const id = generateUuid()
  const size = generateSize()
  const age = generateAgeCategory()
  const condition = generateCondition()
  return `${id}|${size}|${age}|${condition}`
}

describe('KondisiAwalParser Property Tests - Pickup-Pairing Integration', () => {
  describe('Property 1: Format compatibility parsing', () => {
    test('parseKondisiAwalEnhanced handles valid JSON format correctly', () => {
      // Test with multiple random samples
      for (let i = 0; i < 50; i++) {
        const kondisiData = generateJsonKondisiAwal()
        const jsonString = JSON.stringify(kondisiData)
        const result = parseKondisiAwalEnhanced(jsonString)

        // Should successfully parse and extract data
        expect(result).toBeTruthy()
        expect(result.productSizeId).toBe(kondisiData.productSizeId)
        expect(result.size).toBe(kondisiData.size)
        expect(result.ageCategory).toBe(kondisiData.ageCategory)
        expect(result.condition).toBe(kondisiData.condition)
        expect(result.isLegacyFormat).toBe(false)

        // Should preserve linkedSarung data if present
        if (kondisiData.linkedSarung) {
          expect(result.linkedSarung).toEqual(kondisiData.linkedSarung)
        } else {
          expect(result.linkedSarung).toBeUndefined()
        }
      }
    })

    test('parseKondisiAwalEnhanced handles valid pipe format correctly', () => {
      // Test with multiple random samples
      for (let i = 0; i < 50; i++) {
        const pipeString = generatePipeKondisiAwal()
        const result = parseKondisiAwalEnhanced(pipeString)
        const parts = pipeString.split('|')

        // Should successfully parse pipe format
        expect(result).toBeTruthy()
        expect(result.productSizeId).toBe(parts[0])
        expect(result.size).toBe(parts[1])
        expect(result.ageCategory).toBe(parts[2])
        expect(result.condition).toBe(parts[3])
        expect(result.isLegacyFormat).toBe(false)
        expect(result.linkedSarung).toBeUndefined()
      }
    })

    test('extractProductSizeIdEnhanced extracts ID from both formats', () => {
      // Test JSON format
      for (let i = 0; i < 25; i++) {
        const data = generateJsonKondisiAwal()
        const jsonString = JSON.stringify(data)
        const result = extractProductSizeIdEnhanced(jsonString)
        expect(result).toBe(data.productSizeId)
      }

      // Test pipe format
      for (let i = 0; i < 25; i++) {
        const pipeString = generatePipeKondisiAwal()
        const expectedId = pipeString.split('|')[0]
        const result = extractProductSizeIdEnhanced(pipeString)
        expect(result).toBe(expectedId)
      }
    })
  })

  describe('Property 2: Graceful parsing failure handling', () => {
    test('parseKondisiAwalEnhanced handles invalid data gracefully', () => {
      const invalidInputs = [
        '', // empty string
        'invalid-json', // invalid JSON
        '{"incomplete": true}', // JSON without required fields
        'not-uuid|M|ADULT|baik', // pipe format with invalid UUID
        'partial|data', // incomplete pipe format
        null, // null value
        undefined, // undefined value
      ]

      invalidInputs.forEach((invalidData) => {
        // Should not throw errors for any invalid input
        //eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect(() => parseKondisiAwalEnhanced(invalidData as any)).not.toThrow()
        //eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = parseKondisiAwalEnhanced(invalidData as any)

        // Should return valid result object
        expect(result).toBeTruthy()
        expect(typeof result).toBe('object')
        expect(result).toHaveProperty('isLegacyFormat')

        // For null/undefined/empty, should return legacy format
        if (!invalidData) {
          expect(result.isLegacyFormat).toBe(true)
          expect(result.productSizeId).toBeUndefined()
        }
      })
    })

    test('extractProductSizeIdEnhanced returns null for invalid data', () => {
      const invalidInputs = [
        '',
        'invalid-json',
        '{"incomplete": true}',
        'not-uuid|M|ADULT|baik',
        'partial|data',
        null,
        undefined,
      ]

      invalidInputs.forEach((invalidData) => {
        // Should not throw errors for any invalid input
        //eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect(() => extractProductSizeIdEnhanced(invalidData as any)).not.toThrow()
        //eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = extractProductSizeIdEnhanced(invalidData as any)

        // Should return null for invalid data
        expect(result).toBeNull()
      })
    })

    test('parseKondisiAwalEnhanced handles malformed JSON gracefully', () => {
      const malformedJsonInputs = [
        '{"unclosed": true',
        '{invalid: json}',
        '{"productSizeId": }',
        '[not an object]',
        'just a string',
      ]

      malformedJsonInputs.forEach((malformedJson) => {
        // Should not throw for malformed JSON
        expect(() => parseKondisiAwalEnhanced(malformedJson)).not.toThrow()

        const result = parseKondisiAwalEnhanced(malformedJson)

        // Should fallback to pipe format parsing or legacy format
        expect(result).toBeTruthy()
        expect(typeof result.isLegacyFormat).toBe('boolean')
      })
    })

    test('parseKondisiAwalEnhanced handles edge cases consistently', () => {
      const edgeCases = [
        '', // empty string
        '{}', // empty JSON object
        '{"productSizeId": ""}', // JSON with empty productSizeId
        '|||', // pipe format with empty parts
        'single-value', // single value without separators
        '{"productSizeId": null}', // JSON with null productSizeId
      ]

      edgeCases.forEach((edgeCase) => {
        expect(() => parseKondisiAwalEnhanced(edgeCase)).not.toThrow()
        const result = parseKondisiAwalEnhanced(edgeCase)
        expect(result).toBeTruthy()
        expect(typeof result.isLegacyFormat).toBe('boolean')
      })
    })
  })

  describe('Property 3: Pairing data preservation', () => {
    test('linkedSarung data is preserved correctly in JSON format', () => {
      // Test with multiple samples that have linkedSarung
      for (let i = 0; i < 30; i++) {
        const kondisiData = generateJsonKondisiAwal(true) // Force linkedSarung
        if (!kondisiData.linkedSarung) continue // Skip if randomly didn't get linkedSarung

        const jsonString = JSON.stringify(kondisiData)
        const result = parseKondisiAwalEnhanced(jsonString)

        // Should preserve all linkedSarung properties
        expect(result.linkedSarung).toBeTruthy()
        expect(result.linkedSarung?.productId).toBe(kondisiData.linkedSarung?.productId)
        expect(result.linkedSarung?.productSizeId).toBe(kondisiData.linkedSarung?.productSizeId)
        expect(result.linkedSarung?.quantity).toBe(kondisiData.linkedSarung?.quantity)

        if (kondisiData.linkedSarung?.product) {
          expect(result.linkedSarung?.product).toEqual(kondisiData.linkedSarung.product)
        }
      }
    })

    test('pipe format never has linkedSarung data', () => {
      // Test with multiple pipe format samples
      for (let i = 0; i < 30; i++) {
        const pipeString = generatePipeKondisiAwal()
        const result = parseKondisiAwalEnhanced(pipeString)

        // Pipe format should never have linkedSarung
        expect(result.linkedSarung).toBeUndefined()
      }
    })
  })

  describe('Property 4: Backward compatibility', () => {
    test('legacy format detection works correctly', () => {
      const legacyStrings = [
        'baik',
        'rusak',
        'hilang',
        'kondisi lama',
        'text without pipes',
        'legacy|but|not|enough|parts',
        'not-uuid|size|age', // incomplete pipe format
      ]

      legacyStrings.forEach((legacyString) => {
        const result = parseKondisiAwalEnhanced(legacyString)

        // Should be detected as legacy format for non-JSON, non-valid-pipe strings
        if (!legacyString.includes('|') || legacyString.split('|').length < 4) {
          expect(result.isLegacyFormat).toBe(true)
          expect(result.condition).toBe(legacyString)
          expect(result.productSizeId).toBeUndefined()
          expect(result.linkedSarung).toBeUndefined()
        }
      })
    })
  })
})
