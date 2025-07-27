/**
 * Unit Tests for TransactionCodeGenerator Enhanced Features
 * 
 * Tests the new UUID detection and parameter type detection functionality
 * added in the iterative enhancement phase.
 */

import { TransactionCodeGenerator } from './codeGenerator'

describe('TransactionCodeGenerator Enhanced Features', () => {
  describe('UUID Validation', () => {
    test('should validate correct UUID v4 format', () => {
      const validUUIDs = [
        '53229bd2-cfd9-4a7f-a268-2fd07da97b34',
        '12345678-1234-4567-8901-123456789012',
        'a1b2c3d4-e5f6-4a7b-8c9d-e1f2a3b4c5d6'
      ]

      validUUIDs.forEach(uuid => {
        expect(TransactionCodeGenerator.validateUUID(uuid)).toBe(true)
      })
    })

    test('should reject invalid UUID formats', () => {
      const invalidUUIDs = [
        'not-a-uuid',
        '12345',
        'TXN-20250726-001',
        '53229bd2-cfd9-4a7f-a268', // too short
        '53229bd2-cfd9-4a7f-a268-2fd07da97b34-extra', // too long
        '53229bd2_cfd9_4a7f_a268_2fd07da97b34', // wrong separator
        '', // empty string
        null,
        undefined
      ]

      invalidUUIDs.forEach(uuid => {
        expect(TransactionCodeGenerator.validateUUID(uuid as string)).toBe(false)
      })
    })
  })

  describe('Parameter Type Detection', () => {
    test('should correctly detect UUID parameters', () => {
      const uuidParams = [
        '53229bd2-cfd9-4a7f-a268-2fd07da97b34',
        '12345678-1234-4567-8901-123456789012'
      ]

      uuidParams.forEach(param => {
        expect(TransactionCodeGenerator.detectParameterType(param)).toBe('uuid')
      })
    })

    test('should correctly detect transaction code parameters', () => {
      const codeParams = [
        'TXN-20250726-001',
        'TXN-20250101-999',
        'TXN-20231225-123'
      ]

      codeParams.forEach(param => {
        expect(TransactionCodeGenerator.detectParameterType(param)).toBe('code')
      })
    })

    test('should correctly detect invalid parameters', () => {
      const invalidParams = [
        'invalid-format',
        'abc123',
        'TXN-INVALID',
        '53229bd2-cfd9-4a7f', // incomplete UUID
        'TXN-20250726', // incomplete transaction code
        '',
        'just-text'
      ]

      invalidParams.forEach(param => {
        expect(TransactionCodeGenerator.detectParameterType(param)).toBe('invalid')
      })
    })
  })

  describe('Existing Transaction Code Functionality', () => {
    test('should still validate transaction codes correctly', () => {
      const validCodes = [
        'TXN-20250726-001',
        'TXN-20250101-999',
        'TXN-20231225-123'
      ]

      validCodes.forEach(code => {
        expect(TransactionCodeGenerator.validateTransactionCode(code)).toBe(true)
      })
    })

    test('should reject invalid transaction codes', () => {
      const invalidCodes = [
        'invalid',
        'TXN-INVALID',
        '53229bd2-cfd9-4a7f-a268-2fd07da97b34', // UUID should fail transaction code validation
        'TXN-20250726', // incomplete
        'TXN-20250726-A01' // non-numeric sequence
      ]

      invalidCodes.forEach(code => {
        expect(TransactionCodeGenerator.validateTransactionCode(code)).toBe(false)
      })
    })
  })
})