# ATAL AI - Comprehensive Manual Testing Guide

## Overview
This guide provides step-by-step manual testing for all features across 12 testing phases. Each test includes clear steps, expected results, and pass criteria.

**Total Tests:** 100+ | **Estimated Time:** 3-4 hours | **Prerequisites:** localhost:3000 running, Supabase connected

---

## Prerequisites Checklist

Before testing, verify:
- [ ] Development server running: `npm run dev`
- [ ] Supabase project connected (check `.env.local`)
- [ ] Database migrations applied
- [ ] Browser: Chrome/Firefox latest version
- [ ] Browser DevTools accessible (F12)

---

## Phase 1: Build & Server Verification (3 tests)

### Test 1.1: Build Success
**Steps:**
1. Open terminal in `apps/web` directory
2. Run `npm run build`
3. Check output for errors

**Expected:** Build completes with 0 TypeScript errors
**Pass Criteria:** ✅ No errors | ✅ All pages generated | ✅ Build time < 3 min

---

### Test 1.2: Development Server
**Steps:**
1. Run `npm run dev`
2. Wait for "Ready" message
3. Open http://localhost:3000

**Expected:** App loads without console errors
**Pass Criteria:** ✅ Server starts | ✅ Page loads | ✅ No red errors in console

---

### Test 1.3: All Routes Accessible
**Steps:**
1. Navigate to `/` (home)
2. Navigate to `/student/start`
3. Navigate to `/teacher/start`
4. Navigate to `/admin/login`

**Expected:** All pages load without 404 errors
**Pass Criteria:** ✅ No 404 errors | ✅ No console errors

---

## Phase 2: Landing Page & Navigation (4 tests)

### Test 2.1: Home Page Display
**Steps:**
1. Go to http://localhost:3000
2. Observe layout and design
3. Check for "Teacher" and "Student" buttons

**Expected:**
- Clean landing page with gradient background
- Two clear buttons for role selection
- ATAL AI branding visible
- Info box explaining platform

**Pass Criteria:** ✅ Buttons visible | ✅ Styling correct | ✅ Responsive

---

### Test 2.2: Teacher Button Navigation
**Steps:**
1. On home page, click "Teacher" or "I'm a Teacher" button
2. Observe URL changes to `/teacher/start`

**Expected:** Redirects to teacher authentication page
**Pass Criteria:** ✅ Correct redirect | ✅ Page loads

---

### Test 2.3: Student Button Navigation
**Steps:**
1. On home page, click "Student" or "I'm a Student" button
2. Observe URL changes to `/student/start`

**Expected:** Redirects to student authentication page
**Pass Criteria:** ✅ Correct redirect | ✅ Page loads

---

### Test 2.4: Admin Access (Hidden)
**Steps:**
1. Manually navigate to `/admin/login`
2. Verify page loads (not linked from home)

**Expected:** Admin login page accessible but not visible on home
**Pass Criteria:** ✅ Page loads | ✅ Not linked from home

---

## Phase 3: Student Authentication Flow (15 tests)

### Test 3.1: Student Start Page Layout
**Steps:**
1. Navigate to `/student/start`
2. Observe tab navigation (Sign In / Sign Up)
3. Check for method toggles (Email/Phone)

**Expected:**
- Tab navigation for Sign In / Sign Up
- Email and Phone toggle options
- Clean AuthCard styling
- Back button visible

**Pass Criteria:** ✅ Tabs work | ✅ Toggles work | ✅ Styling correct

---

### Test 3.2: Student Email Sign In - Valid
**Steps:**
1. On `/student/start`, select "Sign In" tab
2. Choose "Email" method
3. Enter valid student email
4. Enter password
5. Click "Sign In"

**Expected:**
- If valid: Redirects to dashboard
- Loading state visible during auth
- Success toast message

**Pass Criteria:** ✅ Auth works | ✅ Redirect correct | ✅ Session created

---

### Test 3.3: Student Email Sign In - Invalid
**Steps:**
1. Enter invalid email: wronguser@example.com
2. Enter wrong password
3. Click "Sign In"

**Expected:**
- Error message: "Invalid email or password"
- Form remains (not cleared)
- No sensitive info leaked

**Pass Criteria:** ✅ Error shown | ✅ Form intact | ✅ Generic message

---

### Test 3.4: Student Phone Sign In
**Steps:**
1. Select "Sign In" tab
2. Choose "Phone" method
3. Enter 10-digit phone number (without +91)
4. Enter password
5. Click "Sign In"

**Expected:**
- +91 prefix shown automatically
- Only accepts 10 digits
- Auth proceeds if valid

**Pass Criteria:** ✅ Phone format validated | ✅ +91 prefix shown

---

### Test 3.5: Student Email Sign Up - Send OTP
**Steps:**
1. Select "Sign Up" tab
2. Choose "Email" method
3. Enter new email: newstudent@example.com
4. Click "Send OTP" or "Send Verification Code"

**Expected:**
- OTP sent to email
- Success message shown
- Form advances to OTP entry

**Pass Criteria:** ✅ OTP sent | ✅ Form advances

---

### Test 3.6: Student Email Sign Up - Typo Detection
**Steps:**
1. In email field, enter: test@gmial.com (typo)
2. Observe suggestion appears

**Expected:**
- Suggestion: "Did you mean test@gmail.com?"
- Clicking suggestion auto-corrects

**Pass Criteria:** ✅ Typo detected | ✅ Suggestion shown | ✅ Auto-correct works

---

### Test 3.7: Student Email Sign Up - OTP Verification
**Steps:**
1. After OTP sent, enter 6-digit code from email
2. Click "Verify"

