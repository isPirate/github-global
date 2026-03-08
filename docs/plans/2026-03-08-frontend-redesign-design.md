# Frontend Redesign Design

**Date:** 2026-03-08

**Scope:** Replan the full frontend, including the marketing site and the authenticated application, using the `.ui` reference as the primary visual and structural direction while preserving the current Next.js app architecture and backend integrations.

## Goals

- Align the current product UI with the `.ui` reference at the level of visual language, page structure, and information hierarchy.
- Keep existing backend APIs, routing model, and business workflows intact wherever possible.
- Unify the marketing experience and the authenticated product experience into one coherent product identity.
- Improve clarity, consistency, and action hierarchy across dashboard, repositories, tasks, and settings.

## Non-Goals

- Rebuild the frontend using the Vite code inside `.ui`.
- Replace the current Next.js App Router architecture.
- Introduce major backend or data model changes as part of the redesign.
- Expand product promises beyond the capabilities already supported by the current system.

## Current-State Summary

The current project already has the correct product surfaces:

- A public entry page
- Authenticated application layout
- Core product pages for dashboard, repositories, tasks, and settings

The main problems are not missing routes, but weak UI cohesion:

- The public page is too minimal compared with the rest of the product.
- The authenticated pages do not share a strong, consistent visual system.
- Layout structure and visual hierarchy vary page to page.
- Key workflows are present, but the UI does not present them with enough clarity or confidence.

The `.ui` reference provides a stronger direction:

- A complete marketing landing page
- A clearer dashboard structure
- Better information density and card hierarchy
- More intentional navigation, status display, and page scaffolding

## Recommended Approach

Use a visual-alignment redesign with selective page mapping:

- Preserve the current Next.js routes, data flow, and API usage.
- Extract the useful visual language and page structure from `.ui`.
- Rebuild shared layout and design tokens inside the current codebase.
- Recompose the existing pages to follow the reference hierarchy where it improves the product.

This is the preferred path because it gives the product a full redesign without creating a second frontend architecture or destabilizing working business logic.

## Information Architecture

The frontend should be organized into two shells.

### Marketing Shell

Used for the public-facing experience:

- Landing page
- Login entry and product onboarding touchpoints
- Product messaging, feature explanation, and conversion CTA

### App Shell

Used for all authenticated product pages:

- Dashboard
- Repositories
- Tasks
- Settings

This separation allows the public site and the product console to feel related, while still using layouts appropriate to their different jobs.

## Page Design

### Landing Page

The current homepage should be replaced with a full marketing landing page. The structure should follow the reference pattern, adapted to the real product:

- Hero section with product value proposition and primary GitHub login CTA
- Feature section focused on real platform capabilities
- How-it-works section showing the core flow: connect repository, configure rules, run translation
- Supporting CTA section
- Footer with product and documentation links

The landing page should establish the product brand and remove the current mismatch between a minimal public page and a fuller internal console.

### Dashboard

Dashboard should become a true overview page instead of a navigation placeholder. It should surface:

- Top-level product stats
- Recent translation activity
- Repository health or readiness summary
- Direct next actions for the user

The dashboard should act as the decision surface for returning users.

### Repositories

Repositories should remain the operational center for repo management, but the UI should be reorganized around action clarity:

- Summary stats at the top
- Page header with clear primary and secondary actions
- Better empty state for GitHub App installation and sync
- Repository cards with stronger status visibility
- Clear action hierarchy for configure, translate, and manage permissions

This page should feel operational and actionable rather than purely list-based.

### Tasks

Tasks should focus on monitoring and triage:

- High-visibility task status summary
- Strong filter and search controls
- Task rows or cards with clear progress, status, and timestamps
- Better surfaced failure details
- Clear path to PR and GitHub repository context

Processing tasks should be visually prioritized over completed history.

### Settings

Settings should be reorganized by user intent instead of appearing as one long configuration surface. Recommended grouping:

- Account
- GitHub App
- OpenRouter or model configuration
- Preferences
- Danger zone

This matches both the current product needs and the stronger grouping style shown in the reference design.

## Visual System

The product should use one design system across marketing and app surfaces, with controlled variation by context.

### Core Rules

- Keep a unified token system for color, spacing, radius, border, and shadow.
- Preserve a GitHub-adjacent green as a product cue, but support it with a tighter neutral palette.
- Allow richer brand presentation on the landing page.
- Keep authenticated pages more restrained and operational.

### Component Consistency

The redesign should standardize:

- Page containers
- Section spacing
- Typography hierarchy
- Card structure
- Status badges
- Buttons and action hierarchy
- Inputs and filter bars
- Empty states
- Loading states
- Error states

The current mix of styles should be replaced by a single consistent component language.

## Interaction Rules

The redesign should improve flow clarity, not only appearance.

### Navigation

- Keep desktop sidebar plus top header
- Keep mobile bottom navigation
- Make navigation visually consistent across breakpoints
- Align the product brand in marketing and app surfaces

### Action Hierarchy

- Each page should have one obvious primary action
- Secondary actions should remain available but visually subordinate
- Empty states should always suggest the next action
- Ongoing tasks should have stronger emphasis than historical tasks

### Feedback States

- Prefer skeletons over full-page spinners where practical
- Use consistent color and copy for success, warning, failure, and processing states
- Ensure progress indicators are prominent on long-running translation work

## Technical Direction

The implementation should stay inside the current Next.js project.

### Keep

- Next.js App Router
- Existing route structure
- Existing backend APIs
- Existing authenticated data flow

### Rebuild or Refactor

- Global design tokens and shared styling foundation
- Marketing layout
- Authenticated app shell
- Shared page header patterns
- Shared cards, stats, status, empty-state, and loading-state components
- Page composition for dashboard, repositories, tasks, and settings

### Avoid

- Copying the `.ui` Vite project directly into production code
- Running two parallel component systems long term
- Mixing redesign work with unnecessary business logic rewrites

## Delivery Strategy

Implement the redesign in four stages:

1. Build the shared visual foundation and layout primitives.
2. Rebuild the marketing and login-entry experience.
3. Rework the authenticated pages in this order: dashboard, repositories, tasks, settings.
4. Polish edge states, responsiveness, and motion.

This order keeps the app usable throughout the redesign and limits regression risk.

## Validation Criteria

The redesign is successful when:

- The public site and authenticated app feel like one product.
- The page structure and visual hierarchy clearly align with the `.ui` reference direction.
- Existing backend-powered workflows still function.
- Desktop and mobile navigation remain complete and usable.
- Empty, loading, processing, and error states are all represented consistently.

## Final Decision

Proceed with a full frontend redesign covering both public and authenticated surfaces, using the `.ui` reference as the visual and structural source of truth, while preserving the current Next.js architecture and business integrations.
