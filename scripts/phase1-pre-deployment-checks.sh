#!/bin/bash
#
# Phase 1 Pre-Deployment Verification Script
# This script performs all pre-deployment checks before deploying Phase 1 fixes
#
# Usage: bash scripts/phase1-pre-deployment-checks.sh
#
# Exit codes:
#   0 = All checks passed
#   1 = Critical check failed
#   2 = Warning but can proceed
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
CRITICAL_FAILURES=0
WARNINGS=0
PASSED_CHECKS=0

# Timestamp
TIMESTAMP=$(date -u +"%Y-%m-%d %H:%M:%S UTC")

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Phase 1 Pre-Deployment Verification${NC}"
echo -e "${BLUE}Started: $TIMESTAMP${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Function to log passed check
check_pass() {
  echo -e "${GREEN}✅ PASS${NC}: $1"
  ((PASSED_CHECKS++))
}

# Function to log warning
check_warn() {
  echo -e "${YELLOW}⚠️  WARN${NC}: $1"
  ((WARNINGS++))
}

# Function to log critical failure
check_fail() {
  echo -e "${RED}❌ FAIL${NC}: $1"
  ((CRITICAL_FAILURES++))
}

# ============================================================================
# SECTION 1: Environment Verification
# ============================================================================
echo -e "${BLUE}[1/5] Environment Verification${NC}"
echo "---"

# Check Node.js version
if command -v node &> /dev/null; then
  NODE_VERSION=$(node -v)
  check_pass "Node.js installed: $NODE_VERSION"
else
  check_fail "Node.js not installed"
fi

# Check npm version
if command -v npm &> /dev/null; then
  NPM_VERSION=$(npm -v)
  check_pass "npm installed: $NPM_VERSION"
else
  check_fail "npm not installed"
fi

# Check git
if command -v git &> /dev/null; then
  GIT_VERSION=$(git --version)
  check_pass "$GIT_VERSION"
  GIT_BRANCH=$(git branch --show-current)
  if [ "$GIT_BRANCH" == "main" ] || [ "$GIT_BRANCH" == "master" ]; then
    check_pass "On main branch: $GIT_BRANCH"
  else
    check_warn "Not on main branch, on: $GIT_BRANCH"
  fi
else
  check_fail "git not installed"
fi

# Check for uncommitted changes
if [ -z "$(git status --porcelain)" ]; then
  check_pass "No uncommitted changes"
else
  check_warn "Uncommitted changes exist (stash if deploying critical path)"
fi

# Check environment variables
echo ""
echo "Checking environment variables..."
ENV_VARS=("SUPABASE_URL" "SUPABASE_ANON_KEY" "DATABASE_URL")
for var in "${ENV_VARS[@]}"; do
  if [ -z "${!var}" ]; then
    check_fail "Missing environment variable: $var"
  else
    check_pass "Environment variable set: $var"
  fi
done

echo ""

# ============================================================================
# SECTION 2: Build Verification
# ============================================================================
echo -e "${BLUE}[2/5] Build Verification${NC}"
echo "---"

# Check if dependencies are installed
if [ -d "node_modules" ]; then
  check_pass "node_modules directory exists"
else
  check_warn "node_modules not found, will be installed during build"
fi

# Build the application
echo "Building application (this may take 1-2 minutes)..."
if npm run build > /tmp/build.log 2>&1; then
  check_pass "Application build successful"

  # Check build output for errors
  if grep -q "error" /tmp/build.log; then
    ERRORS=$(grep "error" /tmp/build.log | wc -l)
    check_warn "Build log contains $ERRORS error mentions (review log)"
  else
    check_pass "No errors in build log"
  fi
else
  check_fail "Application build failed"
  echo "Build log (last 20 lines):"
  tail -20 /tmp/build.log
fi

# TypeScript strict mode check
echo ""
echo "Checking TypeScript strict mode..."
if npx tsc --noEmit 2>&1 | tee /tmp/tsc.log | grep -q "error"; then
  TSERRORS=$(grep "error" /tmp/tsc.log | wc -l)
  check_fail "TypeScript errors found: $TSERRORS"
  grep "error" /tmp/tsc.log | head -10
else
  check_pass "TypeScript strict mode passed (0 errors)"
fi

echo ""

# ============================================================================
# SECTION 3: Code Quality Verification
# ============================================================================
echo -e "${BLUE}[3/5] Code Quality Verification${NC}"
echo "---"

# Check for modified files
echo "Verifying Phase 1 changes are present..."

FILES_TO_CHECK=(
  "apps/db/migrations/051_add_upsert_student_profile.sql"
  "src/lib/constants/rate-limits.ts"
  "src/lib/rate-limiter-distributed.ts"
  "src/app/actions/auth.ts"
  "src/app/actions/student.ts"
  "src/app/actions/teacher.ts"
)

for file in "${FILES_TO_CHECK[@]}"; do
  if [ -f "$file" ]; then
    check_pass "File exists: $file"
  else
    check_fail "Critical file missing: $file"
  fi
done

echo ""
echo "Verifying Phase 1 changes are implemented..."

