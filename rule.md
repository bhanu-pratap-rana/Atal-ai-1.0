# PROJECT BEHAVIOR & BEST PRACTICES

## 1. NO DUPLICATION
- Before creating a new component, utility, or hook, you MUST check the file tree to see if a similar one exists.
- If a similar functionality exists, propose refactoring it or reusing it rather than creating a new file.

## 2. ARCHITECTURAL CONSISTENCY
- Do not provide "patchwork" fixes (e.g., simple try-catch blocks) without explaining the root cause.
- If an error occurs, analyze the stack trace and explain *why* it happened before offering code.
- Maintain a "Single Source of Truth" for data fetching. Do not scatter `supabase.from()` calls in UI components; keep them in `@/lib/api` or actions.

## 3. TOOL USAGE (STRICT)
- **Supabase:** Before writing any SQL or Supabase SDK code, use the `supabase_mcp` tool to inspect the current schema of the target table(s). NEVER guess column names.
- **Documentation:** If I ask about a specific library (e.g., "How do I use Supabase Auth?"), automatically use the `context7_mcp` tool to fetch the latest docs. Do not rely on your internal training data for syntax.
- **Search:** Use `brave_search` only when you need to find high-level architectural patterns or solutions to obscure error messages.

## 4. CODING STANDARDS
- Use TypeScript strict mode.
- Prefer readable code over clever one-liners.
- Always add comments explaining "Why" complex logic exists, not just "What" it does.