# 🚀 GitHub Deployment Checklist

## ⚠️ CRITICAL: Complete ALL steps before pushing to GitHub!

---

## 📋 Pre-Deployment Checklist

### 🔒 Security (MUST DO FIRST!)

- [ ] **1. Rotate Supabase Keys**
  ```
  Go to: https://supabase.com/dashboard/project/hnlsqznoviwnyrkskfay/settings/api
  Click: "Regenerate" on Anonymous key
  Save: New credentials
  ```

- [ ] **2. Update Local Environment**
  ```bash
  cd apps/web
  # Create .env.local with NEW credentials
  echo "NEXT_PUBLIC_SUPABASE_URL=your_new_url" > .env.local
  echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=your_new_key" >> .env.local
  echo "NEXT_PUBLIC_APP_URL=http://localhost:3000" >> .env.local
  ```

- [ ] **3. Test Application**
  ```bash
  npm run dev
  # Visit http://localhost:3000/login
  # Try to login with test email
  # Verify OTP is received
  ```

- [ ] **4. Verify .gitignore**
  ```bash
  git status
  # Should NOT show .env or .env.local
  git check-ignore .env .env.local
  # Should output both files
  ```

### 📝 Documentation

- [x] **README.md** - Comprehensive project documentation
- [x] **.env.example** - Safe template without secrets
- [x] **.gitignore** - Prevents committing secrets
- [x] **SECURITY_WARNING.md** - Security incident documentation
- [x] **CLEANUP_SUMMARY.md** - Code cleanup details

### 🧹 Code Quality

- [x] **Removed test files**
  - test-email-validation.js
  - test-specific-case.js
  - test-comprehensive-typos.js

- [x] **Removed redundant code**
  - Old supabaseClient.ts
  - test-supabase API route

- [x] **Updated to SSR clients**
  - supabase-server.ts (server components)
  - supabase-browser.ts (client components)

### ✅ Features Verified

- [x] Authentication (OTP email)
- [x] Email validation (85 typo patterns)
- [x] Dashboard navigation
- [x] All dashboard pages created
- [x] Teacher class management
- [x] Student enrollment
- [x] Assessment system
- [x] Analytics dashboard

---

## 🔐 Final Security Verification

Run these commands to verify security:

```bash
# 1. Check that .env is not tracked
git ls-files | grep "\.env$"
# Should output nothing

# 2. Check that .env is gitignored
git check-ignore .env
# Should output: .env

# 3. Check no secrets in staged files
git diff --cached | grep -i "supabase"
# Should only show .env.example with placeholders

# 4. Verify .env.example has no real secrets
cat .env.example | grep "NEXT_PUBLIC"
# Should only show: your_supabase_project_url_here
```

---

## 🚀 Push to GitHub

### Step 1: Add Security Warning
```bash
git add SECURITY_WARNING.md DEPLOYMENT_CHECKLIST.md
git commit -m "Docs: Add security warning and deployment checklist"
```

### Step 2: Final Status Check
```bash
git status
# Should be clean or show only safe files
```

### Step 3: Push to GitHub
```bash
# Push all commits
git push origin main

# If you get authentication errors, you may need to:
# 1. Generate a Personal Access Token on GitHub
# 2. Use: git push https://TOKEN@github.com/bhanu-pratap-rana/Atal-ai-1.0.git main
```

### Step 4: Verify on GitHub
1. Go to: https://github.com/bhanu-pratap-rana/Atal-ai-1.0
2. Check that `.env` file is NOT visible
3. Check that `.env.example` IS visible
4. Check that `README.md` is displayed
5. Check that `.gitignore` contains `.env*`

---

## 🔧 Post-Deployment Tasks

### 1. Make Repository Private (Recommended)
```
1. Go to repository Settings
2. Scroll to "Danger Zone"
3. Click "Change visibility"
4. Select "Private"
5. Confirm
```

### 2. Add Collaborators (Optional)
```
1. Go to repository Settings
2. Click "Collaborators"
3. Add team members
4. Set permissions (Read/Write/Admin)
```

### 3. Set Up Branch Protection
```
1. Go to Settings → Branches
2. Add rule for "main" branch
3. Enable:
   - Require pull request reviews
   - Require status checks
   - Require signed commits (optional)
```