# Check for email enumeration rate limit
if grep -q "emailEnumeration" src/lib/constants/rate-limits.ts; then
  check_pass "Email enumeration rate limit configured"
else
  check_warn "Email enumeration rate limit not found (may not be implemented)"
fi

# Check for UPSERT function
if grep -q "upsert_student_profile" apps/db/migrations/051_add_upsert_student_profile.sql; then
  check_pass "UPSERT function defined in migration 051"
else
  check_fail "UPSERT function not found in migration 051"
fi

# Check for class ownership re-verification
if grep -q "Access denied: Class no longer owned" src/app/actions/teacher.ts; then
  check_pass "Class ownership re-verification implemented"
else
  check_warn "Class ownership re-verification not found (may not be implemented)"
fi

echo ""

# ============================================================================
# SECTION 4: Database Verification
# ============================================================================
echo -e "${BLUE}[4/5] Database Verification${NC}"
echo "---"

# Check database connectivity
if command -v psql &> /dev/null; then
  echo "Testing database connectivity..."
  if psql "$DATABASE_URL" -c "SELECT version();" > /dev/null 2>&1; then
    check_pass "Database connection successful"

    # Get PostgreSQL version
    PG_VERSION=$(psql "$DATABASE_URL" -t -c "SELECT version();" 2>/dev/null | cut -d' ' -f2)
    check_pass "PostgreSQL version: $PG_VERSION"
  else
    check_fail "Cannot connect to database"
  fi

  echo ""

  # Check migration file syntax
  if [ -f "apps/db/migrations/051_add_upsert_student_profile.sql" ]; then
    echo "Checking migration syntax..."
    if grep -q "CREATE OR REPLACE FUNCTION" apps/db/migrations/051_add_upsert_student_profile.sql && \
       grep -q "ON CONFLICT" apps/db/migrations/051_add_upsert_student_profile.sql; then
      check_pass "Migration syntax appears valid"
    else
      check_warn "Migration syntax check inconclusive (requires manual review)"
    fi
  fi
else
  check_warn "psql not found, skipping database checks"
fi

echo ""

# ============================================================================
# SECTION 5: Deployment Readiness
# ============================================================================
echo -e "${BLUE}[5/5] Deployment Readiness Checklist${NC}"
echo "---"

# Check for backup plan
if [ -f "PHASE-1-ROLLBACK-PROCEDURE.md" ]; then
  check_pass "Rollback procedure documented"
else
  check_warn "Rollback procedure not found"
fi

# Check for deployment guide
if [ -f "PHASE-1-PRODUCTION-DEPLOYMENT-GUIDE.md" ]; then
  check_pass "Deployment guide available"
else
  check_warn "Deployment guide not found"
fi

# Check for test coverage
if [ -f "apps/web/test-artifacts/assessment-system-test-results.json" ] || \
   [ -f "apps/web/test-artifacts/student-pages-test-results.json" ]; then
  check_pass "Test results available"
else
  check_warn "Test results not found (run e2e tests before deploying)"
fi

# Check for git tags
if git tag | grep -q "phase1\|Phase1"; then
  LATEST_TAG=$(git tag | grep -i phase1 | tail -1)
  check_pass "Phase 1 git tag exists: $LATEST_TAG"
else
  check_warn "No Phase 1 git tag found (recommend creating one)"
fi

echo ""

# ============================================================================
# SUMMARY
# ============================================================================
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Verification Summary${NC}"
echo -e "${BLUE}========================================${NC}"

echo -e "Passed checks:        ${GREEN}$PASSED_CHECKS${NC}"
echo -e "Warnings:             ${YELLOW}$WARNINGS${NC}"
echo -e "Critical failures:    ${RED}$CRITICAL_FAILURES${NC}"

echo ""

if [ $CRITICAL_FAILURES -eq 0 ]; then
  echo -e "${GREEN}✅ All critical checks passed!${NC}"
  if [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ No warnings - ready for deployment${NC}"
    EXIT_CODE=0
  else
    echo -e "${YELLOW}⚠️  $WARNINGS warnings found - review before deploying${NC}"
    EXIT_CODE=2
  fi
else
  echo -e "${RED}❌ Critical failures detected - DO NOT DEPLOY${NC}"
  echo -e "${RED}Fix the failures above before attempting deployment${NC}"
  EXIT_CODE=1
fi

echo ""
echo -e "${BLUE}Completed: $(date -u +"%Y-%m-%d %H:%M:%S UTC")${NC}"
echo -e "${BLUE}========================================${NC}"

# Log results
LOG_FILE="phase1-deployment-verification-$(date +%Y%m%d-%H%M%S).log"
{
  echo "Phase 1 Pre-Deployment Verification Log"
  echo "Started: $TIMESTAMP"
  echo "Ended: $(date -u +"%Y-%m-%d %H:%M:%S UTC")"
  echo ""
  echo "Results:"
  echo "  Passed: $PASSED_CHECKS"
  echo "  Warnings: $WARNINGS"
  echo "  Failures: $CRITICAL_FAILURES"
  echo ""
  echo "Exit Code: $EXIT_CODE"
} > "$LOG_FILE"

echo "Verification log saved to: $LOG_FILE"

exit $EXIT_CODE
