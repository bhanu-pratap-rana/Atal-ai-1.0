# Rule.md Compliance Remediation Plan

**Current Compliance Score**: 74/100
**Target Score**: 95+/100
**Estimated Time**: 2-3 weeks

---

## Critical Gaps & How to Fix Them

### 🔴 CRITICAL GAP #1: File Duplication (Violation of Rule 2)

**Issue**: Multiple validation files with overlapping logic
**Current Compliance**: 70% (Rule 2: Strict File Hygiene & No Duplication)

#### Problem Files
```
src/lib/auth-validation.ts          ← Contains validateEmail(), validatePassword()
src/lib/validation-utils.ts         ← Contains SAME functions (different structure)
```

#### Impact
- Maintenance nightmare: Changes needed in 2+ places
- Confusion about which to use
- Code duplication violation

#### Remediation Steps (Estimated: 4 hours)

**Step 1: Audit Current Usage**
```bash
# Find all imports of both files
grep -r "from.*auth-validation" apps/web/src/
grep -r "from.*validation-utils" apps/web/src/
```

**Step 2: Consolidate to Single Source**
```typescript
// Keep: src/lib/validation-utils.ts (already comprehensive)
// Delete: src/lib/auth-validation.ts

// Migration:
- Move any unique logic from auth-validation.ts to validation-utils.ts
- Update all imports across codebase
- Run tests to verify
```

**Step 3: Update Imports**
```typescript
// OLD
import { validateEmail } from '@/lib/auth-validation'

// NEW
import { validateEmail } from '@/lib/validation-utils'
```

**Step 4: Verify & Test**
```bash
npm run lint       # Should pass
npm run test       # All tests pass
npm run build      # Clean build
```

---

### 🔴 CRITICAL GAP #2: Incident Response Plan (Violation of Rule 4)

**Issue**: No documented incident response procedures
**Current Compliance**: 0% (Rule 4: Incident Response)

#### Problem
- No runbook for RLS failures
- No rollback procedures
- No notification procedures
- Risk: Production outage with no recovery plan

#### Required Artifacts

**1. Create `docs/INCIDENT_RESPONSE.md`**
```markdown
# Incident Response Runbook

## RLS/Auth Failure

### Detection
- Monitor for auth errors in Sentry
- Set alert threshold

### Immediate Response (0-5 min)
1. Verify issue scope (1 user vs all users)
2. Open incident channel (#incidents Slack)
3. Declare incident severity (P1/P2/P3)

### Diagnosis (5-15 min)
- Check Supabase dashboard
- Review recent RLS policy changes
- Check database logs
- Identify affected tables/policies

### Remediation (15-30 min)
- If RLS policy is broken:
  1. Git checkout to last known-good policy
  2. Create rollback migration
  3. Run: supabase db push
  4. Verify functionality

- If auth flow is broken:
  1. Check server action code
  2. Review git diff of recent changes
  3. Revert to last working commit if needed
  4. Test in staging first

### Notification (30+ min)
- Update incident status
- Notify stakeholders
- Create post-mortem

### Post-Incident (Next Day)
- Root cause analysis
- Process improvement
- Prevention measures
```

**2. Create Rollback Migration Template**
```sql
-- migrations/rollback_[name].sql
-- Purpose: Rollback RLS policy changes from [date]
-- Run if: [specific scenario]

-- Backup current policy
CREATE TABLE IF NOT EXISTS _policy_backup_[date] AS
SELECT * FROM pg_policies WHERE tablename = '[table_name]';

-- Restore previous version
DROP POLICY IF EXISTS [policy_name] ON [table_name];

CREATE POLICY [policy_name] ON [table_name]
  FOR [SELECT|INSERT|UPDATE|DELETE]
  USING ([previous_condition]);

-- Verify
SELECT * FROM pg_policies WHERE tablename = '[table_name]';
```

**3. Create Notification Procedure**
```markdown
# Notification Procedure

## Slack Channels
- Production Issues: #incidents (declare incident here)
- On-Call: @devops-oncall
- Management: #ops-incidents

## Message Template
```
🚨 INCIDENT: [Severity]
Component: [Auth/RLS/Database/API]
Status: Investigating
Impact: [Description]
ETA: [Time estimate]
```

## Rollback Decision
- P1 (All users affected): Initiate rollback immediately
- P2 (Some users): Investigate for 15 min, then rollback
- P3 (Specific feature): Can investigate up to 1 hour
```

#### Implementation Checklist
- [ ] Create `docs/INCIDENT_RESPONSE.md`
- [ ] Create rollback migration template
- [ ] Document notification procedure
- [ ] Setup Slack channels
- [ ] Setup on-call rotation
- [ ] Conduct incident response drill
- [ ] Document lessons learned

---

### 🔴 CRITICAL GAP #3: Secrets & Environment (Violation of Rule 3, Section E)

