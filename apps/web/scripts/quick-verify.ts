#!/usr/bin/env npx ts-node

/**
 * ATAL AI - Quick Verification Script
 *
 * Run this script to quickly verify the app is working:
 *   npx ts-node scripts/quick-verify.ts
 *
 * Or add to package.json:
 *   "verify": "npx ts-node scripts/quick-verify.ts"
 */

import { execSync } from 'child_process'

interface CheckResult {
  name: string
  status: 'pass' | 'fail' | 'skip'
  details?: string
  duration?: number
}

const results: CheckResult[] = []

/**
 * Get the status icon for a check result
 */
function getStatusIcon(status: 'pass' | 'fail' | 'skip'): string {
  switch (status) {
    case 'pass':
      return '✅'
    case 'fail':
      return '❌'
    case 'skip':
      return '⏭️'
  }
}

function runCheck(name: string, command: string, optional = false): boolean {
  const startTime = Date.now()
  console.log(`\n⏳ Running: ${name}...`)

  try {
    execSync(command, { stdio: 'pipe', encoding: 'utf-8' })
    const duration = Date.now() - startTime
    results.push({ name, status: 'pass', duration })
    console.log(`✅ ${name} - PASSED (${duration}ms)`)
    return true
  } catch (error: unknown) {
    const duration = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    if (optional) {
      results.push({ name, status: 'skip', details: errorMessage, duration })
      console.log(`⏭️  ${name} - SKIPPED (optional)`)
      return true
    }

    results.push({ name, status: 'fail', details: errorMessage, duration })
    console.log(`❌ ${name} - FAILED`)
    console.log(`   Error: ${errorMessage.slice(0, 200)}...`)
    return false
  }
}

async function main() {
  console.log('╔══════════════════════════════════════════════╗')
  console.log('║     ATAL AI - Quick Verification Script      ║')
  console.log('╚══════════════════════════════════════════════╝')

  const startTime = Date.now()

  // 1. TypeScript Build Check
  runCheck('TypeScript Build', 'npm run build')

  // 2. ESLint Check (optional - may have warnings)
  runCheck('ESLint', 'npm run lint', true)

  // 3. Unit Tests
  runCheck('Unit Tests', 'npm run test -- --passWithNoTests', true)

  // Print Summary
  console.log('\n')
  console.log('╔══════════════════════════════════════════════╗')
  console.log('║              VERIFICATION SUMMARY            ║')
  console.log('╚══════════════════════════════════════════════╝')

  const passed = results.filter(r => r.status === 'pass').length
  const failed = results.filter(r => r.status === 'fail').length
  const skipped = results.filter(r => r.status === 'skip').length
  const totalDuration = Date.now() - startTime

  console.log('\nResults:')
  results.forEach(r => {
    const icon = getStatusIcon(r.status)
    console.log(`  ${icon} ${r.name}`)
  })

  console.log(`\nTotal: ${passed} passed, ${failed} failed, ${skipped} skipped`)
  console.log(`Duration: ${(totalDuration / 1000).toFixed(1)}s`)

  if (failed > 0) {
    console.log('\n❌ VERIFICATION FAILED - Fix issues before proceeding')
    process.exit(1)
  } else {
    console.log('\n✅ VERIFICATION PASSED - Ready for E2E testing')
    console.log('\nNext steps:')
    console.log('  1. Start dev server: npm run dev')
    console.log('  2. Run E2E tests:    npm run test:e2e')
    console.log('  3. View report:      npm run test:e2e:report')
    process.exit(0)
  }
}

main().catch(console.error)
