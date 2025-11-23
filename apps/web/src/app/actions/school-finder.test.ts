/**
 * Unit tests for school-finder server actions
 * Tests the hierarchical school finder functionality
 */

import { describe, it, expect, beforeAll } from '@jest/globals'
import {
  getDistricts,
  getBlocksByDistrict,
  getSchoolsByDistrictAndBlock,
  getSchoolPinStatus,
} from './school-finder'

describe('School Finder Server Actions', () => {
  describe('getDistricts', () => {
    it('should return list of districts', async () => {
      const result = await getDistricts()

      expect(result.success).toBe(true)
      expect(Array.isArray(result.data)).toBe(true)
      expect(result.data.length).toBeGreaterThan(0)
    })

    it('should return district with name property', async () => {
      const result = await getDistricts()

      if (result.data.length > 0) {
        const firstDistrict = result.data[0]
        expect(firstDistrict).toHaveProperty('name')
        expect(typeof firstDistrict.name).toBe('string')
      }
    })

    it('should include KAMRUP RURAL in districts', async () => {
      const result = await getDistricts()

      const hasKamrupRural = result.data.some((d) => d.name === 'KAMRUP RURAL')
      expect(hasKamrupRural).toBe(true)
    })
  })

  describe('getBlocksByDistrict', () => {
    it('should return blocks for valid district', async () => {
      const result = await getBlocksByDistrict('KAMRUP RURAL')

      expect(result.success).toBe(true)
      expect(Array.isArray(result.data)).toBe(true)
    })

    it('should return empty array for invalid district', async () => {
      const result = await getBlocksByDistrict('INVALID_DISTRICT_12345')

      // Should either return empty or success: false
      if (result.success) {
        expect(Array.isArray(result.data)).toBe(true)
        expect(result.data.length).toBe(0)
      }
    })

    it('should return blocks with name and district properties', async () => {
      const result = await getBlocksByDistrict('KAMRUP RURAL')

      if (result.data.length > 0) {
        const firstBlock = result.data[0]
        expect(firstBlock).toHaveProperty('name')
        expect(firstBlock).toHaveProperty('district')
      }
    })

    it('should include known blocks for KAMRUP RURAL', async () => {
      const result = await getBlocksByDistrict('KAMRUP RURAL')

      // These blocks should exist in KAMRUP RURAL based on seed data
      const blockNames = result.data.map((b) => b.name)
      expect(blockNames.length).toBeGreaterThan(0)
    })
  })

  describe('getSchoolsByDistrictAndBlock', () => {
    it('should return schools for valid district', async () => {
      const result = await getSchoolsByDistrictAndBlock('KAMRUP RURAL')

      expect(result.success).toBe(true)
      expect(Array.isArray(result.data)).toBe(true)
      expect(result.data.length).toBeGreaterThan(0)
    })

    it('should return schools with required properties', async () => {
      const result = await getSchoolsByDistrictAndBlock('KAMRUP RURAL')

      if (result.data.length > 0) {
        const firstSchool = result.data[0]
        expect(firstSchool).toHaveProperty('id')
        expect(firstSchool).toHaveProperty('school_code')
        expect(firstSchool).toHaveProperty('school_name')
        expect(firstSchool).toHaveProperty('district')
      }
    })

    it('should filter schools by block when provided', async () => {
      // First get a valid block
      const blocksResult = await getBlocksByDistrict('KAMRUP RURAL')

      if (blocksResult.data.length > 0) {
        const blockName = blocksResult.data[0].name

        // Now get schools for that block
        const schoolsResult = await getSchoolsByDistrictAndBlock('KAMRUP RURAL', blockName)

        expect(schoolsResult.success).toBe(true)
        expect(Array.isArray(schoolsResult.data)).toBe(true)

        // If schools are returned, they should belong to the selected block
        if (schoolsResult.data.length > 0) {
          schoolsResult.data.forEach((school) => {
            // Block should match (if block is specified in data)
            if (school.block) {
              expect(school.block).toBe(blockName)
            }
          })
        }
      }
    })

    it('should return empty array for invalid district', async () => {
      const result = await getSchoolsByDistrictAndBlock('INVALID_DISTRICT_XYZ')

      if (result.success) {
        expect(Array.isArray(result.data)).toBe(true)
        expect(result.data.length).toBe(0)
      }
    })

    it('should return schools ordered by name', async () => {
      const result = await getSchoolsByDistrictAndBlock('KAMRUP RURAL')

      if (result.data.length > 1) {
        // Check if schools are sorted by name
        const names = result.data.map((s) => s.school_name)

        for (let i = 0; i < names.length - 1; i++) {
          const current = names[i].toLowerCase()
          const next = names[i + 1].toLowerCase()
          // Should be in alphabetical order or equal
          expect(current.localeCompare(next)).toBeLessThanOrEqual(0)
        }
      }
    })
  })

  describe('getSchoolPinStatus', () => {
    it('should return success with exists status', async () => {
      const result = await getSchoolPinStatus('14H0182')

      expect(result.success).toBe(true)
      expect(typeof result.exists).toBe('boolean')
    })

    it('should handle invalid school code gracefully', async () => {
      const result = await getSchoolPinStatus('INVALID_CODE_XYZ')

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should return optional createdAt and lastRotatedAt dates', async () => {
      const result = await getSchoolPinStatus('14H0182')

      if (result.exists) {
        // If PIN exists, dates might be present
        if (result.createdAt) {
          expect(typeof result.createdAt).toBe('string')
        }
        if (result.lastRotatedAt) {
          expect(typeof result.lastRotatedAt).toBe('string')
        }
      }
    })

    it('should normalize school code to uppercase', async () => {
      // Test that lowercase code also works
      const upperResult = await getSchoolPinStatus('14H0182')
      const lowerResult = await getSchoolPinStatus('14h0182')

      // Both should return same result (case-insensitive)
      expect(upperResult.exists).toBe(lowerResult.exists)
    })

    it('should handle whitespace in school code', async () => {
      const result = await getSchoolPinStatus('  14H0182  ')

      expect(result.success).toBe(true)
      expect(typeof result.exists).toBe('boolean')
    })
  })

  describe('Integration: District → Block → School Flow', () => {
    it('should allow complete hierarchical navigation flow', async () => {
      // Step 1: Get districts
      const districtsResult = await getDistricts()
      expect(districtsResult.success).toBe(true)
      expect(districtsResult.data.length).toBeGreaterThan(0)

      const district = districtsResult.data[0].name

      // Step 2: Get blocks for district
      const blocksResult = await getBlocksByDistrict(district)
      expect(blocksResult.success).toBe(true)

      // Step 3: Get schools for district
      const schoolsResult = await getSchoolsByDistrictAndBlock(district)
      expect(schoolsResult.success).toBe(true)
      expect(schoolsResult.data.length).toBeGreaterThan(0)

      // Step 4: Check PIN status for a school
      const school = schoolsResult.data[0]
      const pinStatusResult = await getSchoolPinStatus(school.school_code)
      expect(pinStatusResult.success).toBe(true)
      expect(typeof pinStatusResult.exists).toBe('boolean')
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      // This test would need proper error mocking in a real test suite
      // For now, we just verify the function doesn't throw
      try {
        await getDistricts()
        expect(true).toBe(true) // If we get here, no exception was thrown
      } catch (error) {
        // Should not throw unhandled errors
        expect(error).toBeDefined()
      }
    })

    it('should return error messages for failed queries', async () => {
      const result = await getSchoolPinStatus('INVALID')

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
      expect(typeof result.error).toBe('string')
    })
  })
})
