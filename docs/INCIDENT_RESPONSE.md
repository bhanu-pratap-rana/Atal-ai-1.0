# Incident Response Runbook

**Version**: 1.0
**Last Updated**: November 23, 2025
**Owner**: DevOps Team
**Status**: Active

---

## Overview

This runbook provides procedures for responding to critical incidents affecting ATAL AI platform, specifically RLS/Auth failures, database issues, and service degradation.

---

## Quick Reference

| Incident Type | Severity | Response Time | Resolution Time |
|---|---|---|---|
| RLS policy broken (no access) | P1 | Immediate | < 15 min |
| Auth flow broken (all users) | P1 | Immediate | < 15 min |
| Database query failure | P1 | Immediate | < 30 min |
| Single user auth issue | P2 | 5 minutes | < 1 hour |
| Email delivery delay | P3 | 30 minutes | < 4 hours |
| UI/UX bug (non-blocking) | P3 | 1 hour | < 1 day |

---

## 1. RLS/Auth Failure - CRITICAL (P1)

### Detection (0-2 min)

**Automated Alerts:**
- Sentry: `auth_error` rate > 10 per minute
- Database: `permission denied` errors in Postgres logs
- Application: Users unable to login/access dashboard

**Manual Check:**
```bash
# SSH to application server
# Check recent errors in logs
tail -f logs/auth.log | grep -i error

# Check Sentry dashboard for error patterns
# URL: https://sentry.io/organizations/atal-ai/issues/
```

### Immediate Response (2-5 min)

1. **Declare Incident**
   ```
   📍 In #incidents Slack channel:

   🚨 INCIDENT: RLS/Auth Failure (P1)
   Component: Authentication / Row Level Security
   Status: Investigating
   Impact: Users unable to login (Estimated X users affected)
   ETA: 15 minutes
   Owner: @on-call-devops
   ```

2. **Notification Procedure**
   - Notify DevOps on-call: `@devops-oncall`
   - Notify backend engineers: `@backend-engineers`
   - Update status page: `https://status.atal-ai.com`

3. **Gather Information**
   ```bash
   # Check RLS policies are active
   psql -h db.supabase.co -U postgres -d postgres

   SELECT * FROM pg_policies
   WHERE tablename IN ('users', 'classes', 'students', 'teachers')
   LIMIT 10;

   # Check error rates in application logs
   # Check Git log for recent commits to auth or RLS
   git log --oneline --since="1 hour ago" -- src/lib/auth* supabase/migrations/
   ```

### Diagnosis (5-15 min)

**Step 1: Check RLS Policies**
```bash
# Connect to Supabase Postgres
psql postgresql://postgres:[password]@db.supabase.co:5432/postgres

# List all policies
SELECT schemaname, tablename, policyname, permissive, roles, qual, with_check
FROM pg_policies
ORDER BY tablename, policyname;

# Check specific table (example: users)
SELECT * FROM pg_policies WHERE tablename = 'users';
```

**Step 2: Review Recent Changes**
```bash
# Check recent migrations
ls -lah supabase/migrations/ | tail -5

# Review recent auth-related commits
git log -p --since="2 hours ago" -- src/lib/auth* supabase/migrations/ | head -200

# Check for syntax errors in migrations
grep -r "CREATE POLICY\|ALTER POLICY" supabase/migrations/ | tail -10
```

**Step 3: Test Auth Flow**
```bash
# Manual test with curl (if service is accessible)
curl -X POST "https://api.atal-ai.com/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# Check Supabase dashboard for auth method status
# URL: https://supabase.co/dashboard/project/[project-id]/settings/auth
```

**Step 4: Check Database Logs**
```bash
# In Supabase dashboard:
# 1. Go to Logs → Postgres Logs
# 2. Filter for: "permission denied" OR "no rows" OR "policy violation"
# 3. Look for common patterns or tables affected
```

### Remediation (15-30 min)

**If RLS Policy is Broken:**

