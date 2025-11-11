# 🚨 CRITICAL SECURITY WARNING

## ⚠️ Exposed Secrets in Git History

**Date:** 2025-11-11
**Status:** 🔴 IMMEDIATE ACTION REQUIRED

---

## What Happened

The `.env` file containing Supabase credentials was accidentally committed to git history in commit `22fd871b9ee2e21e8310e80e1eea8228a2db239c` on **November 7, 2025**.

### Exposed Credentials

```
NEXT_PUBLIC_SUPABASE_URL=https://hnlsqznoviwnyrkskfay.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 🔥 IMMEDIATE ACTIONS REQUIRED

### 1. Rotate Supabase Keys (DO THIS FIRST!)

**⏰ Do this NOW before pushing to GitHub:**

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `hnlsqznoviwnyrkskfay`
3. Navigate to **Settings** → **API**
4. Click **"Regenerate"** on both:
   - Project URL (if possible)
   - Anonymous key
5. Copy the new credentials

### 2. Update Local Environment

```bash
# Update your local .env.local file with NEW credentials
cd apps/web
nano .env.local  # or use your preferred editor

# Add the NEW credentials:
NEXT_PUBLIC_SUPABASE_URL=your_new_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_new_anon_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Test Application

```bash
# Restart dev server with new credentials
npm run dev

# Verify authentication works
# Try logging in at http://localhost:3000/login
```

### 4. Clean Git History (Optional but Recommended)

**Option A: Using BFG Repo-Cleaner (Recommended)**

```bash
# Install BFG (if not installed)
# Download from: https://rtyley.github.io/bfg-repo-cleaner/

# Make a fresh clone
cd ..
git clone --mirror atal-ai.git atal-ai-bare.git

# Remove .env from history
java -jar bfg.jar --delete-files .env atal-ai-bare.git

# Clean up
cd atal-ai-bare.git
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Push cleaned history (ONLY after rotating keys!)
git push
```

**Option B: Using git filter-repo (Advanced)**

```bash
# Install git-filter-repo
pip install git-filter-repo

# Create backup
git clone atal-ai.git atal-ai-backup

# Remove .env from history
cd atal-ai
git filter-repo --path .env --invert-paths

# Force push (ONLY after rotating keys!)
git push origin --force --all
```

---

## ✅ Verification Checklist

Before pushing to GitHub, verify:

- [ ] Supabase keys have been rotated
- [ ] New keys are in `.env.local` (NOT `.env`)
- [ ] Application works with new keys
- [ ] `.env` is in `.gitignore`
- [ ] `.env.example` has no secrets
- [ ] `.env.local` is NOT committed
- [ ] Git history cleaned (optional)

---

## 🛡️ Prevention Measures Implemented

1. **✅ .gitignore** - Prevents committing secrets
   ```
   .env
   .env.*
   .env.local
   !.env.example
   ```

2. **✅ .env.example** - Safe template with placeholders

3. **✅ README.md** - Security documentation and best practices

4. **✅ Pre-commit checks** - Can add git hooks to prevent secret commits

---

## 📋 Post-Rotation Steps

After rotating keys and testing locally:

### 1. Update Production Environment

If you have deployed to Vercel/Netlify/etc:

1. Go to your deployment platform
2. Update environment variables with NEW keys
3. Redeploy application

### 2. Notify Team (if applicable)

Inform team members to:
- Pull latest changes
- Update their local `.env.local`
- Use NEW Supabase credentials

### 3. Monitor for Suspicious Activity

1. Check Supabase Dashboard → **Auth** → **Users**
2. Look for unexpected signups or logins
3. Review database logs for unusual queries

---

## 🚀 Safe Git Push Workflow

Once keys are rotated:

```bash
# 1. Ensure .env is not tracked
git status
# Should NOT show .env in changes

# 2. Verify .gitignore is working
git check-ignore .env
# Should output: .env

# 3. Push to GitHub
git push origin main

# 4. Verify on GitHub that .env is not visible
# Go to: https://github.com/yourusername/atal-ai
# Check: .env should NOT be in file list
```

---

## 🔒 Best Practices Going Forward

### DO:
- ✅ Use `.env.local` for development
- ✅ Use platform env vars for production
- ✅ Keep `.env` in `.gitignore`
- ✅ Use `.env.example` for documentation
- ✅ Rotate keys if exposed
- ✅ Use pre-commit hooks

### DON'T:
- ❌ Commit `.env` files
- ❌ Hardcode secrets in code
- ❌ Share secrets in plain text
- ❌ Store secrets in public repos
- ❌ Reuse production keys in development

---

## 📚 Resources

- [Supabase Security Best Practices](https://supabase.com/docs/guides/platform/security)
- [GitHub: Removing sensitive data](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
- [BFG Repo-Cleaner](https://rtyley.github.io/bfg-repo-cleaner/)
- [git-filter-repo](https://github.com/newren/git-filter-repo)

---

## ⚠️ Final Warning

**DO NOT push to GitHub until Supabase keys are rotated!**

The old keys in git history can still be viewed by anyone with access to the repository. Rotating keys makes the old keys useless.

**Timeline:**
1. ✅ Rotate keys (5 minutes)
2. ✅ Update local .env.local (1 minute)
3. ✅ Test application (2 minutes)
4. ✅ Push to GitHub (1 minute)
5. ⏳ Clean history (optional, 10 minutes)

---

**Last Updated:** 2025-11-11
**Status:** Pending key rotation

🔐 Security is not optional. Take action now.