**Issue**: Incomplete `.env.example` and secret management
**Current Compliance**: 60% (Rule 3: Secrets & Env)

#### Problems
- `.env.example` may be missing or incomplete
- No documentation of required variables
- No secret rotation procedure
- Risk: Missing environment variable on deployment

#### Remediation Steps (Estimated: 2 hours)

**Step 1: Create Complete `.env.example`**
```bash
# apps/web/.env.example
# ============================================================
# CRITICAL: Copy this file to .env and fill in all values
# NEVER commit .env (it contains secrets)
# ============================================================

# SUPABASE CONFIG
# Get from: https://supabase.co/dashboard/project/[id]/settings/api
NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...          # Publishable key
SUPABASE_SERVICE_ROLE_KEY=eyJ...             # DO NOT commit! Use Vercel env

# DATABASE
# Managed by Supabase, do NOT change
NEXT_PUBLIC_DATABASE_URL=postgresql://...

# AUTHENTICATION
# For OTP sending via Supabase
SUPABASE_AUTH_REDIRECT_TO=http://localhost:3000

# RATE LIMITING (Production)
# Optional: Set for Redis-based rate limiting
REDIS_URL=redis://localhost:6379             # Format: redis://[user]:[pass]@[host]:[port]
REDIS_PASSWORD=your-password                 # If Redis is password-protected

# ERROR TRACKING (Production)
# Get from: https://sentry.io/
NEXT_PUBLIC_SENTRY_DSN=https://...

# FEATURE FLAGS
# Enable/disable features
NEXT_PUBLIC_ENABLE_ANALYTICS=false
NEXT_PUBLIC_ENABLE_ADMIN_DASHBOARD=false

# DEPLOYMENT
# Set to 'production', 'staging', or 'development'
NODE_ENV=development
NEXT_PUBLIC_ENVIRONMENT=development
```

**Step 2: Create Secret Rotation Procedure**
```markdown
# Secret Rotation Procedure

## Monthly Rotation Checklist

### Supabase Keys
- [ ] Generate new anon key in Supabase dashboard
- [ ] Update NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel
- [ ] Update .env.example with comment: "Rotated on [date]"
- [ ] Test in staging environment
- [ ] Notify team in #ops-secrets

### Redis Password (if applicable)
- [ ] SSH to Redis server
- [ ] Run: `CONFIG SET requirepass "new-password"`
- [ ] Update REDIS_PASSWORD in Vercel
- [ ] Test connection
- [ ] Save new password to 1Password

### Database Credentials
- [ ] Use Supabase dashboard to rotate service role key
- [ ] Update SUPABASE_SERVICE_ROLE_KEY in Vercel
- [ ] Test in staging
- [ ] Document rotation date

### Sentry DSN
- [ ] If compromised, rotate from Sentry dashboard
- [ ] Update NEXT_PUBLIC_SENTRY_DSN
- [ ] Test error reporting

## Rotation Record
| Secret | Last Rotated | Next Due | Status |
|--------|-------------|----------|---------|
| Anon Key | 2024-01-15 | 2024-02-15 | OK |
| Service Key | 2024-01-15 | 2024-02-15 | OK |
| Redis Pass | N/A | N/A | N/A |
```

---

### 🟡 GAP #4: Sequential Thinking Procedure (Violation of Rule 1)

**Issue**: No documented sequential thinking checklist applied consistently
**Current Compliance**: 50% (Rule 1: Pre-change verification)

#### Problem
- Developers skip root cause analysis
- Band-aid fixes applied without investigation
- Inconsistent debugging approach

#### Solution: Pre-Change Checklist

**Create `docs/PRE_CHANGE_CHECKLIST.md`**
```markdown
# Pre-Change Checklist (Required Before Every PR)

## For ALL Changes
- [ ] Is this fixing a symptom or root cause?
- [ ] Have I traced the data flow end-to-end?
- [ ] Are there similar issues elsewhere in the codebase?
- [ ] Does this follow existing patterns?

## For Auth/RLS Changes
- [ ] Checked `git log --oneline -- [file]` (last 5 commits)
- [ ] Reviewed `supabase` MCP for table schema & RLS policies
- [ ] Drafted Playwright smoke test
- [ ] Tested in staging with fresh database state
- [ ] Verified backward compatibility

## For Database Changes
- [ ] Created migration file (not ad-hoc SQL)
- [ ] Tested migration rollback
- [ ] Added index if creating new queries
- [ ] Checked RLS policies on affected tables

## For Validation/Error Handling
- [ ] Used root cause analysis template
- [ ] Added logging with context
- [ ] No try/catch without understanding failure mode
- [ ] Verified error message is user-friendly

## Root Cause Analysis Template
```
ERROR: [Error message]
SYMPTOM: [What user observes]
SUSPECTED CAUSE: [Initial hypothesis]
DATA FLOW TRACE:
  1. User action: [What triggered it]
  2. Code path: [File → Function → Line]
  3. External dependency: [Database query, API call, etc.]
  4. Response: [What was returned]
  5. Where it failed: [Exact location]