1. **Quick Rollback (Fastest)**
   ```bash
   # Find the problematic migration
   ls supabase/migrations/ | grep -i "ats\|role\|policy"

   # Create rollback migration
   cat > supabase/migrations/$(date +%s)_rollback_rls.sql << 'EOF'
   -- Rollback RLS changes from [PROBLEMATIC MIGRATION DATE]
   -- Restoring to last known-good state

   -- Drop broken policies
   DROP POLICY IF EXISTS auth_policy_select ON users CASCADE;
   DROP POLICY IF EXISTS auth_policy_update ON users CASCADE;

   -- Restore previous policy (from git history)
   CREATE POLICY auth_policy_select ON users
     FOR SELECT
     USING (auth.uid() = id OR role = 'admin');

   CREATE POLICY auth_policy_update ON users
     FOR UPDATE
     USING (auth.uid() = id OR role = 'admin');
   EOF

   # Apply rollback
   supabase db push

   # Verify policies are restored
   psql -h db.supabase.co -U postgres -d postgres -c \
     "SELECT * FROM pg_policies WHERE tablename = 'users';"
   ```

2. **Verify Fix**
   ```bash
   # Test auth flow again
   curl -X POST "https://api.atal-ai.com/auth/login" \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"test123"}'

   # Check error rates dropped in Sentry
   # URL: https://sentry.io/organizations/atal-ai/issues/?query=is%3Aunresolved
   ```

**If Auth Flow Code is Broken:**

1. **Identify Broken Change**
   ```bash
   # Check recent auth-related commits
   git log --oneline --since="2 hours ago" -- src/lib/auth* src/app/actions/auth.ts

   # Revert the problematic commit
   git revert [commit-hash]
   ```

2. **Redeploy**
   ```bash
   git push origin main
   # Wait for deployment to complete (check GitHub Actions)
   ```

3. **Verify**
   - Test login in staging environment first
   - Confirm error rate dropped in Sentry
   - Spot-check 5-10 users can login

### Notification (30+ min)

```markdown
✅ INCIDENT RESOLVED: RLS/Auth Failure
Component: Authentication / Row Level Security
Resolution: [Rolled back / Fixed code / etc.]
Impact: X minutes of downtime, Y users affected
Root Cause: [Brief explanation]
Preventive Measures: [What we'll do to prevent this]

Next: Post-mortem scheduled for [date/time]
```

### Post-Incident (Next Day)

1. **Create Post-Mortem**
   ```markdown
   # Post-Mortem: RLS/Auth Failure on [DATE]

   ## Timeline
   - [Time] Initial detection
   - [Time] On-call notified
   - [Time] Root cause identified
   - [Time] Fix deployed
   - [Time] Issue resolved

   ## Root Cause
   [Technical explanation of what happened]

   ## Impact
   - Duration: X minutes
   - Affected users: Y
   - Services affected: [list]

   ## Remediation Steps Taken
   [What we did to fix it]

   ## Prevention for Next Time
   - [Preventive measure 1]
   - [Preventive measure 2]
   - [Preventive measure 3]

   ## Action Items
   - [ ] Implement monitoring for [specific pattern]
   - [ ] Add test for [specific scenario]
   - [ ] Update [documentation]
   ```

2. **Update Runbook** (if needed)
   - Did this runbook help or hinder response?
   - Update based on lessons learned

3. **Share Learnings**
   - Post summary in #incident-learnings
   - Schedule brown bag talk if significant

---

## 2. Database Query Failure - CRITICAL (P1)

### Detection

**Symptoms:**
- Queries timing out (> 30 seconds)
- `Connection poolexhausted` errors
- `Too many connections` error
- Users seeing 504 Gateway Timeout errors

### Immediate Response (0-5 min)

1. **Declare Incident**
   ```
   🚨 INCIDENT: Database Connection Pool Exhausted (P1)
   Component: Postgres Database
   Status: Investigating
   Impact: [Service name] slow/unavailable
   ETA: 15 minutes
   ```

2. **Check Connection Status**
   ```bash
   # In Supabase dashboard:
   # 1. Go to Database → Pooler
   # 2. Check active connections
   # 3. Check if hits database limit (usually 100-120 connections)

   # From command line
   psql -h db.supabase.co -U postgres -d postgres -c \
     "SELECT datname, count(*) FROM pg_stat_activity GROUP BY datname;"
   ```

### Diagnosis & Fix

**Quick Fixes (try in order):**

