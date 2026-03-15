# Repository Config Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rebuild the repository configuration flow into a default-simple setup page that supports global language selection, preset-based content scope, and optional manual file selection while aligning the UI with the real translation execution behavior.

**Architecture:** Keep the existing Next.js App Router and repository config route shape, but extend `TranslationConfig` with an explicit content-scope model and add a repository file-list endpoint for manual file picking. The work should remove misleading UI fields from the default path, preserve backward compatibility for existing saved configurations, and update the translation processor to honor the new scope model at runtime.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Prisma, MySQL, Octokit, existing app shell and toast system

---

### Task 1: Introduce the new config model and compatibility helpers

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `app/repositories/[id]/config/config-client-page.tsx`
- Modify: `app/api/repositories/[id]/config/route.ts`
- Modify: `lib/translation/process-task.ts`

**Step 1: Add schema fields for the new content-scope model**

Add:

- `scopeMode String @default("preset_common_docs")`
- `selectedFiles Json?`

Keep existing `filePatterns`, `excludePatterns`, `syncStrategy`, `targetBranchTemplate`, and `commitMessageTemplate` for backward compatibility.

**Step 2: Create shared normalization helpers**

Add or extract helper functions for:

- source-language normalization with `auto`
- target-language sanitization
- scope-mode fallback behavior for legacy rows
- selected-file sanitization

Use one consistent set of rules in both the config API and translation processor.

**Step 3: Update config API payload typing**

Adjust the config route so it reads and writes:

- `baseLanguage`
- `targetLanguages`
- `scopeMode`
- `selectedFiles`
- `triggerMode`
- `engine`

Continue accepting legacy rule fields so existing data remains readable.

**Step 4: Verify schema and type usage**

Run: `npm.cmd run lint`

Expected: PASS with no new type or lint errors in config-related files.

**Step 5: Commit**

If the user explicitly requests git operations:

```bash
git add prisma/schema.prisma app/repositories/[id]/config/config-client-page.tsx app/api/repositories/[id]/config/route.ts lib/translation/process-task.ts
git commit -m "feat: add repository config scope model"
```

### Task 2: Add repository candidate-file listing for manual selection

**Files:**
- Create: `app/api/repositories/[id]/files/route.ts`
- Modify: `lib/github/app.ts`
- Modify: `docs/API接口文档.md`

**Step 1: Add a file-list API route**

Create `GET /api/repositories/[id]/files` that:

- validates `session`
- validates repository ownership
- authenticates with the repository installation
- resolves the repository default branch
- fetches the recursive tree
- filters to likely translatable text files

Return file objects with:

- `path`
- `directory`
- `extension`
- `isDocumentationCandidate`

**Step 2: Keep the initial candidate list manageable**

Filter by default to likely documentation content:

- `README*`
- `docs/**`
- `*.md`
- `*.mdx`
- `*.txt`

Sort the response by directory and path so the UI can render stable groups.

**Step 3: Document the new endpoint**

Add it to `docs/API接口文档.md` with request and response shape.

**Step 4: Verify the route compiles cleanly**

Run: `npm.cmd run lint`

Expected: PASS with the new route and docs references in place.

**Step 5: Commit**

If the user explicitly requests git operations:

```bash
git add app/api/repositories/[id]/files/route.ts lib/github/app.ts docs/API接口文档.md
git commit -m "feat: add repository file picker API"
```

### Task 3: Make translation execution honor the new scope model

**Files:**
- Modify: `lib/translation/process-task.ts`
- Modify: `app/api/repositories/[id]/translate/route.ts`

**Step 1: Replace file-pattern-only selection with scope resolution**

In `process-task.ts`, resolve candidate files using:

- preset scope rules
- manual selected file list
- advanced rules fallback for legacy or power-user configs

**Step 2: Keep backward compatibility**

For repositories without a new `scopeMode` value:

- infer a compatible preset from existing `filePatterns`
- fall back to advanced rules if inference is unclear

**Step 3: Keep run behavior aligned with visible UI**

Use `triggerMode` only for user-facing run-mode semantics and remove any misleading assumptions tied to `syncStrategy`.

Do not expose branch-template or commit-template customization in this implementation unless runtime usage is actually added.

**Step 4: Verify translation path wiring**

Run: `npm.cmd run lint`

Expected: PASS with no broken config or translation references.

**Step 5: Commit**

If the user explicitly requests git operations:

```bash
git add lib/translation/process-task.ts app/api/repositories/[id]/translate/route.ts
git commit -m "fix: align translation execution with repository scope config"
```

### Task 4: Replace the hard-coded language grid with a scalable global picker

**Files:**
- Modify: `app/repositories/[id]/config/config-client-page.tsx`
- Create: `components/repository/language-multi-select.tsx`
- Create: `lib/i18n/languages.ts`

**Step 1: Add a global language dataset**

Create a reusable language list with:

- code
- English name
- native name
- search keywords
- popular flag

Keep the list large enough for real global coverage.

**Step 2: Build the multi-select component**

