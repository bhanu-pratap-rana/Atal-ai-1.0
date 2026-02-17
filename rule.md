# 🧠 ATAL AI - COMPLETE CODEBASE ANALYSIS RULES

> **When this file is marked, perform FULL codebase analysis using all available tools**
> **After finding issues, ALWAYS ask user permission before making any changes**

---

# 🚨 CRITICAL RULES

## 1. ZERO PATCHWORK POLICY
- **NEVER** apply band-aid fixes (e.g., wrapping in try/catch without understanding why)
- **NEVER** add `if (data)` checks without understanding root cause
- **ALWAYS** trace the data flow to find the actual problem
- **ALWAYS** fix the root cause, not the symptom
- **ALWAYS** follow industry best practices in all solutions
- **ASK** the user if you don't have enough information - NEVER guess or assume

### Root Cause Analysis Template:
```
ERROR: [What went wrong?]
SYMPTOM: [What does user observe?]
DATA FLOW:
  1. User action →
  2. Code path (file:line) →
  3. External call →
  4. Response →
  5. Where it fails
ROOT CAUSE: [Why it actually happened]
FIX: [Solution addressing root cause]
```

## 2. ASK BEFORE FIXING
After identifying issues, you MUST:
1. Present a complete list of all issues found
2. Propose a detailed plan with specific changes
3. **WAIT FOR USER APPROVAL** before making any changes
4. Only proceed after explicit permission

## 3. NO UNNECESSARY FILES
- **NEVER** create new files unless absolutely required
- **ALWAYS** prefer editing existing files
- **ALWAYS** check if similar logic already exists before creating
- **NEVER** create documentation files unless explicitly asked
- Keep project structure clean and minimal

## 4. CLEAN PROJECT STRUCTURE
```
apps/web/src/
├── app/
│   ├── (public)/     → Public routes (auth pages)
│   ├── app/          → Protected routes (dashboard)
│   └── actions/      → Server actions ONLY
├── components/       → Reusable UI components
├── lib/             → Utilities, clients, helpers
└── hooks/           → Custom React hooks

apps/db/migrations/   → Database migrations ONLY
```

## 5. BEST PRACTICES IN SOLUTIONS
When fixing issues, ALWAYS apply these best practices:

### Security Best Practices (OWASP Top 10 Aligned):
- **A01 - Broken Access Control**: Implement deny-by-default, validate permissions server-side
- **A02 - Cryptographic Failures**: Use bcrypt (12+ rounds), encrypt sensitive data at rest/transit
- **A03 - Injection**: Use parameterized queries, never string concatenation for SQL
- **A04 - Insecure Design**: Use secure design patterns, threat modeling
- **A05 - Security Misconfiguration**: Harden systems, disable unused features
- **A06 - Vulnerable Components**: Keep dependencies updated, monitor for vulnerabilities
- **A07 - Auth Failures**: Implement MFA, secure password policies, protect against brute force
- **A08 - Data Integrity Failures**: Verify software integrity, use signed updates
- **A09 - Logging Failures**: Implement comprehensive logging with structured loggers
- **A10 - SSRF**: Validate user-supplied URLs, use allowlists

### Additional Security Requirements:
- Validate ALL inputs with Zod schemas
- Use constant-time comparison for secrets
- Mask sensitive data in logs (emails, tokens, passwords)
- Rate limit ALL public endpoints (fail-closed on error)
- Never expose service role keys client-side