### 4. Configure GitHub Actions (Optional)
```
1. Create .github/workflows/ci.yml
2. Add tests, linting, build checks
3. Run on pull requests
```

---

## 📱 Deploy to Vercel (Production)

### Step 1: Import to Vercel
```
1. Go to: https://vercel.com/new
2. Import Git Repository
3. Select: bhanu-pratap-rana/Atal-ai-1.0
4. Framework: Next.js (auto-detected)
5. Root Directory: apps/web
```

### Step 2: Configure Environment Variables
```
Add in Vercel dashboard:
- NEXT_PUBLIC_SUPABASE_URL = your_new_supabase_url
- NEXT_PUBLIC_SUPABASE_ANON_KEY = your_new_anon_key
- NEXT_PUBLIC_APP_URL = https://your-project.vercel.app
```

### Step 3: Deploy
```
1. Click "Deploy"
2. Wait for build to complete
3. Visit your live URL
4. Test authentication
```

### Step 4: Update Supabase Redirect URLs
```
1. Go to Supabase Dashboard → Auth → URL Configuration
2. Add to "Redirect URLs":
   - https://your-project.vercel.app/verify
   - https://your-project.vercel.app/auth/callback
3. Save
```

---

## 🧪 Testing Deployed App

### Manual Tests
- [ ] Visit production URL
- [ ] Try to login with email
- [ ] Check OTP email is received
- [ ] Verify OTP code works
- [ ] Test dashboard navigation
- [ ] Test class creation (teacher)
- [ ] Test class joining (student)
- [ ] Test assessment system

### Automated Tests (Optional)
```bash
# Run Playwright tests against production
PLAYWRIGHT_BASE_URL=https://your-project.vercel.app npm run test
```

---

## 🔄 Continuous Deployment

### Automatic Deployments
Vercel automatically deploys when you push to GitHub:

```bash
# Make changes
git add .
git commit -m "Update: feature description"
git push origin main

# Vercel will automatically:
# 1. Pull changes
# 2. Run build
# 3. Deploy to production
# 4. Send notification
```

### Preview Deployments
Create preview for pull requests:

```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes and push
git add .
git commit -m "Add: new feature"
git push origin feature/new-feature

# Create PR on GitHub
# Vercel will create preview URL
```

---

## 📊 Monitoring & Maintenance

### Supabase Dashboard
Monitor at: https://supabase.com/dashboard
- Auth users
- Database queries
- API requests
- Email deliverability
- Error logs

### Vercel Dashboard
Monitor at: https://vercel.com/dashboard
- Build logs
- Deployment status
- Analytics
- Error tracking
- Performance metrics

### GitHub Actions (Optional)
Set up monitoring:
- Test coverage
- Build status
- Security scans
- Dependency updates

---

## 🆘 Emergency Rollback

If deployment breaks:

### Vercel Rollback
```
1. Go to Vercel Dashboard
2. Click "Deployments"
3. Find last working deployment
4. Click "..." → "Promote to Production"
```

### Git Rollback
```bash
# Find last working commit
git log --oneline

# Revert to that commit
git revert <commit-hash>
git push origin main
```

---

## ✅ Final Checklist

Before considering deployment complete:

- [ ] Keys rotated in Supabase
- [ ] Application tested locally with new keys
- [ ] .env is gitignored and not in repo
- [ ] Pushed to GitHub successfully
- [ ] Repository is private (if needed)
- [ ] README is visible on GitHub
- [ ] Deployed to Vercel (production)
- [ ] Environment variables set in Vercel
- [ ] Redirect URLs updated in Supabase
- [ ] Production app tested end-to-end
- [ ] Team members have access
- [ ] Monitoring is set up

---

## 🎉 Deployment Complete!

Your application is now live and secure.

**Next Steps:**
1. Share URL with team
2. Onboard first users
3. Monitor for issues
4. Iterate based on feedback

**Production URL:** https://your-project.vercel.app

---

**Last Updated:** 2025-11-11
**Status:** Ready for deployment
**Priority:** 🔴 HIGH - Rotate keys before pushing!
