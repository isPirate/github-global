# Frontend Redesign Implementation Plan

> Archived note: this is a historical implementation plan kept for background and traceability. It does not define the current documentation or product boundary on its own.

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rebuild the public site and authenticated app UI to match the `.ui` reference direction while keeping the current Next.js architecture and backend integrations intact.

**Architecture:** Keep the existing Next.js App Router and API routes, but introduce a consistent design foundation, split shell layouts for marketing and app surfaces, and page-level composition modules that map the `.ui` information hierarchy onto real product data. The work should proceed from shared primitives to public pages to authenticated pages so each stage remains shippable.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Tailwind CSS, existing `components/ui` primitives, Lucide React

---

### Task 1: Establish the redesign foundation

**Files:**
- Modify: `app/globals.css`
- Modify: `app/layout.tsx`
- Modify: `lib/design-system/tokens.ts`
- Create: `components/layout/page-shell.tsx`
- Create: `components/layout/page-header.tsx`
- Create: `components/feedback/empty-state.tsx`
- Create: `components/feedback/status-badge.tsx`
- Create: `components/metrics/stat-card.tsx`
- Test: `npm run lint`

**Step 1: Define the design token contract**

Update `app/globals.css` and `lib/design-system/tokens.ts` so the application has one source of truth for:

- brand colors
- neutral colors
- status colors
- radius
- shadows
- spacing rhythm
- container widths

Document tokens in code with short comments only where the usage would otherwise be ambiguous.

**Step 2: Replace ad hoc page scaffolding with shared shell primitives**

Create:

- `components/layout/page-shell.tsx` for reusable page spacing and section grouping
- `components/layout/page-header.tsx` for `title + description + actions`
- `components/feedback/empty-state.tsx` for reusable empty states
- `components/feedback/status-badge.tsx` for all task and repository statuses
- `components/metrics/stat-card.tsx` for top-level stats

Keep props narrow and composable.

**Step 3: Update the root layout for global brand consistency**

Modify `app/layout.tsx` to:

- keep UTF-8-safe metadata strings
- ensure background, text, and font choices align with the new visual foundation
- keep the toast provider intact

**Step 4: Run verification**

Run: `npm run lint`
Expected: PASS with no new lint issues from the new shared components or token changes.

**Step 5: Commit**

```bash
git add app/globals.css app/layout.tsx lib/design-system/tokens.ts components/layout/page-shell.tsx components/layout/page-header.tsx components/feedback/empty-state.tsx components/feedback/status-badge.tsx components/metrics/stat-card.tsx
git commit -m "feat: add frontend redesign foundation"
```

### Task 2: Rebuild the marketing shell and landing page

**Files:**
- Modify: `app/page.tsx`
- Create: `components/marketing/marketing-header.tsx`
- Create: `components/marketing/hero-section.tsx`
- Create: `components/marketing/features-section.tsx`
- Create: `components/marketing/how-it-works-section.tsx`
- Create: `components/marketing/cta-section.tsx`
- Create: `components/marketing/marketing-footer.tsx`
- Test: `npm run lint`

**Step 1: Replace the placeholder homepage**

Refactor `app/page.tsx` into a composed landing page built from section components instead of inline markup.

The page should include:

- hero
- feature highlights
- how-it-works
- CTA
- footer

**Step 2: Build the public marketing modules**

Create section components under `components/marketing/` and map the `.ui` hierarchy to real product content:

- GitHub login CTA
- real feature claims only
- GitHub App workflow explanation
- product trust cues without inventing pricing or unsupported billing behavior

**Step 3: Make the visual style distinct but consistent**

Use stronger gradients, hero framing, and richer section backgrounds on the landing page, but keep the underlying tokens aligned with the app shell so the two surfaces still feel like one product.

**Step 4: Run verification**

Run: `npm run lint`
Expected: PASS with the new marketing components and no broken imports.

**Step 5: Commit**

```bash
git add app/page.tsx components/marketing/marketing-header.tsx components/marketing/hero-section.tsx components/marketing/features-section.tsx components/marketing/how-it-works-section.tsx components/marketing/cta-section.tsx components/marketing/marketing-footer.tsx
git commit -m "feat: redesign marketing landing page"
```

### Task 3: Refactor the authenticated app shell