**Expected:**
- Code accepts 6 digits only
- Form advances to password creation
- Invalid code shows error

**Pass Criteria:** ✅ OTP verified | ✅ Form advances

---

### Test 3.8: Student Email Sign Up - Password Creation
**Steps:**
1. After OTP verified, observe password form
2. Enter weak password: "pass"
3. Observe strength indicator (should be red/weak)
4. Enter strong password: "SecurePass123!"
5. Observe strength indicator (should be green/strong)
6. Enter confirm password

**Expected:**
- Strength indicator changes color based on password
- Minimum 8 characters required
- Confirm password must match

**Pass Criteria:** ✅ Strength meter works | ✅ Validation enforced

---

### Test 3.9: Student Phone Sign Up - Send OTP
**Steps:**
1. Select "Sign Up" tab
2. Choose "Phone" method
3. Enter 10-digit phone number
4. Click "Send OTP"

**Expected:**
- SMS sent to phone
- +91 prefix applied
- Form advances to OTP entry

**Pass Criteria:** ✅ SMS sent | ✅ Form advances

---

### Test 3.10: Student Guest Join Class
**Steps:**
1. On student page, look for "Join Class" or "Guest" option
2. Enter class code (6 characters, e.g., ABC123)
3. Enter roll number
4. Enter class PIN (4 digits)
5. Click "Join Class"

**Expected:**
- Class code auto-uppercases
- PIN accepts only 4 digits
- Validates against database
- Success: Shows class name

**Pass Criteria:** ✅ Validation works | ✅ Join successful

---

### Test 3.11: Student Guest Join - Invalid Code
**Steps:**
1. Enter invalid class code: XXXXXX
2. Enter any roll number
3. Enter any PIN: 0000
4. Click "Join Class"

**Expected:**
- Error message: "Invalid class code or PIN"
- Does NOT reveal which field was wrong
- Form remains intact

**Pass Criteria:** ✅ Generic error | ✅ No info leakage

---

### Test 3.12: Student Forgot Password - Email
**Steps:**
1. On Sign In, click "Forgot Password?"
2. Enter student email
3. Click "Send Reset Code"
4. Enter OTP from email
5. Enter new password
6. Confirm new password
7. Click "Reset Password"

**Expected:**
- Each step advances correctly
- Password reset successful
- Can login with new password

**Pass Criteria:** ✅ Reset works | ✅ Can login after

---

### Test 3.13: Student Sign Up - Duplicate Email Prevention
**Steps:**
1. Try to sign up with existing email
2. Complete OTP verification
3. Observe error

**Expected:**
- Error: "Email already registered"
- Prompt to sign in instead

**Pass Criteria:** ✅ Duplicate prevented | ✅ Helpful message

---

### Test 3.14: Resend OTP Functionality
**Steps:**
1. During OTP entry, wait for "Resend" option
2. Click "Resend OTP"
3. Observe cooldown timer

**Expected:**
- Resend button appears after delay (60 seconds)
- Cooldown timer visible
- New OTP sent successfully

**Pass Criteria:** ✅ Resend works | ✅ Timer visible

---

### Test 3.15: Back Button Navigation
**Steps:**
1. At any step in student flow, click "Back"
2. Verify returns to previous step
3. Verify data preserved where applicable

**Expected:**
- Each step has back button
- Returns to previous step correctly
- Form data retained when appropriate

**Pass Criteria:** ✅ Back works | ✅ Navigation correct

---

## Phase 4: Teacher Authentication Flow (14 tests)

### Test 4.1: Teacher Start Page Layout
**Steps:**
1. Navigate to `/teacher/start`
2. Observe choice options

**Expected:**
- "Create Account" button visible
- "Login to Account" button visible
- Info box explaining teacher role

**Pass Criteria:** ✅ Both options visible | ✅ Styling correct

---

### Test 4.2: Teacher Login - Valid Credentials
**Steps:**
1. Click "Login to Account"
2. Enter valid teacher email
3. Enter password
4. Click "Sign In"

**Expected:**
- Auth successful
- Redirects to dashboard or profile completion
- Session established

**Pass Criteria:** ✅ Login works | ✅ Redirect correct

---

### Test 4.3: Teacher Login - Invalid Credentials
**Steps:**
1. Enter invalid email/password
2. Click "Sign In"

**Expected:**
- Error message displayed
- Form not cleared
- No info leakage

**Pass Criteria:** ✅ Error shown | ✅ Generic message

---

### Test 4.4: Teacher Signup Step 1 - Email OTP
**Steps:**
1. Click "Create Account"
2. Enter new email: newteacher@example.com
3. Click "Send Verification Code"

**Expected:**
- OTP sent to email
- Form advances to OTP entry
- Message: "Check your email for the 6-digit code"

**Pass Criteria:** ✅ OTP sent | ✅ Form advances

---

### Test 4.5: Teacher Signup Step 1 - Verify OTP
**Steps:**
1. Enter 6-digit OTP from email
2. Click "Verify Code"

**Expected:**
- Code verified
- Form advances to Step 2 (Password)

**Pass Criteria:** ✅ OTP verified | ✅ Advances to password

---

### Test 4.6: Teacher Signup Step 2 - Password Creation
**Steps:**
1. Enter password meeting requirements
2. Observe strength indicator
3. Enter confirm password
4. Click "Set Password"

**Expected:**
- Strength indicator reflects password quality
- Passwords must match
- Minimum 8 characters enforced
- Advances to Step 3

**Pass Criteria:** ✅ Strength works | ✅ Match enforced | ✅ Advances

