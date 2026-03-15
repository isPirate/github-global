# Repository Config Redesign Design

**Date:** 2026-03-15

**Scope:** Rework the repository translation configuration page into a default-simple, globally scalable setup flow that matches the real execution behavior and adds optional manual file selection.

## Goals

- Make the repository config page usable for non-technical users out of the box.
- Default the source language to automatic detection instead of forcing English.
- Expand target language selection from a short hard-coded list to a globally scalable language picker.
- Replace raw glob-first file filtering with simple presets and an optional manual file picker.
- Remove or hide settings that are not actually respected by the current translation pipeline.
- Keep enough extensibility for future advanced controls without exposing them as the default product surface.

## Non-Goals

- Rebuild the full translation engine or queue architecture.
- Add scheduling, cron execution, or real-time push updates as part of this redesign.
- Expose every internal translation parameter in the default UI.
- Fully redesign repository translation execution beyond what is necessary to match the new config model.

## Current-State Summary

The current repository config page combines several different concerns into one long engineer-facing form:

- source and target languages
- file matching rules
- sync strategy
- trigger mode
- branch and commit templates
- engine selection and tuning
- activation and manual translation controls

The biggest issue is not visual styling but product-model drift:

- The UI defaults `baseLanguage` to `en`, while the API and database both support `auto`.
- `syncStrategy` and `triggerMode` are stored but not meaningfully consumed by the execution flow.
- `targetBranchTemplate` and `commitMessageTemplate` are editable in the UI but ignored by the current task processor.
- `excludePatterns` is stored but not used in file filtering.
- `filePatterns` is the primary content-scope mechanism, which forces users to understand glob syntax.

This makes the page feel powerful, but unreliable. Users are asked to configure low-level settings without knowing which ones actually matter.

## Product Direction

The page should follow a default-simple model:

- show only the settings a normal user can confidently understand
- make the common path fast and safe
- offer precise control only when it has clear product value
- avoid exposing implementation details as the first interaction

The page should feel like a setup wizard embedded in the app shell, not an internal admin panel.

## Recommended Information Architecture

The page should be reorganized into four primary sections.

### 1. Languages

This section controls source and target languages only.

- Source language defaults to `auto` and is labeled "Auto-detect (Recommended)".
- Users may still manually set a source language if they know their repository language.
- Target languages use a searchable multi-select instead of a fixed button grid.
- The top of the picker can show a small curated set of common languages.
- Full language coverage should come from a complete dataset, not a short hard-coded list.

This keeps the common path fast while allowing true global-language support.

### 2. Content Scope

This section answers one user question: "What should be translated?"

The default UI should provide preset choices:

- Common documentation (recommended)
- README and `docs/`
- All Markdown files
- Manually choose files

Only when the user selects "Manually choose files" should the page reveal a file picker.

Raw glob rules should move into a collapsed advanced area and stop being the primary interaction model.

### 3. Run Mode

This section should replace the current overlapping "sync strategy" and "trigger mode" concepts.

The user-facing control should be simplified to:

- Run automatically when supported
- Run only when I start it manually

This is understandable to users and maps more cleanly onto future system behavior.

If automatic execution is not fully implemented for all paths yet, the UI should reflect actual support rather than presenting speculative choices.

### 4. Translation Engine

The default UI should keep this section minimal:

- selected provider
- selected model
- whether an API key is already configured

Advanced options such as custom model IDs and temperature should move into a collapsed advanced area.

## Manual File Selection Design

Manual file selection should be supported as an optional precision mode, not the default workflow.

### Interaction Model

When the user chooses "Manually choose files":

- fetch the repository's candidate translatable files
- show a searchable file list
- group files by directory where possible
- support select all / clear all for current results
- show the number of selected files
- allow quick filtering by file extension or path text

The file list should only include likely translatable text documents by default. It should not dump the entire repository tree onto the page without filtering.