**Files:**
- Modify: `components/app-layout.tsx`
- Modify: `components/client-app-layout.tsx`
- Modify: `components/sidebar/sidebar.tsx`
- Modify: `components/sidebar/nav-item.tsx`
- Modify: `components/sidebar/user-profile.tsx`
- Modify: `components/header/top-header.tsx`
- Modify: `components/header/user-menu.tsx`
- Modify: `components/mobile-nav/bottom-nav.tsx`
- Test: `npm run lint`

**Step 1: Normalize authenticated layout behavior**

Refactor `components/client-app-layout.tsx` to:

- use the new shared shell primitives
- unify page gutters and vertical rhythm
- keep desktop sidebar and mobile navigation behavior
- avoid hydration-only placeholder patterns unless strictly necessary

**Step 2: Redesign navigation surfaces**

Update sidebar, top header, and bottom navigation so they share:

- brand treatment
- active state rules
- spacing
- icon sizing
- badge styling

Keep current route destinations unchanged.

**Step 3: Improve the top header utility model**

Keep search and notifications, but give the top bar a clearer visual role and stronger alignment with the redesigned pages.

**Step 4: Run verification**

Run: `npm run lint`
Expected: PASS with no prop or import regressions across layout components.

**Step 5: Commit**

```bash
git add components/app-layout.tsx components/client-app-layout.tsx components/sidebar/sidebar.tsx components/sidebar/nav-item.tsx components/sidebar/user-profile.tsx components/header/top-header.tsx components/header/user-menu.tsx components/mobile-nav/bottom-nav.tsx
git commit -m "feat: redesign authenticated app shell"
```

### Task 4: Rebuild the dashboard into a real overview page

**Files:**
- Modify: `app/dashboard/page.tsx`
- Create: `components/dashboard/dashboard-overview.tsx`
- Create: `components/dashboard/recent-activity-list.tsx`
- Create: `components/dashboard/repository-summary-panel.tsx`
- Create: `components/dashboard/quick-actions-panel.tsx`
- Test: `npm run lint`

**Step 1: Replace the current placeholder layout**

Refactor `app/dashboard/page.tsx` to use:

- `PageHeader`
- stat cards
- recent activity
- repository summary
- quick actions

Keep the existing session gate and user data source.

**Step 2: Move dashboard sections into dedicated components**

Create the new dashboard modules so the page is a composition layer, not a single large template.

**Step 3: Align the dashboard to real data**

If current server data is insufficient for full fidelity, keep the layout ready and use the best currently available data without inventing backend features. Prefer truthful summaries over decorative placeholders.

**Step 4: Run verification**

Run: `npm run lint`
Expected: PASS with dashboard components typed and imported correctly.

**Step 5: Commit**

```bash
git add app/dashboard/page.tsx components/dashboard/dashboard-overview.tsx components/dashboard/recent-activity-list.tsx components/dashboard/repository-summary-panel.tsx components/dashboard/quick-actions-panel.tsx
git commit -m "feat: redesign dashboard overview"
```

### Task 5: Recompose the repositories page around action clarity

**Files:**
- Modify: `app/repositories/page.tsx`
- Modify: `components/repository/stat-card.tsx`
- Modify: `components/repository/quick-translate-button.tsx`
- Create: `components/repository/repository-grid.tsx`
- Create: `components/repository/repository-card.tsx`
- Create: `components/repository/repository-empty-state.tsx`
- Create: `components/repository/repository-toolbar.tsx`
- Test: `npm run lint`

**Step 1: Split the page into reusable view modules**

Refactor `app/repositories/page.tsx` so it becomes a page orchestration layer that delegates rendering to:

- toolbar
- stat summary
- grid
- empty state

Keep the existing fetching, auth check, sync, and installation logic.

**Step 2: Rebuild repository cards**

Use a dedicated `repository-card.tsx` to standardize:

- repository title and owner
- private and language indicators
- config state
- translate action
- configure action
- GitHub permission management path

**Step 3: Improve empty and installation states**

Use `repository-empty-state.tsx` to clearly separate:

- no GitHub App installed
- app installed but no repos available
- repos available but not configured

**Step 4: Run verification**

Run: `npm run lint`
Expected: PASS with client-side hooks preserved and no broken repository actions.

**Step 5: Commit**

```bash
git add app/repositories/page.tsx components/repository/stat-card.tsx components/repository/quick-translate-button.tsx components/repository/repository-grid.tsx components/repository/repository-card.tsx components/repository/repository-empty-state.tsx components/repository/repository-toolbar.tsx
git commit -m "feat: redesign repositories page"
```