---

### Test 4.7: Teacher Signup Step 3 - School Code Entry
**Steps:**
1. Enter school code (e.g., 14H0182 SEBA format)
2. Observe auto-uppercase transformation

**Expected:**
- Code auto-uppercases
- Format: alphanumeric, max 10 chars
- Field accepts valid school codes

**Pass Criteria:** ✅ Auto-uppercase works | ✅ Validation applied

---

### Test 4.8: Teacher Signup Step 3 - Staff PIN Entry
**Steps:**
1. Enter staff PIN (4-8 digits)
2. Try entering non-numeric characters

**Expected:**
- Only numeric input accepted
- 4-8 digit length allowed
- Non-numeric prevented or rejected

**Pass Criteria:** ✅ Numeric only | ✅ Length validated

---

### Test 4.9: Teacher Signup Step 3 - School Verification Success
**Steps:**
1. Enter valid school code and correct PIN
2. Click "Verify"

**Expected:**
- Loading state during verification
- Success: Shows school name in green banner
- Advances to Step 4 (Profile)

**Pass Criteria:** ✅ Verification works | ✅ School name shown

---

### Test 4.10: Teacher Signup Step 3 - Verification Failure
**Steps:**
1. Enter valid school code with wrong PIN
2. Click "Verify"

**Expected:**
- Error: "Invalid school code or PIN"
- Does NOT reveal which was wrong
- Can retry

**Pass Criteria:** ✅ Generic error | ✅ Security maintained

---

### Test 4.11: Teacher Signup Step 4 - Profile Form
**Steps:**
1. After school verification, observe profile form
2. Enter name (required)
3. Enter phone (optional)
4. Enter subject (optional)
5. Verify school banner shows

**Expected:**
- Verified school displayed in green banner
- Name field required
- Phone/Subject optional
- Submit button enabled when name entered

**Pass Criteria:** ✅ School shown | ✅ Name required | ✅ Form complete

---

### Test 4.12: Teacher Signup Step 4 - Complete Registration
**Steps:**
1. Fill in profile form
2. Click "Complete Registration"

**Expected:**
- Registration successful
- Redirects to dashboard
- Session established
- Toast: "Registration complete!"

**Pass Criteria:** ✅ Registration works | ✅ Redirect correct

---

### Test 4.13: Teacher Forgot Password Flow
**Steps:**
1. On login, click "Forgot Password?"
2. Enter teacher email
3. Complete OTP verification
4. Set new password
5. Login with new password

**Expected:**
- Full flow completes
- Password reset successful
- Can login with new password

**Pass Criteria:** ✅ Reset works | ✅ Login works

---

### Test 4.14: Teacher Phone Signup (Coming Soon)
**Steps:**
1. If phone option available, select it
2. Observe "Coming Soon" notice

**Expected:**
- Phone signup shows "Coming Soon" message
- Input disabled
- Directs to use email instead

**Pass Criteria:** ✅ Coming soon shown | ✅ Email alternative offered

---

## Phase 5: Admin Authentication & Management (12 tests)

### Test 5.1: Admin Login Page
**Steps:**
1. Navigate to `/admin/login`
2. Observe layout

**Expected:**
- Email input field
- Password input field
- Login button
- Back button to home

**Pass Criteria:** ✅ All fields present | ✅ Styling correct

---

### Test 5.2: Admin Login - Valid Super Admin
**Steps:**
1. Enter super admin email: atal.app.ai@gmail.com
2. Enter password
3. Click "Login"

**Expected:**
- Auth successful
- Redirects to `/admin/dashboard`
- Super admin features visible

**Pass Criteria:** ✅ Login works | ✅ Dashboard access

---

### Test 5.3: Admin Login - Valid Regular Admin
**Steps:**
1. Enter regular admin email
2. Enter password
3. Click "Login"

**Expected:**
- Auth successful
- Redirects to `/admin/pins` (limited access)
- No dashboard access

**Pass Criteria:** ✅ Login works | ✅ Limited redirect

---

### Test 5.4: Admin Login - Non-Admin User
**Steps:**
1. Enter teacher or student email
2. Enter password
3. Click "Login"

**Expected:**
- Error: "Unauthorized - Admin access required"
- No redirect to admin pages

**Pass Criteria:** ✅ Access denied | ✅ Helpful error

---

### Test 5.5: Admin Dashboard (Super Admin Only)
**Steps:**
1. Login as super admin
2. Navigate to `/admin/dashboard`
3. Observe metrics and options

**Expected:**
- Dashboard loads with metrics
- User management options visible
- Logout button present
- PIN management link

**Pass Criteria:** ✅ Dashboard loads | ✅ Metrics shown

---

### Test 5.6: Admin PINs Page - School Search
**Steps:**
1. Navigate to `/admin/pins`
2. Enter school name in search
3. Observe autocomplete results

**Expected:**
- Schools matching search appear
- Shows school name, code, district
- PIN status indicator (has/no PIN)

**Pass Criteria:** ✅ Search works | ✅ Results shown

---

### Test 5.7: Admin PINs Page - View School Details
**Steps:**
1. Select a school from search
2. Observe school details panel

**Expected:**
- School name, code displayed
- Current PIN status
- Last rotated timestamp
- PIN value (if exists)

**Pass Criteria:** ✅ Details shown | ✅ PIN visible

---

### Test 5.8: Admin PINs Page - Generate/Rotate PIN
**Steps:**
1. Select school without PIN (or with existing PIN)
2. Click "Generate PIN" or "Rotate PIN"
3. Observe new PIN displayed

