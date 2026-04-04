# Structure Review And Lint Fix Implementation Plan

> Archived note: this is a historical implementation plan kept for background and traceability. It does not define the current implementation on its own.

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Review the current project structure, make minimal low-risk structural cleanups, fix the current lint failures, and produce a review-oriented technical change record.

**Architecture:** Keep the existing Next.js App Router and domain split intact. Only touch clear maintenance issues that are already visible from the codebase, especially duplicated component entry points and local lint problems, while avoiding broad refactors that would increase regression risk.

**Tech Stack:** Next.js 15, React 19, TypeScript, Prisma, ESLint

---

### Task 1: Review structure and identify low-risk cleanup targets

**Files:**
- Review: `app/**`
- Review: `components/**`
- Review: `lib/**`
- Review: `prisma/**`

**Step 1: Inspect duplicated and inconsistent component placement**

Run targeted reads for layout, header, and user menu components.

**Step 2: Record only low-risk cleanup candidates**

Focus on duplicate components, mismatched route references, and local helper duplication.

### Task 2: Fix lint failures in repository and task pages

**Files:**
- Modify: `app/repositories/page.tsx`
- Modify: `app/repositories/[id]/config/page.tsx`
- Modify: `app/tasks/page.tsx`

**Step 1: Reproduce lint failures**

Run: `npm.cmd run lint`

**Step 2: Apply minimal code changes**

Fix unescaped quotes, remove or stabilize local function dependency warnings, and avoid unnecessary structural change.

**Step 3: Re-run lint**

Run: `npm.cmd run lint`

### Task 3: Apply minimal structural cleanup

**Files:**
- Modify or remove: `components/user-menu.tsx`
- Modify if needed: `components/header/user-menu.tsx`
- Modify references if needed: project files importing either component

**Step 1: Confirm actual usage**

Search imports and determine which implementation is canonical.

**Step 2: Consolidate duplicate component**

Keep one implementation path and remove unused duplicate code if it is not referenced.

**Step 3: Re-run lint**

Run: `npm.cmd run lint`

### Task 4: Write review-oriented technical change record

**Files:**
- Create: `docs/2026-03-08-structure-review-and-lint-fix-change-log.md`

**Step 1: Document review findings**

Explain which parts of the structure are reasonable, which issues were found, and why only some were changed.

**Step 2: Document concrete code changes**

List changed files, rationale, expected impact, and residual risks.

**Step 3: Document verification evidence**

Include exact commands run and observed result summary.