ROOT CAUSE: [Why it actually happened, not just what]
FIX: [Solution addressing root cause, not symptom]
TEST: [How to verify fix]
```

Example:
```
ERROR: "Email must have format: user@example.com"
SYMPTOM: Teacher can't register with valid email
DATA FLOW TRACE:
  1. Submit form with email "test+tag@school.co.uk"
  2. validateEmail() in src/lib/validation-utils.ts:43
  3. Regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ at line 50
  4. Should pass (contains + and international TLD)
  5. Failed because TLD validator doesn't include 'co.uk'
ROOT CAUSE: VALID_TLDS array at line 32 doesn't include 'co.uk'
FIX: Add 'co.uk' to VALID_TLDS array
TEST: validateEmail('test@school.co.uk') should return {valid: true}
```

## Before Committing
- [ ] Ran `npm run lint` (0 errors)
- [ ] Ran `npm run test` (all tests pass)
- [ ] Ran `npm run build` (0 TypeScript errors)
- [ ] Wrote meaningful commit message
- [ ] Added relevant test cases
```

---

### 🟡 GAP #5: Rate Limiter Duplication

**Issue**: Both in-memory and distributed rate limiters
**Current Compliance**: 85% (Already mostly fixed with factory pattern)

#### Current State (GOOD)
```typescript
// Factory pattern already used (CORRECT!)
export function createRateLimiter(
  config: RateLimitConfig,
  redisClient?: RedisClient
): IRateLimiter {
  if (redisClient) {
    return new RedisRateLimiter(config, redisClient)
  }
  return new InMemoryRateLimiter(config)
}
```

#### Recommendation: Remove Old File
```bash
# If src/lib/rate-limiter.ts exists and is not used:
rm src/lib/rate-limiter.ts

# Update imports to use:
import { createRateLimiter } from '@/lib/rate-limiter-distributed'
```

---

## Implementation Timeline

### Week 1: Critical Issues
| Task | Time | Priority |
|---|---|---|
| Consolidate validation files | 4h | 🔴 P0 |
| Create incident response runbook | 3h | 🔴 P0 |
| Complete `.env.example` | 2h | 🔴 P0 |
| Create secret rotation procedure | 2h | 🔴 P0 |
| **Total** | **11h** | |

### Week 2: High Priority
| Task | Time | Priority |
|---|---|---|
| Create pre-change checklist | 2h | 🟡 P1 |
| Audit for other duplications | 3h | 🟡 P1 |
| Create CI/CD checklist | 2h | 🟡 P1 |
| Document database practices | 2h | 🟡 P1 |
| **Total** | **9h** | |

### Week 3: Verification
| Task | Time | Priority |
|---|---|---|
| Conduct security review | 4h | 🟡 P1 |
| Test all procedures | 3h | 🟡 P1 |
| Update documentation | 2h | 🟡 P1 |
| **Total** | **9h** | |

---

## Verification Checklist

### After Remediation Complete
```
Code Quality
- [ ] All files consolidated (no duplicates)
- [ ] Linter passes (0 errors)
- [ ] Build passes (0 errors)
- [ ] All tests pass (146+ tests)

Documentation
- [ ] INCIDENT_RESPONSE.md created
- [ ] .env.example complete
- [ ] Secret rotation documented
- [ ] Pre-change checklist created
- [ ] Sequential thinking documented

Security
- [ ] RLS policies audit complete
- [ ] Secrets not in Git
- [ ] Service role key rotation procedure
- [ ] Incident response drill completed

Testing
- [ ] Playwright smoke tests pass
- [ ] All unit tests pass
- [ ] Integration tests pass
- [ ] Rollback migration tested

Compliance Score: 74 → 95+ ✅
```

---

## Success Criteria

**Remediation Complete When:**
1. ✅ All duplicate files consolidated
2. ✅ Incident response runbook tested
3. ✅ `.env.example` complete & documented
4. ✅ Secret rotation procedure in place
5. ✅ Pre-change checklist used for next 3 PRs
6. ✅ Compliance score reaches 95+
7. ✅ All procedures documented & tested

---

## Owner Assignment

| Task | Owner | Due Date |
|---|---|---|
| File consolidation | Engineering Lead | This week |
| Incident response | DevOps/On-call | This week |
| Secret management | Security Team | This week |
| Documentation | Tech writer | Next week |
| Verification | QA Lead | Following week |

---

**Report Prepared**: November 23, 2025
**Next Review**: After remediation complete
**Status**: Ready for implementation