**Expected:**
- New 4-digit PIN generated
- Copy button available
- Success toast message
- Last rotated updates

**Pass Criteria:** ✅ PIN generated | ✅ Copy works

---

### Test 5.9: Admin PINs Page - Copy PIN
**Steps:**
1. After PIN shown, click "Copy"
2. Paste elsewhere to verify

**Expected:**
- PIN copied to clipboard
- "Copied!" confirmation
- Correct value pasted

**Pass Criteria:** ✅ Copy works | ✅ Correct value

---

### Test 5.10: Admin Initialize Page
**Steps:**
1. Navigate to `/admin/initialize`
2. Enter super admin email: atal.app.ai@gmail.com
3. Enter strong password
4. Confirm password
5. Click "Create Super Admin"

**Expected:**
- Email validation (must be atal.app.ai@gmail.com)
- Password strength validation
- Success or "already exists" message

**Pass Criteria:** ✅ Validation works | ✅ Creation works

---

### Test 5.11: Admin Create Additional Admin
**Steps:**
1. Navigate to `/admin/create` or `/admin/manage`
2. Enter new admin email
3. Enter password
4. Click "Create Admin"

**Expected:**
- New admin account created
- Success message
- New admin can login

**Pass Criteria:** ✅ Creation works | ✅ New admin functional

---

### Test 5.12: Admin Sign Out
**Steps:**
1. On any admin page, click "Sign Out"
2. Observe redirect

**Expected:**
- Session cleared
- Redirects to `/admin/login`
- Cannot access admin pages

**Pass Criteria:** ✅ Logout works | ✅ Session cleared

---

## Phase 6: Class Management (10 tests)

### Test 6.1: Teacher Create Class
**Steps:**
1. Login as teacher
2. Navigate to `/app/teacher/classes`
3. Click "Create Class"
4. Enter class name
5. Enter subject (optional)
6. Click "Create"

**Expected:**
- Class created successfully
- Auto-generated class code (6 chars)
- Auto-generated PIN (4 digits)
- Class appears in list

**Pass Criteria:** ✅ Class created | ✅ Code/PIN generated

---

### Test 6.2: View Class Details
**Steps:**
1. Click on created class
2. Observe class details page

**Expected:**
- Class name displayed
- Class code visible
- Class PIN visible
- Invite panel available
- Empty student roster

**Pass Criteria:** ✅ Details shown | ✅ Invite available

---

### Test 6.3: Copy Class Code
**Steps:**
1. On class details, click "Copy Code"
2. Paste to verify

**Expected:**
- Code copied to clipboard
- Confirmation shown

**Pass Criteria:** ✅ Copy works

---

### Test 6.4: Student Join Class
**Steps:**
1. Login as student (or guest)
2. Navigate to class join form
3. Enter class code from Test 6.3
4. Enter roll number
5. Enter class PIN
6. Click "Join"

**Expected:**
- Enrollment successful
- Class appears in student's classes
- Teacher sees student in roster

**Pass Criteria:** ✅ Join works | ✅ Both sides updated

---

### Test 6.5: View Class Roster (Teacher)
**Steps:**
1. As teacher, view class details
2. Observe student roster

**Expected:**
- Enrolled students listed
- Student email/info visible
- Enrollment count updated

**Pass Criteria:** ✅ Roster shown | ✅ Count correct

---

### Test 6.6: Student View Enrolled Classes
**Steps:**
1. As student, navigate to `/app/student/classes`
2. Observe enrolled classes

**Expected:**
- Enrolled classes listed
- Class name and teacher shown
- Start assessment button visible

**Pass Criteria:** ✅ Classes shown | ✅ Details correct

---

### Test 6.7: Prevent Duplicate Enrollment
**Steps:**
1. As student, try to join same class again
2. Enter same class code and PIN

**Expected:**
- Error: "Already enrolled in this class"
- No duplicate record created

**Pass Criteria:** ✅ Duplicate prevented | ✅ Error shown

---

### Test 6.8: Invalid Class Join Attempt
**Steps:**
1. Enter wrong class code or PIN
2. Click "Join"

**Expected:**
- Error: "Invalid class code or PIN"
- Does not reveal which was wrong

**Pass Criteria:** ✅ Error shown | ✅ No info leakage

---

### Test 6.9: Class Invite Link
**Steps:**
1. As teacher, get invite link from class
2. Open link in incognito window
3. Observe prefilled values

**Expected:**
- Link opens `/join` page
- Class code prefilled
- PIN may be prefilled
- Ready to join

**Pass Criteria:** ✅ Link works | ✅ Prefilled correctly

---

### Test 6.10: Teacher Class Analytics
**Steps:**
1. As teacher with students enrolled
2. View class analytics section

**Expected:**
- Total enrolled students count
- Assessment completion rates (if any)
- Performance metrics

**Pass Criteria:** ✅ Analytics shown | ✅ Data correct

---

## Phase 7: Assessment Flow (12 tests)

### Test 7.1: Assessment Start Page
**Steps:**
1. Navigate to `/app/assessment/start`
2. Observe language selection

**Expected:**
- Language options: English, Hindi, Assamese
- Assessment info displayed
- Question count shown
- Start button present

**Pass Criteria:** ✅ Languages shown | ✅ Info displayed

---

### Test 7.2: Language Selection
**Steps:**
1. Click each language option
2. Observe selection indicator

**Expected:**
- Selected language highlighted
- Selection persists

**Pass Criteria:** ✅ Selection works

---

### Test 7.3: Start Assessment
**Steps:**
1. Select language
2. Click "Start Assessment"

**Expected:**
- Redirects to assessment runner
- First question displayed
- Progress bar at 0%

