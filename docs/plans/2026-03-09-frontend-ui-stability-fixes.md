# Frontend UI Stability Fixes Implementation Plan

> Archived note: this is a historical implementation plan kept for background and traceability. It does not define the current implementation on its own.

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix the current post-redesign UI regressions around sidebar positioning, repeated user loading states, search interactions, and task auto-refresh jitter.

**Architecture:** Keep the existing page routes and API contracts, but separate initial page bootstrap from subsequent refresh states. The main fixes live in the app shell and the repositories/tasks client pages so the authenticated layout remains stable while data updates in place.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Tailwind CSS, existing client-side fetch flows

---

### Task 1: Add a regression check script

**Files:**
- Create: `scripts/check-frontend-ui-stability.js`

### Task 2: Keep the desktop sidebar fixed

**Files:**
- Modify: `components/client-app-layout.tsx`
- Modify: `components/sidebar/sidebar.tsx`

### Task 3: Decouple repositories auth bootstrap from list refreshes

**Files:**
- Modify: `app/repositories/page.tsx`
- Modify: `components/repository/repository-toolbar.tsx`

### Task 4: Decouple tasks auth bootstrap from list refreshes and debounce search

**Files:**
- Modify: `app/tasks/page.tsx`
- Modify: `components/tasks/task-toolbar.tsx`

### Task 5: Verify

**Files:**
- Test: `node scripts/check-frontend-ui-stability.js`
- Test: `npm.cmd run lint`