### Code Quality Best Practices:
- Keep functions small and focused (single responsibility)
- Use descriptive variable/function names
- Handle all error cases explicitly
- Use TypeScript strict mode (`strict: true` in tsconfig)
- Prefer composition over inheritance
- DRY (Don't Repeat Yourself) - but avoid premature abstraction
- No `any` types - use proper typing or `unknown`

### Database Best Practices (Supabase/PostgreSQL):
- Use transactions for multi-step operations
- Add indexes for frequently queried columns (especially FK columns)
- Use `.maybeSingle()` for SELECT (not `.single()`)
- Use RLS policies for row-level security
- Use SECURITY DEFINER functions for complex auth logic
- **Always enable RLS on ALL tables** - even "safe" tables
- Use `(SELECT auth.uid())` pattern in RLS for performance (InitPlan caching)
- Create separate policies for SELECT, INSERT, UPDATE, DELETE (not ALL)
- Place SECURITY DEFINER functions in private schemas

### React/Next.js Best Practices:
- Use Server Components where possible
- Handle loading and error states
- Use proper form validation with `useActionState`
- Implement proper cleanup in useEffect
- Use proper key props in lists
- Extract common patterns into custom hooks
- Components and Hooks must be pure
- Never call component functions directly

### Next.js Server Actions Security:
- Treat Server Actions as PUBLIC HTTP endpoints
- **Always** validate and sanitize all inputs
- **Always** verify authentication inside each action
- Use Zod `safeParse` for validation (return early on failure)
- Return serializable error objects (not thrown exceptions)
- Be careful with closure data (sensitive values can be exposed)
- Use `allowedOrigins` config to prevent CSRF attacks

### PWA (Progressive Web App) Best Practices:
- **Manifest**: Include all required fields (`name`, `short_name`, `icons`, `start_url`, `display`)
- **Icons**: Provide 192x192 and 512x512 icons (both regular and maskable)
- **Service Worker**: Register for offline functionality and caching
- **Offline-first**: Design for offline by default, sync when online
- **App Shell**: Cache static UI shell for instant loading
- **Responsive**: Support all screen sizes and orientations
- **HTTPS**: PWA requires secure context (HTTPS in production)
- **Installability**: Meet Chrome's installability criteria

### Offline-First Design Principles:
- Cache API responses for offline access
- Queue mutations when offline, sync when online
- Show clear offline/online status indicators
- Use optimistic UI updates with rollback on failure
- Store critical data in IndexedDB for persistence
- Handle network timeouts gracefully (don't block UI)

### Service Worker Guidelines:
- Use `next-pwa` for automatic service worker generation
- Configure precaching for app shell and static assets
- Use runtime caching for API responses
- Implement cache-first for static assets, network-first for API
- Handle service worker updates with user notification
- Test offline functionality before deployment

### Responsive Design Best Practices (Mobile-First):
- **Mobile-First Approach**: Base styles for mobile, enhance for larger screens using `min-width` media queries
- **Breakpoints**: Use Tailwind's consistent breakpoints (sm: 640px, md: 768px, lg: 1024px, xl: 1280px, 2xl: 1536px)
- **Touch Targets**: Minimum 44px (2.75rem) for all interactive elements (WCAG 2.5.5)
- **Fluid Typography**: Use `clamp()` for responsive font sizes that scale with viewport
- **Container Queries**: Use `@container` for component-level responsiveness (not just viewport)
- **Safe Areas**: Support notched devices with `env(safe-area-inset-*)`
- **Viewport Units**: Use `dvh` (dynamic viewport height) for mobile, not `vh`
- **No Horizontal Scroll**: Content must fit within viewport width at all breakpoints
- **Art Direction**: Use `<picture>` with `getImageProps()` for different images per breakpoint
- **Test on Real Devices**: Don't rely solely on browser dev tools - test 320px to 1920px

### Responsive Layout Patterns:
```css
/* ✅ CORRECT: Mobile-first with clamp() */
padding: clamp(1rem, 5vw, 2rem);
font-size: clamp(0.875rem, 2.5vw, 1rem);
max-width: min(400px, 90vw);

/* ✅ CORRECT: CSS Grid responsive */
grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));

/* ✅ CORRECT: Flex wrap for responsive */
display: flex;
flex-wrap: wrap;
gap: var(--card-gap);

/* ❌ WRONG: Fixed widths */
width: 400px;  /* Use max-width instead */

/* ❌ WRONG: Pixel font sizes */
font-size: 16px;  /* Use rem or clamp() */
```

### Container Queries (Component-Level Responsive):
```html
<!-- ✅ CORRECT: Container queries for reusable components -->
<div class="@container">
  <div class="grid grid-cols-1 @md:grid-cols-2 @lg:grid-cols-3 gap-4">
    <!-- Responds to PARENT container size, not viewport -->
  </div>
</div>

<!-- ✅ CORRECT: Named containers for nested scenarios -->
<div class="@container/sidebar">
  <nav class="@container/nav">
    <div class="@lg/sidebar:w-64 @md/nav:flex">
      <!-- Targets specific named container -->
    </div>
  </nav>
</div>

<!-- ✅ CORRECT: Arbitrary container breakpoints -->
<div class="@container">
  <div class="hidden @[450px]:block @[800px]:flex">
    <!-- Custom breakpoint values -->
  </div>
</div>
```

### Responsive Images (Next.js):
```typescript
// ✅ CORRECT: Responsive image with sizes prop
import Image from 'next/image'

<Image
  src={imageSrc}
  alt="Description"
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  style={{ width: '100%', height: 'auto' }}
  fill
/>

// ✅ CORRECT: Art direction with different images per breakpoint
import { getImageProps } from 'next/image'

const { props: { srcSet: desktop } } = getImageProps({
  width: 1440, height: 875, quality: 80, src: '/desktop.jpg'
})
const { props: { srcSet: mobile, ...rest } } = getImageProps({
  width: 750, height: 1334, quality: 70, src: '/mobile.jpg'
})

<picture>
  <source media="(min-width: 1000px)" srcSet={desktop} />
  <source media="(min-width: 500px)" srcSet={mobile} />
  <img {...rest} style={{ width: '100%', height: 'auto' }} />
</picture>
```

### Fluid Typography with Tailwind:
```typescript
// ✅ CORRECT: Tailwind responsive text classes (mobile-first)
<p className="text-sm md:text-base lg:text-lg">
  Scales from small on mobile to large on desktop
</p>

// ✅ CORRECT: Typography plugin with responsive modifiers
<article className="prose md:prose-lg lg:prose-xl">
  {markdownContent}
</article>

// ✅ CORRECT: Custom clamp() for precise control
<h1 style={{ fontSize: 'clamp(1.5rem, 4vw + 1rem, 3rem)' }}>
  Fluid heading
</h1>
```

### Touch Target Requirements:
```typescript
// ✅ CORRECT: 44px minimum touch target
<button className="min-h-[2.75rem] min-w-[2.75rem]">
  Click me
</button>

// ✅ CORRECT: Use touch-target utility class
<Button className="touch-target">Submit</Button>

// ❌ WRONG: Too small for touch
<button className="h-8 w-8">×</button>  /* Only 32px */
```

### Safe Area Support (Notched Devices):
```css
/* ✅ CORRECT: Respect safe areas */
padding-top: max(env(safe-area-inset-top, 0px), 1rem);
padding-bottom: max(env(safe-area-inset-bottom, 0px), 1rem);
padding-left: max(env(safe-area-inset-left, 0px), 1rem);
padding-right: max(env(safe-area-inset-right, 0px), 1rem);

/* ✅ CORRECT: Fixed bottom navigation */
.fixed-bottom {
  bottom: 0;
  padding-bottom: env(safe-area-inset-bottom, 0);
}
```

### Device-Specific Considerations:
| Device | Screen Width | Considerations |
|--------|--------------|----------------|
| **Phone** | < 640px | Single column, stacked buttons, 16px padding |
| **Tablet Portrait** | 640-768px | 2 columns, side margins, 24px padding |
| **Tablet Landscape** | 768-1024px | 2-3 columns, larger touch targets |
| **Laptop** | 1024-1280px | 3-4 columns, hover states, 32px padding |
| **Desktop** | > 1280px | Max-width container, full nav, 48px padding |

### Responsive Component Patterns:
```typescript
// ✅ CORRECT: Responsive component with clamp
export function ResponsiveCard({ children }: Props) {
  return (
    <div
      style={{
        padding: 'clamp(1rem, 4vw, 2rem)',
        maxWidth: 'min(500px, 95vw)',
        borderRadius: 'var(--radius-lg)',
      }}
    >
      {children}
    </div>
  )
}

// ✅ CORRECT: Tailwind responsive classes (mobile-first)
<div className="px-4 sm:px-6 md:px-8 lg:px-12">
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    {items.map(item => <Card key={item.id} />)}
  </div>
</div>

// ✅ CORRECT: Breakpoint range targeting
<div className="md:max-xl:flex">
  {/* Only applies between md (768px) and xl (1280px) */}
</div>

// ✅ CORRECT: Single breakpoint targeting
<div className="md:max-lg:hidden">
  {/* Hidden ONLY on md breakpoint (768px-1024px) */}
</div>

// ✅ CORRECT: Container query component
<div className="@container bg-surface rounded-lg p-4">
  <div className="flex flex-col @sm:flex-row @lg:gap-6 gap-2">
    <div className="@md:w-1/3">Sidebar content</div>
    <div className="@md:w-2/3">Main content</div>
  </div>
</div>
```

### Tailwind Responsive Modifiers Reference:
| Modifier | Min-Width | CSS |
|----------|-----------|-----|
| `sm:` | 640px | `@media (min-width: 640px)` |
| `md:` | 768px | `@media (min-width: 768px)` |
| `lg:` | 1024px | `@media (min-width: 1024px)` |
| `xl:` | 1280px | `@media (min-width: 1280px)` |
| `2xl:` | 1536px | `@media (min-width: 1536px)` |
| `max-sm:` | < 640px | `@media (max-width: 639px)` |
| `max-md:` | < 768px | `@media (max-width: 767px)` |
| `@sm:` | Container 24rem | `@container (min-width: 24rem)` |
| `@md:` | Container 28rem | `@container (min-width: 28rem)` |
| `@lg:` | Container 32rem | `@container (min-width: 32rem)` |

---

# 🚀 ANALYSIS INSTRUCTIONS

When this file is marked, perform complete codebase audit:

## 🔍 MULTI-LENS ANALYSIS APPROACH
Apply these specialized perspectives for comprehensive analysis:

| Lens | Focus Area | Key Questions |
|------|------------|---------------|
| **Architectural** | Design patterns, modularity | Is code organized? Are concerns separated? |
| **Security** | Vulnerabilities, auth, data protection | Could this be exploited? Is data safe? |
| **Performance** | Bottlenecks, optimization | Is this efficient? Any N+1 queries? |
| **Business Logic** | Correctness, edge cases | Does this do what user expects? |
| **Code Quality** | Readability, maintainability | Can others understand this? |
| **Accessibility** | ARIA, keyboard nav, screen readers | Can everyone use this? |
| **PWA/Offline** | Service worker, caching, installability | Does it work offline? Is it installable? |

---

## 1. 🗄️ DATABASE ANALYSIS

### Tools to Use:
```
mcp__supabase__list_projects        → Get active project
mcp__supabase__list_tables          → List all tables
mcp__supabase__list_migrations      → Check migrations (expect 31+)
mcp__supabase__execute_sql          → Run verification queries
mcp__supabase__get_advisors         → Check security & performance
Read DATABASE.md                    → Compare with actual state
```

### Verify:
- [ ] All migrations applied
- [ ] All 9 SECURITY DEFINER functions exist
- [ ] All RLS policies active
- [ ] FK indexes exist
- [ ] DATABASE.md matches Supabase
- [ ] Column names match exactly in code
- [ ] Use `user_id` for profiles (not `id`)

### Verification Query:
```sql
SELECT proname FROM pg_proc WHERE proname IN (
  'is_teacher', 'get_teacher_student_ids', 'is_class_teacher',
  'is_enrolled_in_class', 'get_user_enrolled_class_ids',
  'get_teacher_class_ids', 'verify_staff_pin', 'rotate_staff_pin',
  'check_email_exists'
);
-- Expected: 9 rows
```

---

## 2. 🔒 SECURITY ANALYSIS

### Search Patterns:
```
Grep: "password" → No exposure in logs/messages
Grep: "catch\s*\(\s*\)\s*\{" → No bare catches (must log)
Grep: "console\.(log|error)" → Use logger instead
Grep: "SUPABASE.*KEY" → No secrets in code
```

### Verify:
- [ ] No passwords in success/error messages
- [ ] Rate limiting on ALL server actions
- [ ] Rate limiter = fail-closed (deny on error)
- [ ] Admin checks include `admin` AND `super_admin`
- [ ] Role checks in BOTH `app_metadata` and `user_metadata`
- [ ] Service role only via `createAdminClient()`

---

## 3. 🎨 THEME & STYLING CONSISTENCY

### Search Patterns:
```
Grep: "text-purple|text-blue|text-green" → No hardcoded colors
Grep: "#[0-9a-fA-F]{3,6}" → No hex colors
Grep: "style=\{\{.*color" → No inline color styles
```

### Verify:
- [ ] Uses CSS variables (`text-primary`, `bg-background`)
- [ ] Consistent button/card/input styling
- [ ] No hardcoded color values
- [ ] Theme tokens used throughout

---

## 4. 🔧 CODE QUALITY

### Commands:
```bash
npm run build  → Must pass with 0 errors
```

### Search Patterns:
```
Grep: ": any" → No any types
Grep: "// TODO" → Incomplete work
Grep: "console\.(log|warn|error)" → Use logger
Grep: "catch\s*\(\s*\)\s*\{" → No bare catches
```

### Verify:
- [ ] Build passes (0 TypeScript errors)
- [ ] No `any` types
- [ ] No bare catch blocks
- [ ] No console.log in production
- [ ] Files < 1500 lines (single-purpose files may exceed if cohesive)
- [ ] No duplicate logic
- [ ] No commented-out code
- [ ] All imports resolve correctly
- [ ] No unused imports/exports
- [ ] No circular dependencies

### Import/Export Patterns:
```typescript
// ✅ CORRECT: Named exports for utilities
export { functionA, functionB } from './utils'

// ✅ CORRECT: Default export for components
export default function MyComponent() {}

// ❌ WRONG: Importing from index when direct import is better
import { util } from '@/lib'  // Avoid barrel exports for large modules

// ❌ WRONG: Unused imports
import { unusedFunction } from './utils'  // Remove if not used
```

---

## 4.5. 🧹 DEAD CODE, DUPLICATE CODE & CODE HYGIENE

### Search Patterns for Dead/Unused Code:
```
Grep: "^export (const|function|class|type|interface)" → Find all exports
Grep: "// TODO|// FIXME|// HACK|// XXX" → Incomplete work markers
Grep: "console\.(log|warn|error|debug)" → Debug statements (use logger)
Grep: "debugger" → Debugger statements (remove before production)
Grep: "^\s*//" followed by code → Commented-out code blocks
Grep: "export.*\{[^}]*\}" → Check if all named exports are used
```

### Search Patterns for Duplicate Code:
```
Grep: Similar function signatures across files
Grep: "async function (create|update|delete|get|fetch)" → CRUD patterns
Grep: "useState.*useState.*useState" → Repeated state patterns (extract hook)
Grep: "className=\".*bg-.*rounded.*p-" → Repeated Tailwind patterns (extract component)
Grep: "if \(error\).*return.*error" → Repeated error handling (extract utility)
```

### Dead Code Detection Checklist:
- [ ] No unused imports (TypeScript compiler catches these)
- [ ] No unused exports (manually verify or use ts-prune)
- [ ] No unreachable code after return/throw/break
- [ ] No unused variables or parameters
- [ ] No commented-out code blocks
- [ ] No TODO/FIXME comments without tickets
- [ ] No debugger statements
- [ ] No console.log (use structured logger)
- [ ] No unused CSS classes or Tailwind utilities
- [ ] No orphaned files (files not imported anywhere)

### Duplicate Code Detection Checklist:
- [ ] No copy-pasted functions (extract to shared utility)
- [ ] No repeated validation logic (use Zod schemas)
- [ ] No repeated error handling (use error boundary/utility)
- [ ] No repeated form patterns (extract form component)
- [ ] No repeated API call patterns (extract custom hook)
- [ ] No repeated Tailwind class combinations (extract to CSS/component)
- [ ] No repeated type definitions (share types)
- [ ] No similar components with minor variations (make configurable)

### Code Smell Patterns to Detect:
```typescript
// ❌ SMELL: God component (>300 lines)
// FIX: Break into smaller focused components

// ❌ SMELL: Prop drilling (passing props >3 levels)
// FIX: Use context or composition

// ❌ SMELL: Repeated try/catch with same pattern
// FIX: Extract error handling utility
try { ... } catch (e) { console.error(e); return { error: 'Failed' } }

// ❌ SMELL: Magic numbers/strings
const timeout = 5000  // What is 5000?
// FIX: Use named constants
const AUTH_TIMEOUT_MS = 5000

// ❌ SMELL: Nested ternaries
const result = a ? (b ? c : d) : (e ? f : g)
// FIX: Use if/else or extract to function

// ❌ SMELL: Long parameter lists (>4 params)
function doSomething(a, b, c, d, e, f) {}
// FIX: Use options object
function doSomething(options: DoSomethingOptions) {}

// ❌ SMELL: Boolean parameters
function fetchData(includeDeleted: boolean) {}
// FIX: Use options object or separate functions
function fetchData(options: { includeDeleted?: boolean }) {}
function fetchDataWithDeleted() {}
```

### Refactoring Opportunities to Find:
```
Pattern: Multiple files with similar structure
Action: Extract shared base component/hook

Pattern: Repeated Supabase query patterns
Action: Extract to shared data access layer

Pattern: Similar validation across forms
Action: Create shared Zod schemas

Pattern: Repeated auth checks
Action: Use middleware or HOC

Pattern: Similar error messages
Action: Create error constants/utility

Pattern: Copy-pasted component with slight variations
Action: Make component configurable with props
```

### Commands for Code Analysis:
```bash
# Find large files (potential god objects)
find apps/web/src -name "*.tsx" -o -name "*.ts" | xargs wc -l | sort -n | tail -20

# Find files with many imports (potential high coupling)
grep -l "^import" apps/web/src/**/*.ts* | xargs -I {} sh -c 'echo "$(grep -c "^import" {}) {}"' | sort -n | tail -20

# Find unused exports (requires ts-prune or manual review)
# npx ts-prune --project tsconfig.json

# Find duplicate strings (potential constants)
grep -roh '"[^"]\{20,\}"' apps/web/src | sort | uniq -c | sort -rn | head -20

# Find similar function names (potential duplicates)
grep -roh 'function [a-zA-Z]*' apps/web/src | sort | uniq -c | sort -rn | head -20

# Check for console statements
grep -rn "console\." apps/web/src --include="*.ts" --include="*.tsx" | grep -v "logger"

# Find TODO/FIXME comments
grep -rn "TODO\|FIXME\|HACK\|XXX" apps/web/src --include="*.ts" --include="*.tsx"
```

### TypeScript Config for Dead Code Detection:
```json
{
  "compilerOptions": {
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "strictNullChecks": true,
    "strict": true
  }
}
```

### ESLint Rules for Code Hygiene:
```json
{
  "rules": {
    "no-unused-vars": "error",
    "no-unreachable": "error",
    "no-console": "warn",
    "no-debugger": "error",
    "no-duplicate-imports": "error",
    "no-else-return": "warn",
    "no-empty": "error",
    "no-extra-boolean-cast": "error",
    "prefer-const": "error",
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }]
  }
}
```

### Common Refactoring Actions:
| Code Smell | Detection | Refactoring |
|------------|-----------|-------------|
| Duplicate validation | Same Zod schema in multiple files | Extract to `@/lib/schemas` |
| Duplicate error handling | Same try/catch pattern | Create `withErrorHandling()` utility |
| Duplicate form logic | Similar useForm patterns | Extract custom hook |
| Duplicate API calls | Same Supabase queries | Create data access functions |
| Duplicate components | Copy-pasted with variations | Make configurable with props |
| Magic strings | Hardcoded strings repeated | Create constants file |
| God component | >300 lines, many responsibilities | Split into focused components |
| Prop drilling | Props passed >3 levels deep | Use React Context |
| Callback hell | Nested .then() chains | Convert to async/await |

### When to Extract vs When to Keep Inline:
```
EXTRACT when:
- Logic is used in 3+ places
- Logic is complex (>10 lines)
- Logic has clear single responsibility
- Logic requires testing independently
- Logic changes together across usages

KEEP INLINE when:
- Used only 1-2 times
- Very simple (1-3 lines)
- Context-specific (won't be reused)
- Extracting adds more complexity
```

---

## 5. 📊 LOGIC & FUNCTIONALITY

### Verify:
- [ ] `.maybeSingle()` for SELECT queries
- [ ] `.single()` ONLY for INSERT operations
- [ ] Proper null/undefined handling
- [ ] Error messages user-friendly
- [ ] Loading states handled
- [ ] Edge cases covered

### Common Mistakes:
```typescript
// WRONG
.from('table').select().single()  // Throws if no rows

// CORRECT
.from('table').select().maybeSingle()  // Returns null if no rows
```

---

## 6. 🔄 DATA FLOW & SYNCHRONIZATION ANALYSIS

### Critical Data Flow Patterns to Verify:

**For ALL User Roles, verify data flows correctly:**

| Role | Data Source | Expected Result |
|------|-------------|-----------------|
| **Student** | enrollments → classes → teacher_profiles | See enrolled classes with teacher name/email |
| **Student** | student_profiles | See own profile data |
| **Teacher** | classes → enrollments → student_profiles | See enrolled students with name, roll, class |
| **Teacher** | teacher_profiles | See own profile and school info |
| **Admin** | schools, teacher_profiles, student_profiles, enrollments | See aggregate counts and metrics |
| **Super Admin** | admin_users, all above | Full access to all data + admin management |

### Search Patterns for Data Flow Issues:
```
Grep: "Bearer.*apiKey|Bearer.*anon" → Raw REST API calls (should use Supabase client)
Grep: "fetch\(.*rest/v1" → Direct REST calls bypassing Supabase client
Grep: "Authorization.*Bearer" → Check if using user token vs anon key
Grep: "\.from\('enrollments'\)" → Enrollment queries (verify RLS works)
Grep: "\.from\('student_profiles'\)" → Student profile queries
Grep: "\.from\('teacher_profiles'\)" → Teacher profile queries
```

### Verify API Authentication Pattern:
```typescript
// ❌ WRONG: Uses anon key - RLS sees anonymous user
const response = await fetch(
  `${baseUrl}/rest/v1/enrollments?student_id=eq.${userId}`,
  { headers: { 'Authorization': `Bearer ${apiKey}` } }  // apiKey is anon key!
)

// ✅ CORRECT: Uses Supabase client with user session
const supabase = await createClient()  // Has user's JWT token
const { data } = await supabase
  .from('enrollments')
  .select('*')
  .eq('student_id', userId)
```

### Data Flow Checklist by User Role:

**Student Data Flow:**
- [ ] Student sees list of enrolled classes
- [ ] Each class shows teacher name (not just email)
- [ ] Each class shows subject if available
- [ ] Student can join class with code + PIN
- [ ] Student cannot join same class twice
- [ ] After joining, class appears immediately
- [ ] Student profile shows correct school, class, roll number

**Teacher Data Flow:**
- [ ] Teacher sees list of their classes
- [ ] Each class shows enrolled student count
- [ ] Class detail shows roster with student names
- [ ] Roster shows roll number column
- [ ] Roster shows class/grade column
- [ ] Teacher can invite students
- [ ] New enrollments appear immediately
- [ ] Teacher profile shows correct school info

**Admin Data Flow:**
- [ ] Dashboard shows total schools count
- [ ] Dashboard shows total teachers count
- [ ] Dashboard shows total students count
- [ ] Dashboard shows active/inactive PIN stats
- [ ] PIN management shows all schools
- [ ] Admin list shows all admins
- [ ] Can create/delete admins (super_admin only)

**Super Admin Data Flow:**
- [ ] All admin capabilities plus:
- [ ] Can manage other admins
- [ ] Can see system-wide metrics
- [ ] Full access to admin management

### Common Data Flow Issues:

| Issue | Symptom | Root Cause | Fix |
|-------|---------|------------|-----|
| Empty list despite data exists | "No items" when DB has rows | Wrong auth token (anon vs user) | Use Supabase client |
| RLS blocking query | Query returns empty array | Policy condition fails | Check `auth.uid()` matches |
| Duplicate records | Same item appears twice | Missing unique check or RLS blocks check | Use SECURITY DEFINER function |
| Stale data | Old data shows after update | Missing `revalidatePath()` | Add revalidation |
| Missing related data | Class shows but no teacher name | Wrong JOIN or FK not fetched | Fix SELECT query |
| Partial data | Some fields null | RLS blocks related table | Add cross-table RLS policy |

### Data Flow Debug Steps:
```
1. Identify the query location (file:line)
2. Check if using Supabase client vs raw fetch
3. Verify RLS policy allows the operation
4. Check if auth.uid() returns expected user
5. Verify foreign key relationships work
6. Check if SECURITY DEFINER function needed
7. Verify revalidatePath() called after mutations
```

### SECURITY DEFINER Functions for Data Flow:

Use SECURITY DEFINER when:
- Teacher needs to read enrolled students (cross-table RLS)
- Checking for duplicate enrollment before insert
- Aggregating counts across tables
- Any query that needs to bypass RLS for legitimate reasons

```sql
-- Example: Safe enrollment with duplicate check
CREATE FUNCTION safe_enroll_student(p_class_id uuid, p_student_id uuid)
RETURNS jsonb
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  -- Check exists (bypasses RLS)
  IF EXISTS (SELECT 1 FROM enrollments WHERE class_id = p_class_id AND student_id = p_student_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Already enrolled');
  END IF;

  -- Insert new enrollment
  INSERT INTO enrollments (class_id, student_id) VALUES (p_class_id, p_student_id);

  RETURN jsonb_build_object('success', true);
END;
$$;
```

---

## 7. 🔀 BROKEN LOGIC, INCONSISTENCIES & FLOW ANALYSIS

### Search Patterns for Broken Routes/Redirects:
```
Grep: "redirect\('[^']+'\)" → Check all redirect targets exist
Grep: "href=\"/[^\"]+\"" → Check all Link hrefs exist
Grep: "router\.push\(" → Check all programmatic navigation targets
Grep: "Link.*href=" → Verify Link component destinations
```

### Verify Redirect Consistency:
- [ ] All `redirect()` targets exist as actual routes
- [ ] Student pages redirect to `/student/start` (not `/login`)
- [ ] Teacher pages redirect to `/teacher/start` (not `/login`)
- [ ] Admin pages redirect to `/admin/login` (not `/login`)
- [ ] No redirects to non-existent routes like `/login`

### Search Patterns for Role Check Consistency:
```
Grep: "app_metadata\?\.role" → Role checks via app_metadata
Grep: "user_metadata\?\.role" → Role checks via user_metadata (legacy)
Grep: "role === 'admin'" → Check includes super_admin too
Grep: "isTeacher|isAdmin|isSuperAdmin" → Role boolean patterns
```

### Verify Role Access Patterns:
- [ ] All role checks use `app_metadata?.role` (primary source)
- [ ] Admin checks include BOTH `admin` AND `super_admin`
- [ ] Teacher pages allow `teacher`, `admin`, and `super_admin`
- [ ] Consistent pattern across all protected pages
- [ ] No pages checking only `user_metadata` for roles

### Common Role Check Patterns:
```typescript
// ✅ CORRECT: Check app_metadata for all admin-level roles
const role = user.app_metadata?.role
const isTeacherOrAdmin = role === 'teacher' || role === 'admin' || role === 'super_admin'

// ✅ CORRECT: Admin-only check
const isAdmin = role === 'admin' || role === 'super_admin'

// ❌ WRONG: Missing super_admin
const isAdmin = role === 'admin'  // Misses super_admin!

// ❌ WRONG: Using user_metadata instead of app_metadata
const role = user.user_metadata?.role  // Not authoritative!
```

### Search Patterns for Flow Issues:
```
Grep: "getCurrentUser|getUser" → Auth flow entry points
Grep: "if \(!user\)" → Auth guards
Grep: "\.then\(.*\.then\(" → Nested promises (should be async/await)
Grep: "await.*await.*await" → Sequential awaits (can parallelize?)
```

### Verify Authentication Flow:
- [ ] All protected pages check `user` before rendering
- [ ] Consistent auth check pattern (`if (!user) redirect(...)`)
- [ ] No pages with missing auth guards
- [ ] Auth redirects go to appropriate login pages by user type

### Search Patterns for Data Flow Issues:
```
Grep: "useState.*null" → Check for proper null handling
Grep: "data\?" → Optional chaining (verify data can be null)
Grep: "error\s*\|\|" → Error fallback patterns
Grep: "success.*false.*error" → Action error responses
```

### Verify Data Consistency:
- [ ] Server actions return consistent `{ success, data?, error? }` shape
- [ ] Error messages are user-friendly (no technical jargon)
- [ ] Loading states handled before data available
- [ ] No assumptions about data existence without checks

### Search Patterns for Import/Export Issues:
```
Grep: "import.*from.*'" → Check imports resolve
Grep: "export (default |async )?function" → Exported functions
Bash: npm run build → Catches unresolved imports
```

### Verify Import Consistency:
- [ ] No unused imports (run build to catch)
- [ ] No circular dependencies
- [ ] Consistent import paths (`@/` alias used)
- [ ] No imports from deleted/moved files

### Flow Analysis Checklist:
```
User Journey: Student Sign-In
1. /student/start → Sign in form
2. Success → /app/dashboard
3. Failure → Error message, stay on page
4. Already auth'd → Redirect to dashboard

User Journey: Teacher Sign-In
1. /teacher/start → Sign in form
2. Success → /app/teacher/classes
3. Failure → Error message, stay on page
4. Already auth'd → Redirect to classes

User Journey: Protected Page Access
1. /app/* without auth → Redirect to /student/start or /teacher/start
2. /app/teacher/* without teacher role → Redirect to /app/dashboard
3. /admin/* without admin role → Redirect to /admin/login
```

### Common Flow Issues to Check:
| Issue | Symptom | Fix |
|-------|---------|-----|
| Redirect to `/login` | 404 error | Use `/student/start` or `/teacher/start` |
| Missing role check | Unauthorized access | Add `app_metadata.role` check |
| Inconsistent role check | Some admins blocked | Include `admin` AND `super_admin` |
| Wrong redirect target | User confusion | Match redirect to user type |
| Missing auth guard | Data leak | Add `if (!user) redirect()` |
| Stale imports | Build failure | Remove unused imports |

---

## 7. ♿ ACCESSIBILITY

### Search Patterns:
```
Grep: "<button" → Should have text or aria-label
Grep: "<input" → Should have associated label
```

### Verify:
- [ ] All buttons have aria-label or text
- [ ] All inputs have labels
- [ ] Keyboard navigation works
- [ ] Focus states visible

---

## 8. 📱 RESPONSIVE DESIGN ANALYSIS

### Search Patterns:
```
Grep: "width:\s*\d+px" → Fixed pixel widths (should be responsive)
Grep: "height:\s*\d+px" → Fixed pixel heights (check if necessary)
Grep: "font-size:\s*\d+px" → Pixel font sizes (use rem or clamp)
Grep: "h-\d(?!\d)" → Small fixed heights (check touch targets)
```

### Verify:
- [ ] All buttons/inputs have min 44px touch targets
- [ ] Uses CSS variables for spacing (`var(--page-padding-x)`)
- [ ] Uses `clamp()` for fluid typography
- [ ] No fixed widths that break on mobile
- [ ] Grid/flex layouts are responsive
- [ ] Safe area insets for notched devices
- [ ] Test on 320px width (smallest phone)
- [ ] Test on 1920px width (desktop)

### Responsive Breakpoint Verification:
```
Phone (< 640px):
- [ ] Single column layouts
- [ ] Full-width buttons
- [ ] Stacked form fields
- [ ] 16px base padding

Tablet (640-1024px):
- [ ] 2-column grids where appropriate
- [ ] Side-by-side buttons
- [ ] 24px base padding

Desktop (> 1024px):
- [ ] 3-4 column grids
- [ ] Max-width containers
- [ ] Hover states visible
- [ ] 32-48px base padding
```

---

## 9. 📱 PWA ANALYSIS

### Files to Check:
```
apps/web/public/manifest.json  → PWA manifest
apps/web/next.config.ts        → next-pwa configuration
apps/web/public/*.png          → App icons
```

### Verify Manifest:
- [ ] `name` and `short_name` defined
- [ ] `start_url` set to "/"
- [ ] `display` set to "standalone"
- [ ] Icons: 192x192, 512x512 (both regular and maskable)
- [ ] `theme_color` and `background_color` match app theme
- [ ] `shortcuts` configured for quick actions

### Verify Service Worker:
- [ ] Service worker registered on app load
- [ ] Precaching configured for app shell
- [ ] Runtime caching for API endpoints
- [ ] Offline fallback page exists
- [ ] Cache versioning strategy in place

### Verify Offline Functionality:
- [ ] App shell loads when offline
- [ ] Cached data displays when offline
- [ ] Clear offline indicator shown to user
- [ ] Forms queue submissions when offline
- [ ] Graceful error handling for failed requests

### Verify Installability:
- [ ] Manifest link in HTML head
- [ ] Valid manifest.json (test with Lighthouse)
- [ ] All icons present and correct size
- [ ] HTTPS enabled (production)
- [ ] Service worker registered

### PWA Commands:
```bash
# Test with Lighthouse
npx lighthouse http://localhost:3000 --view --preset=desktop

# Check manifest
curl http://localhost:3000/manifest.json | jq .
```

---

## 10. 📁 FILE STRUCTURE

### Verify:
- [ ] No duplicate utility functions
- [ ] No orphaned/unused files
- [ ] Server actions in actions/ only
- [ ] Components properly organized
- [ ] No unnecessary new files created

---

## 11. 📄 DOCUMENTATION SYNC

### Verify:
- [ ] DATABASE.md matches Supabase
- [ ] PROJECT_STATUS_REPORT.md current
- [ ] MANUAL_TESTING_GUIDE.md current
- [ ] Migration count correct

---

# 📋 ISSUE PRIORITIES

| Priority | Category | Examples |
|----------|----------|----------|
| P0-CRITICAL | Security | Password exposure, missing auth |
| P0-CRITICAL | Breaking | Build fails, crashes |
| P1-HIGH | Logic | Wrong behavior, broken flows |
| P1-HIGH | Flow Issues | Broken redirects, missing auth guards |
| P1-HIGH | Database | Missing columns, wrong queries |
| P1-HIGH | Dead Code | Unreachable code, broken imports |
| P2-MEDIUM | Role Consistency | Missing super_admin checks |
| P2-MEDIUM | Code Quality | Any types, bare catches |
| P2-MEDIUM | Duplicate Code | Copy-pasted logic, repeated patterns |
| P2-MEDIUM | Code Smells | God components, magic numbers |
| P2-MEDIUM | Theme | Hardcoded colors |
| P2-MEDIUM | Accessibility | Missing aria labels |
| P3-LOW | Unused Code | Unused exports, orphaned files |
| P3-LOW | Documentation | Outdated docs |

---

# ✅ OUTPUT FORMAT

After analysis, provide:

## 1. Issue Summary Table
```
| # | Issue | Category | Priority | File |
|---|-------|----------|----------|------|
| 1 | ... | Security | P0 | path/to/file.ts |
```

## 2. Root Cause Analysis (for each issue)
```
ERROR: [Description]
ROOT CAUSE: [Why this happened]
FIX: [Solution addressing root cause - NOT a patch]
```

## 3. Proposed Fix Plan
For each issue, explain:
- What's wrong
- WHY it's wrong (root cause)
- How to fix it properly
- Which file(s) to modify

## 4. Ask for Permission
```
🔔 I found X issues. Here's my proposed plan:

1. [Fix description - addressing root cause]
2. [Fix description - addressing root cause]
...

Do you want me to proceed with these fixes?
```

## 5. Wait for User Response
**DO NOT** make any changes until user says yes.

## 6. After Fixes Applied
- Run `npm run build` to verify 0 errors
- Update documentation if schema/behavior changed
- Report what was fixed and verify success

---

# 🔧 ESTABLISHED PATTERNS

## Supabase Queries:
```typescript
// ✅ CORRECT: SELECT with maybeSingle
.from('profiles').select().eq('user_id', id).maybeSingle()

// ✅ CORRECT: INSERT with single
.from('classes').insert({...}).select().single()

// ❌ WRONG: SELECT with single (throws on no rows)
.from('profiles').select().single()
```

## Supabase Error Handling:
```typescript
// ✅ CORRECT: Check error object before using data
const { data, error } = await supabase.from('table').select()

if (error) {
  serverLogger.error('Query failed', { error: error.message, code: error.code })
  return { success: false, error: 'Failed to fetch data' }
}

// Now safe to use data
return { success: true, data }
```

## Server Action Pattern:
```typescript
'use server'

import { z } from 'zod'

const Schema = z.object({
  email: z.string().email('Invalid email'),
  name: z.string().min(1, 'Name required'),
})

export async function createUser(formData: FormData) {
  // 1. Validate inputs with Zod
  const validatedFields = Schema.safeParse({
    email: formData.get('email'),
    name: formData.get('name'),
  })

  // 2. Return early if validation fails
  if (!validatedFields.success) {
    return {
      success: false,
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  // 3. Check authentication
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  // 4. Perform action with validated data
  const { data, error } = await supabase
    .from('users')
    .insert(validatedFields.data)
    .select()
    .single()

  if (error) {
    serverLogger.error('Insert failed', error)
    return { success: false, error: 'Failed to create user' }
  }

  return { success: true, data }
}
```

## Client Form with useActionState:
```typescript
'use client'

import { useActionState } from 'react'
import { createUser } from '@/app/actions'

const initialState = { message: '', errors: {} }

export function SignupForm() {
  const [state, formAction, pending] = useActionState(createUser, initialState)

  return (
    <form action={formAction}>
      <input type="email" name="email" required />
      {state?.errors?.email && (
        <p className="text-destructive">{state.errors.email}</p>
      )}
      <button disabled={pending}>
        {pending ? 'Submitting...' : 'Sign up'}
      </button>
      {state?.message && <p aria-live="polite">{state.message}</p>}
    </form>
  )
}
```

## Error Handling:
```typescript
// ✅ CORRECT
} catch (error) {
  clientLogger.error('Context', error instanceof Error ? error : { error })
  return { success: false, error: 'User-friendly message' }
}

// ❌ WRONG: Bare catch (patchwork)
} catch (error) {
  return { error: 'Failed' }
}
```

## Role Checking:
```typescript
// ✅ CORRECT: Check both locations
const isAdmin =
  user?.app_metadata?.role === 'admin' ||
  user?.app_metadata?.role === 'super_admin'

// ❌ WRONG: Only check one
const isAdmin = user?.app_metadata?.role === 'admin'
```

## Theme/Styling:
```typescript
// ✅ CORRECT
className="text-primary bg-background"

// ❌ WRONG
className="text-purple-500"
style={{ color: '#8b5cf6' }}
```

## RLS Policy Patterns (PostgreSQL):
```sql
-- ✅ CORRECT: Use (SELECT auth.uid()) for performance (InitPlan caching)
CREATE POLICY "users_own_data" ON profiles
FOR SELECT USING ((SELECT auth.uid()) = user_id);

-- ❌ WRONG: Direct function call (evaluated for each row)
CREATE POLICY "users_own_data" ON profiles
FOR SELECT USING (auth.uid() = user_id);

-- ✅ CORRECT: SECURITY DEFINER function for complex auth
CREATE FUNCTION private.has_role(role_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM roles_table
    WHERE (SELECT auth.uid()) = user_id AND role = role_name
  );
END;
$$;

-- Use in policy
CREATE POLICY "admin_access" ON sensitive_data
FOR ALL USING ((SELECT private.has_role('admin')));
```

## TypeScript Strict Mode Config:
```json
{
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noImplicitAny": true,
    "noImplicitThis": true
  }
}
```

---

# 🛠️ MCP TOOLS REFERENCE

## Available MCP Servers

| MCP Server | Status | Use For | Key Commands |
|------------|--------|---------|--------------|
| **PMD MCP** | ✅ Installed & Ready (@springsoftware/pmd-mcp@0.1.2) | Static code analysis, duplicate detection | `pmd_check`, `pmd_cpd`, `pmd_list_languages`, `pmd_list_rulesets` |
| **SonarQube MCP** | ⚠️ Configured (network issues) | Code quality metrics, issue tracking | `issues`, `quality_gate_status`, `measures_component` |
| **Context7 MCP** | ✅ Available | Latest library documentation | `resolve-library-id`, `get-library-docs` |
| **Memory MCP** | ✅ Available | Knowledge graph storage | `create_entities`, `create_relations`, `search_nodes` |
| **Sequential Thinking MCP** | ✅ Available | Complex problem solving | `sequentialthinking` |
| **Fetch MCP** | ✅ Available | Web resource access | `fetch` |
| **Supabase MCP** | ✅ Available | Database operations | `list_tables`, `list_migrations`, `execute_sql`, `get_advisors` |
| **Filesystem MCP** | ✅ Available | File operations | `read_file`, `write`, `list_dir`, `glob_file_search` |

## MCP Usage Guidelines

### 1. PMD MCP - Static Code Analysis

**Status:** ✅ Installed and Ready
- **Package**: `@springsoftware/pmd-mcp@0.1.2` (installed globally)
- **Java**: Java 17.0.12 (required dependency)
- **Setup Guide**: See `PMD_MCP_SETUP_GUIDE.md` for detailed documentation

**When to Use:**
- Before committing code changes
- When refactoring large functions
- To detect duplicate code patterns
- To check code quality against rulesets

**Usage Examples:**
```typescript
// Check a TypeScript file for best practices
pmd_check({
  path: "apps/web/src/lib/ai/services/tutor-service.ts",
  language_version: "ecmascript-ES2022",
  rulesets: ["category/ecmascript/bestpractices.xml"],
  minimum_priority: 3
})

// Find duplicate code in a directory
pmd_cpd({
  path: "apps/web/src/components",
  language: "typescript",
  minimum_tokens: 50
})

// List available languages
pmd_list_languages()

// List rulesets for a language
pmd_list_rulesets({ language: "typescript" })
```

**Supported Languages:**
- Static Analysis: `ecmascript`, `typescript` (via ecmascript), `java`, `python`, etc.
- Copy-Paste Detection: `typescript`, `python`, `java`, `javascript`, etc.

### 2. SonarQube MCP - Code Quality Metrics

**When to Use:**
- Get comprehensive code quality metrics
- Track issue resolution progress
- Check quality gate status
- Analyze security hotspots

**Usage Examples:**
```typescript
// Get issues for a project
issues({
  project_key: "Atal-AI",
  page: 1,
  page_size: 50,
  severities: ["CRITICAL", "MAJOR"]
})

// Check quality gate status
quality_gate_status({ project_key: "Atal-AI" })

// Get component measures
measures_component({
  component: "Atal-AI:apps/web/src/lib/ai",
  metric_keys: ["complexity", "cognitive_complexity", "code_smells"]
})
```

**Note:** If SonarQube server is unavailable, use the CSV export at `sonarqube-export/issues.csv`.

### 3. Context7 MCP - Library Documentation

**When to Use:**
- Need latest documentation for libraries (Next.js, Supabase, React, etc.)
- Verify best practices before implementation
- Check for breaking changes in library updates

**Usage Examples:**
```typescript
// Resolve library ID first
resolve_library_id({ libraryName: "vercel ai sdk" })

// Get documentation
get_library_docs({
  context7CompatibleLibraryID: "/vercel/ai",
  topic: "streaming",
  page: 1
})
```

**Common Libraries:**
- `vercel ai sdk` → `/vercel/ai`
- `next.js` → `/vercel/next.js`
- `supabase` → `/supabase/supabase`
- `react` → `/facebook/react`

### 4. Memory MCP - Knowledge Graph

**When to Use:**
- Store analysis findings for future reference
- Track code patterns and decisions
- Build knowledge graph of codebase relationships

**Usage Examples:**
```typescript
// Create entities
create_entities({
  entities: [{
    name: "TutorService",
    entityType: "Service",
    observations: ["Implements Socratic tutoring", "Uses RAG for context"]
  }]
})

// Create relations
create_relations({
  relations: [{
    from: "TutorService",
    to: "RAGService",
    relationType: "uses"
  }]
})

// Search nodes
search_nodes({ query: "AI services" })
```

### 5. Sequential Thinking MCP - Problem Solving

**When to Use:**
- Complex root cause analysis
- Multi-step problem solving
- Planning refactoring strategies
- Breaking down large tasks

**Usage Examples:**
```typescript
sequentialthinking({
  thought: "Analyzing why authentication fails...",
  thoughtNumber: 1,
  totalThoughts: 5,
  nextThoughtNeeded: true
})
```

### 6. Fetch MCP - Web Resources

**When to Use:**
- Get external documentation
- Fetch best practices from web
- Access API documentation

**Usage Examples:**
```typescript
fetch({
  url: "https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition",
  max_length: 5000
})
```

### 7. Supabase MCP - Database Operations

**When to Use:**
- Verify database schema
- Check migration status
- Run SQL queries for verification
- Get security/performance advisors

**Usage Examples:**
```typescript
// List tables
list_tables()

// List migrations
list_migrations()

// Execute SQL
execute_sql({ query: "SELECT COUNT(*) FROM curriculum_content" })

// Get advisors
get_advisors()
```

### 8. Filesystem MCP - File Operations

**When to Use:**
- Read/write files
- Search for files by pattern
- List directory contents

**Usage Examples:**
```typescript
// Read file
read_file({ target_file: "apps/web/src/lib/ai/services/tutor-service.ts" })

// Search files
glob_file_search({ glob_pattern: "**/tutor-service.ts" })

// List directory
list_dir({ target_directory: "apps/web/src/lib/ai" })
```

## MCP Analysis Workflow

### Standard Code Analysis Workflow:

1. **Initial Scan:**
   - Use `glob_file_search` to find relevant files
   - Use `grep` to search for patterns
   - Use `read_file` to examine code

2. **Quality Check:**
   - Use `pmd_check` for static analysis
   - Use `pmd_cpd` for duplicate detection
   - Use SonarQube `issues` for comprehensive metrics

3. **Documentation Lookup:**
   - Use `context7` for library best practices
   - Use `fetch` for external resources

4. **Knowledge Storage:**
   - Use `memory` to store findings
   - Use `sequentialthinking` for complex analysis

5. **Verification:**
   - Use `supabase` to verify database state
   - Use `run_terminal_cmd` to test builds

## ATAL AI - Full Code Scan Profile (Vulnerabilities, Maintainability, Performance)

When you say "run full code scan according to `rule.md`", follow this exact MCP-driven workflow for the ATAL AI project:

### Step 0 – Plan & Context
- Use **Sequential Thinking MCP** to plan the scan:
  ```typescript
  sequentialthinking({
    thought: "Plan a full-code scan for ATAL AI focusing on security, maintainability, and performance.",
    thoughtNumber: 1,
    totalThoughts: 5,
    nextThoughtNeeded: true
  })
  ```
- Use **Filesystem MCP** to confirm project roots:
  ```typescript
  list_dir({ target_directory: "apps/web" })
  list_dir({ target_directory: "apps/db" })
  ```

### Step 1 – SonarQube MCP (Global Quality & Security)
- Get current **issues** (security + reliability + maintainability):
  ```typescript
  issues({
    project_key: "Atal-AI",
    page: 1,
    page_size: 500,
    scopes: ["MAIN"]
  })
  ```
- Check **quality gate** and high-level risk:
  ```typescript
  quality_gate_status({ project_key: "Atal-AI" })
  ```
- Pull **metrics** for hotspots (cognitive complexity, duplication, coverage):
  ```typescript
  measures_component({
    component: "Atal-AI",
    metric_keys: [
      "bugs",
      "vulnerabilities",
      "code_smells",
      "cognitive_complexity",
      "duplicated_lines_density",
      "coverage"
    ]
  })
  ```
- If SonarQube is unreachable, use the CSV export that already exists in this repo:
  ```typescript
  read_file({ target_file: "sonarqube-export/issues.csv" })
  ```

### Step 2 – PMD MCP (Static Analysis & Duplicate Code)
- Run **ECMAScript/TypeScript** rules over the web app source:
  ```typescript
  pmd_check({
    path: "apps/web/src",
    language_version: "ecmascript-ES2022",
    rulesets: [
      "category/ecmascript/bestpractices.xml",
      "category/ecmascript/errorprone.xml",
      "category/ecmascript/codestyle.xml"
    ],
    minimum_priority: 3
  })
  ```
- Detect **copy-paste** / duplication in UI + libs:
  ```typescript
  pmd_cpd({
    path: "apps/web/src",
    language: "typescript",
    minimum_tokens: 50,
    ignore_literals: true,
    ignore_identifiers: true
  })
  ```

### Step 3 – Supabase MCP (Schema, Security, Performance)
- Confirm **migrations** and schema alignment:
  ```typescript
  list_migrations()
  list_tables()
  ```
- Run **key health queries** (replace with specific checks as needed):
  ```typescript
  execute_sql({ query: "SELECT COUNT(*) FROM curriculum_content" })
  execute_sql({ query: "SELECT COUNT(*) FROM student_profiles" })
  ```
- Get **Supabase advisors** for security/performance:
  ```typescript
  get_advisors()
  ```

### Step 4 – Filesystem + Grep MCP (Local Code Smell Sweep)
- Use **glob + grep** to find high-risk patterns:
  ```typescript
  glob_file_search({ glob_pattern: "apps/web/src/**/*.ts" })
  grep({
    pattern: ": any",
    path: "apps/web/src",
    type: "js",
    output_mode: "content"
  })
  grep({
    pattern: "console\\.(log|warn|error)",
    path: "apps/web/src",
    type: "js",
    output_mode: "content"
  })
  grep({
    pattern: "catch\\s*\\(\\s*\\)\\s*\\{",
    path: "apps/web/src",
    type: "js",
    output_mode: "content"
  })
  ```

### Step 5 – Library Best Practices (Context7 MCP)
- For any library under review (for example **Next.js**, **Supabase**, **Vercel AI SDK**), pull **latest** usage and best practices:
  ```typescript
  resolve_library_id({ libraryName: "next.js" })
  get_library_docs({
    context7CompatibleLibraryID: "/vercel/next.js",
    topic: "app-router",
    page: 1
  })
  ```

### Step 6 – Aggregate Findings (Memory MCP)
- Store the structured scan summary so the next analysis can build on it:
  ```typescript
  mcp_memory_create_entities({
    entities: [{
      name: "ATAL_AI_FULL_SCAN_YYYYMMDD",
      entityType: "ScanRun",
      observations: [
        "SonarQube: 752 issues, 13 bugs, 692 code smells",
        "PMD: duplicate UI card patterns in assessment components",
        "Supabase advisors: RLS and index health OK, see advisor notes"
      ]
    }]
  })
  ```

### Step 7 – Output & Approval
- Present results using the **OUTPUT FORMAT** defined earlier in this file:
  - Issue summary table
  - Root cause analysis per major issue
  - Proposed fix plan (grouped by security, maintainability, performance)
- **Ask for explicit approval** before modifying any files.

## MCP Best Practices

1. **Always verify MCP availability** before using
2. **Handle errors gracefully** - MCPs may be unavailable
3. **Cache results** when possible (use Memory MCP)
4. **Use appropriate tools** for each task (don't overuse one tool)
5. **Document findings** in Memory MCP for future reference
6. **Combine tools** for comprehensive analysis (e.g., PMD + SonarQube)

## 🎯 CONTEXT-AWARE ANALYSIS
When analyzing code:
1. **Understand the full context** - Don't just look at the diff, understand dependencies
2. **Trace impact** - How does this change affect other parts of the codebase?
3. **Check usage patterns** - How is this function/component used elsewhere?
4. **Verify conventions** - Does it follow existing patterns in this codebase?

---

# 📊 CURRENT PROJECT STATUS

| Metric | Current |
|--------|---------|
| Migrations | 34 |
| DB Functions | 11/11 |
| RLS Tables | 9/9 |
| Build | PASSING |
| TypeScript Errors | 0 |
| Compliance | 95% |

---

# ❌ ANTI-PATTERNS TO AVOID

| Anti-Pattern | Why It's Bad | What To Do Instead |
|--------------|--------------|-------------------|
| `catch (e) { return { error: 'Failed' } }` | Hides real error, no logging | Log error, return specific message |
| `if (data) { ... }` without context | Band-aid, doesn't fix root cause | Trace why data is undefined |
| `.single()` on SELECT queries | Throws error if no rows | Use `.maybeSingle()` |
| `console.log()` in production | Exposes info, not structured | Use `clientLogger` or `serverLogger` |
| Hardcoded colors `text-purple-500` | Breaks theme consistency | Use CSS vars `text-primary` |
| `role === 'admin'` only | Misses super_admin role | Check both `admin` AND `super_admin` |
| Creating new utility file | Duplicates existing logic | Search first, extend existing |
| Guessing parameter values | Leads to wrong fixes | Ask user if unclear |
| `auth.uid()` directly in RLS | Evaluated per row, slow | Use `(SELECT auth.uid())` |
| RLS with `USING (true)` | Exposes all data | Add proper conditions |
| Server Action without auth check | Public endpoint abuse | Always verify user inside action |
| `type: any` in TypeScript | Defeats type safety | Use proper types or `unknown` |
| Forgetting to enable RLS | Full table access to anon | Always enable RLS on all tables |
| Service role key in client | Full database access exposed | Only use in server-side code |
| Fixed `width: 400px` | Breaks on mobile devices | Use `max-width` or `min()` |
| Pixel font sizes `16px` | Not accessible, not responsive | Use `rem` or `clamp()` |
| Small touch targets `h-8` | Hard to tap on mobile | Minimum 44px (2.75rem) |
| No safe area support | Content hidden behind notch | Use `env(safe-area-inset-*)` |
| Horizontal scroll on mobile | Poor UX, content unreachable | Ensure content fits viewport |
| Copy-pasting code | Creates maintenance nightmare | Extract to shared utility/component |
| Commented-out code | Clutters codebase, confuses readers | Delete it (git has history) |
| `// TODO` without ticket | Never gets done, forgotten | Create issue/ticket or fix now |
| Unused imports | Build warnings, dead code | Remove immediately |
| Magic numbers `5000` | Unclear meaning, hard to maintain | Use named constants `TIMEOUT_MS` |
| God component (>300 lines) | Hard to test, maintain, understand | Split into focused components |
| Nested ternaries | Unreadable, error-prone | Use if/else or extract function |
| Long parameter lists (>4) | Hard to use, error-prone | Use options object pattern |
| Prop drilling (>3 levels) | Tight coupling, fragile | Use Context or composition |
| Redirect to `/login` | Route doesn't exist | Use `/student/start` or `/teacher/start` |
| `debugger` statement | Breaks production | Remove before commit |
| Orphaned files | Dead code, wasted space | Delete unused files |

---

# 🔐 COMMON SECURITY PITFALLS

## Supabase RLS Pitfalls:
| Pitfall | Risk | Prevention |
|---------|------|------------|
| RLS disabled on table | All data publicly accessible via API | Enable RLS on ALL tables, even "safe" ones |
| `USING (true)` policy | All rows visible to everyone | Add proper auth conditions |
| Missing anon role policy | Anonymous users can access data | Explicitly deny or restrict anon access |
| Foreign key data leaks | JOINs may expose related data | Add RLS to all joined tables |
| Service role in client | Bypasses all RLS policies | Only use `createAdminClient()` server-side |
| `SECURITY DEFINER` in public schema | Function accessible via API | Use private schemas for security functions |

## Next.js Server Actions Pitfalls:
| Pitfall | Risk | Prevention |
|---------|------|------------|
| No input validation | Injection attacks, crashes | Use Zod `safeParse` on ALL inputs |
| No auth check in action | Unauthorized access | Verify user at start of every action |
| Trusting closure data | Sensitive data exposure | Closures are encrypted but don't rely solely on this |
| Throwing errors | Exposes stack traces | Return serializable error objects |
| Missing rate limiting | DoS, brute force attacks | Rate limit all public actions |

## React Hooks Pitfalls:
| Pitfall | Risk | Prevention |
|---------|------|------------|
| Missing cleanup in useEffect | Memory leaks | Always return cleanup function |
| Direct component function calls | Breaks React internals | Let React call your components |
| Mutating hooks dynamically | Unpredictable behavior | Hooks must be called in same order |
| Missing dependency arrays | Stale closures or infinite loops | Use exhaustive-deps ESLint rule |

---

# 💡 PROMPTING TIPS FOR SPECIFIC ANALYSIS

Use these focused prompts when needed:

| Analysis Type | Think Like... | Focus On |
|---------------|---------------|----------|
| Security Review | Security engineer | Injection, auth bypass, data leaks |
| Performance | Performance engineer | N+1 queries, memory leaks, render cycles |
| Architecture | Senior architect | Separation of concerns, coupling, SOLID |
| Accessibility | Screen reader user | ARIA, keyboard nav, contrast |
| Business Logic | End user | Edge cases, error states, UX flows |

---

# 🚫 NEVER DO THESE

- ❌ Never generate or guess URLs
- ❌ Never hardcode secrets or credentials
- ❌ Never ignore error return values
- ❌ Never use `eval()` or dynamic code execution
- ❌ Never trust user input without validation
- ❌ Never commit without running build first
- ❌ Never make changes without user approval
- ❌ Never delete code without understanding its purpose
- ❌ Never copy-paste code without checking for existing utilities
- ❌ Never leave commented-out code in commits
- ❌ Never leave TODO/FIXME without creating a ticket
- ❌ Never leave unused imports or variables
- ❌ Never redirect to non-existent routes like `/login`
- ❌ Never use magic numbers without named constants
- ❌ Never leave `debugger` or `console.log` statements

---

# ⚠️ REMEMBER

1. **ZERO PATCHWORK** - Fix root cause, not symptoms
2. **ASK FIRST** - Always get permission before changes
3. **NO NEW FILES** - Prefer editing existing files
4. **TRACE DATA FLOW** - Understand why before fixing
5. **CLEAN STRUCTURE** - Keep project organized
6. **WAIT FOR APPROVAL** - Never proceed without user consent
7. **BEST PRACTICES** - Always apply industry standards
8. **VERIFY FIXES** - Run build after changes
9. **CONTEXT MATTERS** - Understand full impact before changing
10. **INCREMENTAL CHANGES** - Small, testable commits
11. **DRY PRINCIPLE** - Don't Repeat Yourself, extract shared logic
12. **CLEAN CODE** - Remove dead code, unused imports, commented code

---

# 🚀 PRODUCTION CHECKLIST

## Pre-Deployment Security:
- [ ] All RLS policies enabled and tested
- [ ] No service role keys exposed client-side
- [ ] All Server Actions validate inputs with Zod
- [ ] All Server Actions verify authentication
- [ ] Rate limiting configured on public endpoints
- [ ] Environment variables in `.env.local` (not committed)
- [ ] `NEXT_PUBLIC_` prefix only for public vars
- [ ] Sensitive data masked in all logs
- [ ] CSP headers configured

## Pre-Deployment Quality:
- [ ] `npm run build` passes with 0 errors
- [ ] TypeScript strict mode enabled
- [ ] No `any` types in production code
- [ ] All error states handled with user-friendly messages
- [ ] Loading states implemented
- [ ] Form validation on client AND server

## Database Readiness:
- [ ] All migrations applied to production
- [ ] Indexes on foreign key columns
- [ ] RLS policies tested with different user roles
- [ ] SECURITY DEFINER functions in private schemas
- [ ] DATABASE.md updated and accurate

## Monitoring & Logging:
- [ ] Structured logging (serverLogger, clientLogger)
- [ ] Error tracking configured (Sentry or similar)
- [ ] Performance monitoring enabled
- [ ] Audit logs for sensitive operations

## PWA Readiness:
- [ ] Valid manifest.json with all required fields
- [ ] Icons: 192x192, 512x512, maskable variants, apple-touch-icon
- [ ] Service worker registered and functional
- [ ] Offline fallback page works
- [ ] App passes Lighthouse PWA audit (90+ score)
- [ ] Install prompt appears on supported browsers
- [ ] App works in standalone mode
- [ ] Push notifications configured (if applicable)

## Responsive Design Readiness:
- [ ] Tested on 320px width (iPhone SE)
- [ ] Tested on 375px width (iPhone 12/13)
- [ ] Tested on 768px width (iPad portrait)
- [ ] Tested on 1024px width (iPad landscape)
- [ ] Tested on 1440px width (laptop)
- [ ] Tested on 1920px width (desktop)
- [ ] All touch targets are 44px minimum
- [ ] No horizontal scrolling on any device
- [ ] Safe area insets work on notched devices
- [ ] Text is readable without zooming
- [ ] Forms are usable on mobile keyboard
- [ ] Modals/dialogs fit on mobile screens

## Code Hygiene & Quality:
- [ ] No unused imports or exports
- [ ] No commented-out code blocks
- [ ] No TODO/FIXME comments (all converted to tickets)
- [ ] No `console.log` or `debugger` statements
- [ ] No `any` types in TypeScript
- [ ] No duplicate code (extracted to utilities)
- [ ] No magic numbers (all use named constants)
- [ ] No god components (all <300 lines)
- [ ] No orphaned files (all files imported somewhere)
- [ ] All redirects point to existing routes
- [ ] All role checks include both `admin` AND `super_admin`
- [ ] Build passes with 0 errors and 0 warnings

## Flow & Logic Consistency:
- [ ] All protected pages have auth guards
- [ ] Student pages redirect to `/student/start`
- [ ] Teacher pages redirect to `/teacher/start`
- [ ] Admin pages redirect to `/admin/login`
- [ ] All `.maybeSingle()` for SELECT queries
- [ ] All `.single()` only for INSERT operations
- [ ] Consistent error response shapes `{ success, data?, error? }`
- [ ] No broken imports or missing dependencies

## Data Flow & Synchronization:
- [ ] All API calls use authenticated Supabase client (NOT raw REST with anon key)
- [ ] Student can see enrolled classes with teacher details
- [ ] Teacher can see enrolled students with name, roll number, class
- [ ] No duplicate enrollments possible (database + action layer prevention)
- [ ] Admin can see all metrics (schools, teachers, students, PINs)
- [ ] Super Admin has access to all admin features
- [ ] Data displayed matches database state exactly

---

# 📚 REFERENCE DOCUMENTATION

| Resource | Purpose |
|----------|---------|
| [OWASP Top 10](https://owasp.org/www-project-top-ten/) | Web security vulnerabilities |
| [Next.js Security](https://nextjs.org/docs/app/guides/data-security) | Server Actions & data security |
| [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security) | Row Level Security best practices |
| [React Rules](https://react.dev/reference/rules) | Components & Hooks rules |
| [TypeScript Strict Mode](https://www.typescriptlang.org/tsconfig#strict) | Type safety configuration |
| [Web.dev PWA](https://web.dev/progressive-web-apps/) | PWA best practices & checklist |
| [Workbox](https://developer.chrome.com/docs/workbox/) | Service worker strategies |
| [next-pwa](https://github.com/shadowwalker/next-pwa) | Next.js PWA plugin docs |
| [Tailwind CSS Responsive](https://tailwindcss.com/docs/responsive-design) | Mobile-first responsive utilities |
| [Tailwind Container Queries](https://github.com/tailwindlabs/tailwindcss-container-queries) | Component-level responsiveness |
| [Next.js Image Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/images) | Responsive images & art direction |
| [WCAG Touch Target Size](https://www.w3.org/WAI/WCAG21/Understanding/target-size.html) | Accessibility touch target guidelines |

---

*Execute full analysis when this file is marked. Present findings with root cause analysis and wait for approval before fixing.*