**Pass Criteria:** ✅ Assessment starts | ✅ Question shown

---

### Test 7.4: Question Display
**Steps:**
1. Observe question layout

**Expected:**
- Question text clear
- Module badge shown
- 4 answer options displayed
- Options are radio-style selectable

**Pass Criteria:** ✅ Question visible | ✅ Options shown

---

### Test 7.5: Answer Selection
**Steps:**
1. Click on an answer option
2. Observe selection highlight

**Expected:**
- Selected option highlighted (primary color)
- Radio indicator filled
- Only one option selectable

**Pass Criteria:** ✅ Selection works | ✅ Single select

---

### Test 7.6: Next Question Navigation
**Steps:**
1. Select an answer
2. Click "Next"
3. Observe question changes

**Expected:**
- Advances to next question
- Progress bar updates
- Question number updates
- Previous answer recorded

**Pass Criteria:** ✅ Navigation works | ✅ Progress updates

---

### Test 7.7: Keyboard Navigation
**Steps:**
1. Use arrow keys (Up/Down) to select options
2. Use Enter/Space to submit
3. Use 1-4 keys for quick selection

**Expected:**
- Arrow keys change selection
- Enter/Space submits answer
- Number keys select corresponding option

**Pass Criteria:** ✅ Keyboard works

---

### Test 7.8: Rapid Answer Warning
**Steps:**
1. Answer a question in < 5 seconds
2. Observe warning message

**Expected:**
- Warning: "Take your time! Reading carefully helps..."
- Warning auto-dismisses after 3 seconds

**Pass Criteria:** ✅ Warning shown | ✅ Auto-dismiss

---

### Test 7.9: Complete Assessment
**Steps:**
1. Answer all 30 questions
2. Click "Submit" on last question

**Expected:**
- Loading state during submission
- Redirects to summary page
- Success message

**Pass Criteria:** ✅ Submission works | ✅ Redirect to summary

---

### Test 7.10: Assessment Summary Display
**Steps:**
1. After submission, observe summary page

**Expected:**
- Total score displayed
- Module-wise breakdown
- Correct/incorrect counts
- Time taken (if tracked)

**Pass Criteria:** ✅ Summary shown | ✅ Scores correct

---

### Test 7.11: Module Performance Breakdown
**Steps:**
1. On summary, view module sections

**Expected:**
- Each module listed
- Score per module shown
- Performance indicators

**Pass Criteria:** ✅ Modules shown | ✅ Breakdown accurate

---

### Test 7.12: Assessment Focus Tracking
**Steps:**
1. During assessment, switch tabs/windows
2. Return to assessment
3. Complete and check data (in backend)

**Expected:**
- Focus/blur events counted
- Data recorded in responses
- No penalty to user (tracking only)

**Pass Criteria:** ✅ Tracking works | ✅ Data recorded

---

## Phase 8: Dashboard & Navigation (8 tests)

### Test 8.1: Dashboard Load
**Steps:**
1. Login and navigate to `/app/dashboard`
2. Observe layout

**Expected:**
- Welcome message with user name
- Stats cards displayed
- Feature cards grid
- Header with logo and sign out

**Pass Criteria:** ✅ Dashboard loads | ✅ Elements present

---

### Test 8.2: Stats Display
**Steps:**
1. Observe stats cards

**Expected:**
- Classes count shown
- Assessments count shown
- Achievements shown
- Day streak shown

**Pass Criteria:** ✅ Stats visible | ✅ Values reasonable

---

### Test 8.3: Feature Cards Navigation
**Steps:**
1. Click each feature card:
   - Curriculum
   - Classes
   - Progress
   - AI Tools
   - Assessments
   - Settings

**Expected:**
- Each card navigates to correct page
- Hover effects work
- Icons and emojis visible

**Pass Criteria:** ✅ Navigation works | ✅ All cards functional

---

### Test 8.4: Role-Based Content (Teacher)
**Steps:**
1. Login as teacher
2. Observe dashboard

**Expected:**
- Teacher-specific message
- "Create Class" button visible
- Teacher assessment link

**Pass Criteria:** ✅ Teacher content shown

---

### Test 8.5: Role-Based Content (Student)
**Steps:**
1. Login as student
2. Observe dashboard

**Expected:**
- Student-specific message
- Student classes link
- Student assessments link

**Pass Criteria:** ✅ Student content shown

---

### Test 8.6: Curriculum Page
**Steps:**
1. Navigate to `/app/curriculum`

**Expected:**
- Module list displayed
- Digital Literacy module info
- AI & ML module info
- Back to dashboard link

**Pass Criteria:** ✅ Curriculum shown

---

### Test 8.7: Progress Page
**Steps:**
1. Navigate to `/app/progress`

**Expected:**
- Courses completed count
- Assessments taken count
- Average score
- Back link

**Pass Criteria:** ✅ Progress shown

---

### Test 8.8: Sign Out
**Steps:**
1. Click "Sign Out" in header
2. Observe redirect

**Expected:**
- Session cleared
- Redirects to `/student/start` or home
- Cannot access protected routes

**Pass Criteria:** ✅ Logout works | ✅ Session cleared

---

## Phase 9: Security Testing (10 tests)

### Test 9.1: PIN Timing Attack Prevention
**Steps:**
1. Time verification for wrong PIN: 0000
2. Time verification for partially correct PIN: 12XX
3. Compare response times

**Expected:**
- Response times approximately equal
- No timing difference based on correctness

**Pass Criteria:** ✅ Timing consistent | ✅ No leakage

---