1. **Restart Connection Pooler**
   ```bash
   # In Supabase dashboard:
   # Database → Pooler → Restart
   # This closes idle connections and releases resources
   ```

2. **Kill Idle Connections**
   ```bash
   psql -h db.supabase.co -U postgres -d postgres << 'EOF'
   SELECT pg_terminate_backend(pid)
   FROM pg_stat_activity
   WHERE datname = 'postgres'
   AND pid <> pg_backend_pid()
   AND state = 'idle'
   AND query_start < now() - interval '10 minutes';
   EOF
   ```

3. **Check for Slow Queries**
   ```bash
   # In Supabase dashboard:
   # Database → Logs → Postgres Logs
   # Filter for: "duration: [0-9]+ ms"
   # Look for queries > 5000ms

   # Find and optimize the slow query
   # Add indexes if needed
   ```

---

## 3. Email Delivery Failure - P2

### Detection

- Users report not receiving OTP emails
- Supabase email service showing errors
- Bounce rate > 5%

### Fix

```bash
# Check email configuration in Supabase
# Dashboard → Email Templates

# Verify SMTP settings
# For SendGrid integration:
curl -X GET "https://api.sendgrid.com/v3/mail_settings" \
  -H "Authorization: Bearer $SENDGRID_API_KEY"

# Check bounce list
curl -X GET "https://api.sendgrid.com/v3/suppression/bounces" \
  -H "Authorization: Bearer $SENDGRID_API_KEY"
```

---

## 4. Rate Limiter Issues - P2

### Detection

- Users getting "Too many requests" errors prematurely
- Rate limit bucket not refilling correctly
- Redis connection issues

### Fix

```bash
# Check Redis status
redis-cli ping
redis-cli INFO stats

# Clear stuck rate limits (use with caution)
redis-cli KEYS "ratelimit:*" | head -10
redis-cli DEL "ratelimit:specific-user@example.com"

# Restart Redis
# (requires DevOps access)
```

---

## 5. Authentication Server - P2

### Detection

- "Service unavailable" on login
- HTTP 503 errors
- Long response times (> 10 seconds)

### Fix

```bash
# Check server status
curl -I https://api.atal-ai.com/health

# Check application logs
tail -f logs/app.log | grep -i "error\|exception"

# Restart application (if safe)
# (requires DevOps access)
```

---

## Escalation Matrix

| Issue | L1 (On-call) | L2 (Senior Dev) | L3 (Architect) |
|---|---|---|---|
| RLS broken | ✓ | ✓ | Notify |
| DB connection pool | ✓ | ✓ | Standby |
| Email delivery | ✓ | Notify | - |
| Rate limiter | ✓ | Notify | - |
| Authentication | ✓ | ✓ | Notify |

---

## Contacts

| Role | Name | Slack | Phone |
|---|---|---|---|
| DevOps On-Call | @devops-oncall | #incidents | 1-XXX-XXX-XXXX |
| Backend Lead | @backend-lead | @direct | 1-XXX-XXX-XXXX |
| Database Admin | @db-admin | @direct | 1-XXX-XXX-XXXX |

---

## Tools & Access

| Tool | URL | Access |
|---|---|---|
| Supabase Dashboard | https://supabase.co/dashboard | Dev team |
| Sentry | https://sentry.io/atal-ai | Dev team |
| Status Page | https://status.atal-ai.com | Public |
| Slack #incidents | Slack | Dev team |
| GitHub Actions | https://github.com/atal-ai/repo/actions | Dev team |

---

## Before You Escalate

- [ ] Checked Sentry for error patterns
- [ ] Reviewed recent git commits (within 2 hours)
- [ ] Verified issue in multiple geographic locations
- [ ] Attempted at least one fix from runbook
- [ ] Gathered logs and error messages
- [ ] Checked status page for known issues
- [ ] Notified team in #incidents channel

---

## Learning & Improvement

After every incident:

1. **Update this runbook** if procedures were unclear
2. **Add monitoring** for this issue type if missing
3. **Write a test** to catch this before production
4. **Share learnings** in team meeting
5. **Document root cause** in git commit message

---

## Version History

| Version | Date | Changes |
|---|---|---|
| 1.0 | 2025-11-23 | Initial creation |