### Candidate File Rules

The candidate list should initially prefer documentation-like files such as:

- `README*`
- files under `docs/`
- `*.md`
- `*.mdx`
- optionally `*.txt`

This gives the user an understandable and manageable list while keeping the UI fast on larger repositories.

### Saved Data

Manual mode should persist exact repository-relative paths for the selected files.

That makes the user intent explicit and avoids forcing manual selections back through a glob abstraction.

## Data Model Direction

The current `TranslationConfig` shape should be extended so the page can express intent directly instead of overloading `filePatterns`.

Recommended additions:

- `scopeMode`
  - `preset_common_docs`
  - `preset_readme_docs`
  - `preset_all_markdown`
  - `manual_selection`
  - `advanced_rules`
- `selectedFiles`
  - JSON array of repository-relative file paths

Recommended reuse:

- keep `baseLanguage`
- keep `targetLanguages`
- keep `triggerMode`, but narrow the UI wording to run mode

Recommended deprecation from the default UI:

- `syncStrategy`
- `targetBranchTemplate`
- `commitMessageTemplate`
- `excludePatterns`

These fields may remain in storage for backward compatibility, but they should not remain first-class product controls unless the execution pipeline truly honors them.

## Execution Behavior

The translation task processor should derive the actual file list from the chosen scope mode.

### Preset Scope Modes

The backend should translate presets into concrete filtering logic:

- `preset_common_docs`: `README*`, `docs/**`, `*.md`, `*.mdx`
- `preset_readme_docs`: `README*`, `docs/**`
- `preset_all_markdown`: all `*.md` and `*.mdx`

### Manual Selection Mode

Only the saved `selectedFiles` list should be translated.

### Advanced Rules Mode

Existing `filePatterns` and `excludePatterns` can still be respected here for power users, but this should remain out of the default path.

## UI Lifecycle Changes

Several current controls should change lifecycle status.

### Keep in Main UI

- source language
- target languages
- content scope
- manual file picker
- run mode
- provider and model selection
- save
- enable / disable
- translate now

### Move to Advanced Settings

- custom model input
- temperature
- raw file rule editing

### Remove from Main UI

- sync strategy
- branch template
- commit message template

These can return later if the backend genuinely supports them as user-configurable behavior.

## API and Backend Changes

The redesign requires one new capability and one cleanup pass.

### New Capability

Add an API endpoint that returns candidate translatable files for a repository configuration session.

Recommended route:

- `GET /api/repositories/[id]/files`

The endpoint should:

- validate repository ownership
- authenticate with the GitHub App installation
- read the repository tree from the default branch
- return candidate file metadata suitable for a picker

### Cleanup

Update config persistence and task processing so the saved configuration reflects real runtime behavior.

This means the backend must stop treating UI-only fields as if they are meaningful configuration unless they are actually used.

## Compatibility Strategy

The redesign should not break existing repositories that already have saved config rows.

Recommended compatibility rules:

- existing repositories without `scopeMode` default to `preset_all_markdown` or a compatible migration value
- existing `filePatterns` remain readable
- advanced mode can still surface legacy rule-based setups if needed
- hidden deprecated fields remain stored until a future cleanup migration

This lets the product evolve without forcing every existing repository through a breaking reset.

## Validation Criteria

The redesign is successful when:

- a first-time user can configure a repository without understanding glob syntax
- the default source language is automatic detection
- the language picker scales to global coverage without becoming visually unusable
- manual file selection works for repositories that need precise control
- the UI only presents settings that are either implemented now or clearly marked as advanced or deferred
- saved configuration and runtime behavior stay aligned

## Final Decision

Proceed with a simplified repository config redesign centered on four main sections: languages, content scope, run mode, and translation engine. Add manual file selection as an optional precision mode, promote automatic source-language detection, expand to global target-language coverage through searchable selection, and remove or hide settings that the current execution pipeline does not actually honor.