### Test 9.2: SQL Injection Prevention
**Steps:**
1. In school search, enter: `'; DROP TABLE schools; --`
2. In class code, enter: `CLASS01' OR '1'='1`
3. In PIN, enter: `1234; DELETE FROM users;`

**Expected:**
- All inputs safely rejected
- No database errors exposed
- App continues functioning

**Pass Criteria:** ✅ Injection prevented | ✅ No errors shown

---

### Test 9.3: XSS Prevention
**Steps:**
1. In name field: `<script>alert('xss')</script>`
2. In email field: `test@example.com"><script>alert('xss')</script>`
3. Submit forms

**Expected:**
- No JavaScript executed
- No alert popups
- Content escaped

**Pass Criteria:** ✅ XSS prevented | ✅ No scripts run

---

### Test 9.4: Error Message Security
**Steps:**
1. Trigger various errors:
   - Invalid school verification
   - Invalid PIN
   - Non-existent user
2. Observe error messages

**Expected:**
- User-friendly messages only
- No database column names
- No SQL syntax
- No file paths

**Pass Criteria:** ✅ Errors sanitized | ✅ No info leakage

---

### Test 9.5: Session Security
**Steps:**
1. Check browser storage (DevTools > Application)
2. Verify no plaintext passwords
3. Check for JWT tokens only

**Expected:**
- No passwords in storage
- Only session tokens/JWTs
- Tokens properly formatted

**Pass Criteria:** ✅ No plaintext | ✅ Secure storage

---

### Test 9.6: Protected Route Access
**Steps:**
1. Logout completely
2. Try accessing `/app/dashboard` directly
3. Try accessing `/app/teacher/classes`

**Expected:**
- Redirected to login
- Cannot access protected content
- No data leaked

**Pass Criteria:** ✅ Redirect works | ✅ Access denied

---

### Test 9.7: Role-Based Access Control
**Steps:**
1. As student, try `/app/teacher/classes`
2. As teacher, try admin pages

**Expected:**
- Wrong role denied access
- Appropriate error or redirect

**Pass Criteria:** ✅ Roles enforced

---

### Test 9.8: HTTPS Verification (Production)
**Steps:**
1. Check address bar for lock icon
2. Verify all requests use HTTPS
3. Check for mixed content warnings

**Expected:**
- Lock icon visible
- All HTTPS
- No mixed content

**Pass Criteria:** ✅ HTTPS enforced

---

### Test 9.9: Password Storage Verification
**Steps:**
1. In network tab, observe password submission
2. Verify password not in plain text in requests
3. Check password hashing (backend)

**Expected:**
- Password sent securely
- bcrypt hashing used
- No plaintext storage

**Pass Criteria:** ✅ Secure transmission | ✅ Proper hashing

---

### Test 9.10: OTP Expiration
**Steps:**
1. Request OTP
2. Wait beyond expiration (if known)
3. Try using expired OTP

**Expected:**
- OTP expires after time limit
- Error: "OTP expired"
- Must request new OTP

**Pass Criteria:** ✅ Expiration works

---

## Phase 10: Input Validation (8 tests)

### Test 10.1: Email Format Validation
**Steps:**
1. Enter invalid emails:
   - `notanemail`
   - `missing@domain`
   - `@nodomain.com`
   - `spaces in@email.com`

**Expected:**
- All invalid formats rejected
- Error: "Invalid email format"

**Pass Criteria:** ✅ Validation works

---

### Test 10.2: Phone Number Validation
**Steps:**
1. Enter invalid phones:
   - `12345` (too short)
   - `123456789012` (too long)
   - `abcdefghij` (non-numeric)

**Expected:**
- Must be exactly 10 digits
- Non-numeric rejected
- +91 prefix applied automatically

**Pass Criteria:** ✅ 10 digits enforced | ✅ Numeric only

---

### Test 10.3: OTP Validation
**Steps:**
1. Enter invalid OTPs:
   - `12345` (5 digits)
   - `1234567` (7 digits)
   - `abcdef` (non-numeric)

**Expected:**
- Must be exactly 6 digits
- Non-numeric prevented

**Pass Criteria:** ✅ 6 digits enforced | ✅ Numeric only

---

### Test 10.4: Class PIN Validation
**Steps:**
1. Enter invalid PINs:
   - `123` (3 digits)
   - `12345` (5 digits)
   - `abcd` (non-numeric)

**Expected:**
- Must be 4 digits
- Non-numeric rejected

**Pass Criteria:** ✅ 4 digits enforced | ✅ Numeric only

---

### Test 10.5: Class Code Validation
**Steps:**
1. Enter invalid codes:
   - `AB` (too short)
   - `ABCDEFGHIJ` (too long)
   - `abc123` (lowercase)

**Expected:**
- 6 characters required
- Auto-uppercase applied

**Pass Criteria:** ✅ Length enforced | ✅ Uppercase applied

---

### Test 10.6: Password Requirements
**Steps:**
1. Enter invalid passwords:
   - `short` (< 8 chars)
   - `nouppercaseornumbers`
   - `NOLOWERCASE123`

**Expected:**
- Minimum 8 characters
- Strength indicator guides user
- Weak passwords allowed but warned

**Pass Criteria:** ✅ Min length enforced | ✅ Strength shown

---

### Test 10.7: Name Field Validation
**Steps:**
1. Enter only spaces
2. Enter extremely long name (500+ chars)
3. Enter special characters

**Expected:**
- Whitespace-only rejected
- Length limit applied
- Basic characters accepted

**Pass Criteria:** ✅ Validation works

---