Create a language picker that supports:

- search
- selected chips
- quick-add from popular languages
- exclusion of the current base language

Avoid rendering all languages as a full button grid.

**Step 3: Default the source language to auto-detect**

Update the config page defaults and labels so `auto` is the first and recommended source-language option.

**Step 4: Verify the new picker**

Run: `npm.cmd run lint`

Expected: PASS with the new picker integrated into the config page.

**Step 5: Commit**

If the user explicitly requests git operations:

```bash
git add app/repositories/[id]/config/config-client-page.tsx components/repository/language-multi-select.tsx lib/i18n/languages.ts
git commit -m "feat: add global language picker for repository config"
```

### Task 5: Rebuild content scope into presets plus manual file selection

**Files:**
- Modify: `app/repositories/[id]/config/config-client-page.tsx`
- Create: `components/repository/content-scope-picker.tsx`
- Create: `components/repository/repository-file-picker.tsx`

**Step 1: Replace the raw file-pattern section**

Build a scope picker with these options:

- Common documentation
- README and docs
- All Markdown
- Manually choose files

Keep raw rule editing out of the default path.

**Step 2: Add the manual file picker**

When `scopeMode === 'manual_selection'`:

- fetch `GET /api/repositories/[id]/files`
- render a searchable grouped list
- support select all visible results
- support clear all
- show selected count

**Step 3: Move raw rules into advanced settings**

Keep legacy `filePatterns` and `excludePatterns` editable only inside a collapsed advanced area.

**Step 4: Verify the new scope flow**

Run: `npm.cmd run lint`

Expected: PASS with no broken state or fetch wiring.

**Step 5: Commit**

If the user explicitly requests git operations:

```bash
git add app/repositories/[id]/config/config-client-page.tsx components/repository/content-scope-picker.tsx components/repository/repository-file-picker.tsx
git commit -m "feat: simplify repository content scope configuration"
```

### Task 6: Remove misleading default-surface settings and simplify the page flow

**Files:**
- Modify: `app/repositories/[id]/config/config-client-page.tsx`
- Modify: `PROJECT_STATUS.md`
- Modify: `CLAUDE.md`
- Modify: `README.md`

**Step 1: Remove settings that do not match runtime behavior**

Remove from the default page surface:

- sync strategy
- branch template
- commit message template

If any are still stored, treat them as hidden legacy fields until runtime support exists.

**Step 2: Simplify the page layout**

Restructure the page into:

- languages
- content scope
- run mode
- translation engine

Keep save, enable/disable, and translate-now actions visually distinct.

**Step 3: Update docs**

Document:

- source language defaults to auto-detect
- target languages support global selection
- content scope now uses presets and manual file selection
- old advanced fields are no longer part of the primary workflow

**Step 4: Verify docs and UI together**

Run: `npm.cmd run lint`

Expected: PASS with docs updated to reflect the new product model.

**Step 5: Commit**

If the user explicitly requests git operations:

```bash
git add app/repositories/[id]/config/config-client-page.tsx PROJECT_STATUS.md CLAUDE.md README.md
git commit -m "refactor: simplify repository config experience"
```

### Task 7: Add regression verification for the redesigned config flow

**Files:**
- Modify: `scripts/check-frontend-ui-stability.js`
- Create: `scripts/check-repository-config-flow.js`

**Step 1: Add repository-config regression assertions**

Create a script that checks for:

- `auto` source-language default
- absence of sync-strategy UI in the default page surface
- presence of scope-mode UI
- presence of manual file-selection UI wiring
- absence of branch-template and commit-template controls in the default surface

**Step 2: Extend stability checks only where appropriate**

Keep the existing UI stability script focused on shell behavior. Put config-specific assertions into a separate script.

**Step 3: Run verification**

Run: `node scripts/check-repository-config-flow.js`

Expected: PASS with all repository-config assertions satisfied.

Run: `npm.cmd run lint`

Expected: PASS

**Step 4: Commit**

If the user explicitly requests git operations:

```bash
git add scripts/check-frontend-ui-stability.js scripts/check-repository-config-flow.js
git commit -m "test: add repository config regression checks"
```

### Task 8: Final verification

**Files:**
- Test: `node scripts/check-repository-config-flow.js`
- Test: `node scripts/check-frontend-ui-stability.js`
- Test: `npm.cmd run lint`

**Step 1: Run config regression checks**

Run: `node scripts/check-repository-config-flow.js`

Expected: PASS

**Step 2: Run existing UI stability checks**

Run: `node scripts/check-frontend-ui-stability.js`

Expected: PASS

**Step 3: Run lint**

Run: `npm.cmd run lint`

Expected: PASS

**Step 4: Optional build verification**

Run: `npm.cmd run build`

Expected: PASS if the local environment allows production build execution. If it still fails due to local environment permissions, record that limitation explicitly.

**Step 5: Commit**

If the user explicitly requests git operations:

```bash
git add .
git commit -m "feat: redesign repository configuration flow"
```