### Task 6: Rework the tasks page for monitoring and triage

**Files:**
- Modify: `app/tasks/page.tsx`
- Create: `components/tasks/task-summary-cards.tsx`
- Create: `components/tasks/task-toolbar.tsx`
- Create: `components/tasks/task-list.tsx`
- Create: `components/tasks/task-item.tsx`
- Create: `components/tasks/task-file-list.tsx`
- Test: `npm run lint`

**Step 1: Break the task page into focused components**

Refactor `app/tasks/page.tsx` into a composition layer that renders:

- summary cards
- filters and search toolbar
- task list
- expanded file detail list

Keep current paging, filtering, polling, retry, and auth behavior.

**Step 2: Standardize status rendering**

Move status rendering onto shared `StatusBadge` rules and ensure task visuals clearly distinguish:

- pending
- processing
- completed
- failed

**Step 3: Prioritize active work visually**

Make processing tasks and task progress the strongest visual signal. Completed tasks should remain readable but less visually dominant than active and failed work.

**Step 4: Run verification**

Run: `npm run lint`
Expected: PASS with no state-management or JSX structure regressions.

**Step 5: Commit**

```bash
git add app/tasks/page.tsx components/tasks/task-summary-cards.tsx components/tasks/task-toolbar.tsx components/tasks/task-list.tsx components/tasks/task-item.tsx components/tasks/task-file-list.tsx
git commit -m "feat: redesign tasks page"
```

### Task 7: Reorganize settings by user intent

**Files:**
- Modify: `app/settings/page.tsx`
- Modify: `app/settings/_components/settings-form.tsx`
- Modify: `app/settings/_components/account-section.tsx`
- Modify: `app/settings/_components/api-key-section.tsx`
- Modify: `app/settings/_components/github-app-section.tsx`
- Modify: `app/settings/_components/preferences-section.tsx`
- Modify: `app/settings/_components/danger-zone-section.tsx`
- Create: `app/settings/_components/settings-page-header.tsx`
- Test: `npm run lint`

**Step 1: Rebuild settings page composition**

Update `app/settings/page.tsx` so the page uses the new page shell and a clearer header structure.

**Step 2: Reorganize settings sections**

Ensure the form is visually grouped by intent:

- account
- GitHub App
- OpenRouter key and model-related controls
- preferences
- danger zone

Do not introduce billing or notification surfaces unless those behaviors already exist in the current app.

**Step 3: Normalize section visuals**

Make each settings section use consistent card spacing, labels, helper text, inline actions, and save affordances.

**Step 4: Run verification**

Run: `npm run lint`
Expected: PASS with server data wiring preserved and no broken form props.

**Step 5: Commit**

```bash
git add app/settings/page.tsx app/settings/_components/settings-form.tsx app/settings/_components/account-section.tsx app/settings/_components/api-key-section.tsx app/settings/_components/github-app-section.tsx app/settings/_components/preferences-section.tsx app/settings/_components/danger-zone-section.tsx app/settings/_components/settings-page-header.tsx
git commit -m "feat: redesign settings page"
```

### Task 8: Final polish, UTF-8 validation, and release checks

**Files:**
- Modify: `app/page.tsx`
- Modify: `app/dashboard/page.tsx`
- Modify: `app/repositories/page.tsx`
- Modify: `app/tasks/page.tsx`
- Modify: `app/settings/page.tsx`
- Modify: `components/**/*.tsx`
- Test: `npm run lint`
- Test: `npm run build`

**Step 1: Verify copy and encoding handling**

Review all user-facing strings touched by the redesign and make sure file reads, file saves, and editor handling remain UTF-8-safe. Do not treat terminal mojibake as source corruption.

**Step 2: Normalize edge states**

Ensure every redesigned page has:

- loading state
- empty state
- error state
- responsive behavior

**Step 3: Run final verification**

Run: `npm run lint`
Expected: PASS

Run: `npm run build`
Expected: PASS and all redesigned routes compile successfully.

**Step 4: Commit**

```bash
git add app/page.tsx app/dashboard/page.tsx app/repositories/page.tsx app/tasks/page.tsx app/settings/page.tsx components
git commit -m "feat: finalize frontend redesign polish"
```