### Test 10.8: School Code Format
**Steps:**
1. Enter valid SEBA format: `14H0182`
2. Enter with spaces: `  14H0182  `
3. Enter lowercase: `14h0182`

**Expected:**
- Spaces trimmed
- Uppercase applied
- Valid format accepted

**Pass Criteria:** ✅ Format normalized

---

## Phase 11: Responsive Design & Accessibility (6 tests)

### Test 11.1: Mobile Viewport
**Steps:**
1. Open DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Select iPhone/Android viewport
4. Navigate through all pages

**Expected:**
- All pages readable on mobile
- No horizontal scrolling
- Buttons accessible
- Forms usable

**Pass Criteria:** ✅ Mobile friendly

---

### Test 11.2: Tablet Viewport
**Steps:**
1. Select iPad viewport
2. Navigate through pages

**Expected:**
- Layout adapts appropriately
- Cards/grids responsive
- Navigation works

**Pass Criteria:** ✅ Tablet friendly

---

### Test 11.3: Keyboard Navigation
**Steps:**
1. Use Tab key to navigate forms
2. Use Enter to submit
3. Use Escape to close modals

**Expected:**
- All interactive elements reachable
- Focus visible
- Logical tab order

**Pass Criteria:** ✅ Keyboard accessible

---

### Test 11.4: Screen Reader Labels
**Steps:**
1. Check form labels with DevTools
2. Verify aria-labels present
3. Check button labels descriptive

**Expected:**
- All inputs have labels
- Buttons have accessible names
- Images have alt text

**Pass Criteria:** ✅ Labels present

---

### Test 11.5: Color Contrast
**Steps:**
1. Check text readability
2. Verify error messages visible
3. Check button text contrast

**Expected:**
- Text readable on backgrounds
- Error colors distinguishable
- WCAG AA compliance

**Pass Criteria:** ✅ Contrast adequate

---

### Test 11.6: Focus States
**Steps:**
1. Tab through interactive elements
2. Observe focus indicators

**Expected:**
- Clear focus ring on active element
- Focus visible on buttons/inputs
- No focus trapped

**Pass Criteria:** ✅ Focus visible

---

## Phase 12: Code Quality Verification (5 tests)

### Test 12.1: TypeScript Build
**Steps:**
1. Run `npm run build`
2. Check for TypeScript errors

**Expected:**
- 0 TypeScript errors
- All pages generated

**Pass Criteria:** ✅ Build passes

---

### Test 12.2: ESLint Check
**Steps:**
1. Run `npm run lint`
2. Check for errors/warnings

**Expected:**
- 0 errors in production code
- Warnings acceptable in tests

**Pass Criteria:** ✅ Lint passes

---

### Test 12.3: Console Errors
**Steps:**
1. Open DevTools Console
2. Navigate through all pages
3. Perform all actions

**Expected:**
- No red error messages
- Warnings acceptable
- No uncaught exceptions

**Pass Criteria:** ✅ Console clean

---

### Test 12.4: Network Errors
**Steps:**
1. Open DevTools Network tab
2. Navigate through app
3. Check for failed requests

**Expected:**
- No 500 errors
- No unexpected 404s
- All API calls succeed

**Pass Criteria:** ✅ Network healthy

---

### Test 12.5: Performance Check
**Steps:**
1. Open DevTools Performance tab
2. Record page load
3. Check load time

**Expected:**
- Pages load < 3 seconds
- No major blocking
- Reasonable bundle size

**Pass Criteria:** ✅ Performance acceptable

---

## Final Verification Checklist

### Functionality
- [ ] Student email sign up works
- [ ] Student phone sign up works
- [ ] Student guest join works
- [ ] Teacher email registration works
- [ ] Teacher school verification works
- [ ] Teacher profile creation works (triggers user creation)
- [ ] Admin login works
- [ ] PIN generation/rotation works (no gen_salt errors)
- [ ] Class creation works
- [ ] Class join works
- [ ] Assessment complete flow works

### Security
- [ ] No plaintext passwords
- [ ] SQL injection prevented
- [ ] XSS prevented
- [ ] Generic error messages
- [ ] Session security maintained
- [ ] Role-based access enforced
- [ ] PINs are bcrypt hashed in database

### Database Health
- [ ] pgcrypto extension in public schema
- [ ] All 28 migrations applied
- [ ] rotate_staff_pin function works
- [ ] create_user_on_teacher_profile trigger works
- [ ] RLS policies active on all tables
- [ ] get_user_enrolled_class_ids helper function works
- [ ] get_teacher_class_ids helper function works

### Role Handling
- [ ] Teachers see teacher dashboard content
- [ ] Teachers can access /app/teacher/* routes
- [ ] Students cannot access teacher routes
- [ ] Both app_metadata and user_metadata roles checked

### Quality
- [ ] Build passes (0 errors)
- [ ] All pages load
- [ ] Console clean (no empty error objects)
- [ ] Network healthy
- [ ] Responsive design works
- [ ] Accessibility basics met

---

## Test Completion

**Total Tests Completed:** ______ / 100+

**Issues Found:**
| Phase | Test | Description | Severity |
|-------|------|-------------|----------|
|       |      |             |          |

**Overall Assessment:**
- [ ] **PASS** - All critical tests passed
- [ ] **PASS WITH NOTES** - Minor issues found
- [ ] **FAIL** - Critical issues need fixing

**Tester:** _______________
**Date:** _______________
**Environment:** localhost:3000
**Browser:** _______________

---

**Guide Version:** 2.1
**Last Updated:** December 5, 2025
**Status:** Ready for Testing

---

## Appendix A: Known Issues & Fixes (December 2025)

This section documents issues that were discovered and fixed. If you encounter similar problems during testing, these notes may help with troubleshooting.

### A.1: PIN Generation Issues

**Symptom:** Error `function gen_salt(unknown, integer) does not exist` when generating/rotating school PINs.

**Root Cause:** PostgREST caching old function definitions after pgcrypto extension was modified.

**Solution:**
1. Run in Supabase SQL Editor: `NOTIFY pgrst, 'reload schema';`
2. Or use Supabase Dashboard: API Settings → Reload schema

**Verification:** Admin PIN page should generate PINs without errors.

---

### A.2: Teacher Profile Creation Failure

**Symptom:** Error `column "display_name" of relation "users" does not exist` when completing teacher registration.

**Root Cause:** The `create_user_on_teacher_profile` trigger was referencing non-existent columns in the `users` table.

**Solution:** Migration 026 fixed the trigger to use correct columns: `id, email, role, created_at`.

**Verification:** Teacher registration (Step 4) should complete without database errors.

---

### A.3: Role Checking Inconsistency

**Symptom:** Teachers redirected to student dashboard or shown student content.

**Root Cause:** Code was checking only `user_metadata.role` but teachers have role in `app_metadata` (set by admin/system).

**Solution:** All role checks now verify both `app_metadata.role` and `user_metadata.role`.

**Files Fixed:**
- `apps/web/src/app/app/dashboard/page.tsx`
- `apps/web/src/app/app/teacher/assessments/page.tsx`
- `apps/web/src/app/actions/auth.ts`

**Verification:** Teachers should see teacher-specific content on dashboard and have access to teacher pages.

---

### A.4: Empty Error Logging

**Symptom:** Logs showing `[AUTH:ERROR] {} undefined` without useful information.

**Root Cause:** Empty error objects being logged when no actual error occurred.

**Solution:** Added check `Object.keys(error).length > 0` before logging errors.

**Verification:** Console should not show empty error objects.

---

## Appendix B: Database Verification Steps

Before testing, verify the database is properly configured:

### B.1: Check pgcrypto Extension
```sql
SELECT e.extname, n.nspname as schema_name
FROM pg_extension e
JOIN pg_namespace n ON e.extnamespace = n.oid
WHERE e.extname = 'pgcrypto';
```
**Expected:** pgcrypto in `public` schema.

### B.2: Check rotate_staff_pin Function
```sql
SELECT n.nspname as schema_name, p.proname as function_name
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'rotate_staff_pin';
```
**Expected:** Function exists in `public` schema.

### B.3: Test PIN Rotation
```sql
-- Get a school ID first
SELECT id, school_name FROM schools LIMIT 1;

-- Then test (replace with actual school ID)
SELECT * FROM public.rotate_staff_pin('your-school-id', '1234');
```
**Expected:** `success: true`

### B.4: Check Trigger Function
```sql
SELECT n.nspname, p.proname
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'create_user_on_teacher_profile';
```
**Expected:** Function exists in `public` schema.

### B.5: Check RLS Helper Functions
```sql
SELECT n.nspname, p.proname
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname IN ('get_user_enrolled_class_ids', 'get_teacher_class_ids');
```
**Expected:** Both functions exist in `public` schema.

---

## Appendix C: Role Metadata Reference

Understanding where user roles are stored is critical for testing:

| Role | Primary Location | Fallback Location | Set By |
|------|-----------------|-------------------|--------|
| Teacher | `app_metadata.role` | `user_metadata.role` | Admin/System |
| Student | `user_metadata.role` | - | Self-registration |
| Admin | `app_metadata.role` | - | Super admin |

**Checking role in code:**
```typescript
const isTeacher = user?.app_metadata?.role === 'teacher' || user?.user_metadata?.role === 'teacher'
```

---

### A.5: RLS Infinite Recursion on Classes/Enrollments

**Symptom:** Error `infinite recursion detected in policy for relation "classes"` when loading teacher classes page.

**Root Cause:** Circular RLS policy dependency - `classes_select` policy checked `enrollments`, and `enrollments_select` checked `classes`.

**Solution:** Migrations 027-028 created SECURITY DEFINER helper functions that bypass RLS:
- `get_user_enrolled_class_ids(UUID)` - Returns class IDs for enrolled student
- `get_teacher_class_ids(UUID)` - Returns class IDs owned by teacher

**Verification:** Teacher classes page (`/app/teacher/classes`) should load without errors.

---

### A.6: Teacher Profile Column Reference Error

**Symptom:** Error `column teacher_profiles.id does not exist` or "Only teachers can create classes" even when signed in as teacher.

**Root Cause:** Code was using `.select('id')` on `teacher_profiles`, but this table uses `user_id` as primary key (not `id`).

**Solution:** Fixed all code references to use `.select('user_id')` instead of `.select('id')` in:
- `apps/web/src/app/actions/teacher.ts` (createClass, updateClass, deleteClass)
- `apps/web/src/app/actions/school.ts` (teacher verification)

**Verification:** Class creation should work when signed in as teacher.

---

## Appendix D: Critical Pre-Test Checklist

Before starting manual testing, complete these verification steps:

- [ ] Run all 28 migrations (check via `list_migrations` or Supabase dashboard)
- [ ] Verify pgcrypto extension is in public schema
- [ ] Reload PostgREST schema if any database changes were made
- [ ] Verify at least one school exists in the database
- [ ] Verify super admin account (atal.app.ai@gmail.com) is initialized
- [ ] Run `npm run build` to verify 0 TypeScript errors
- [ ] Clear browser cache/use incognito for clean testing
