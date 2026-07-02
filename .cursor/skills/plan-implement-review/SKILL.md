---
name: plan-implement-review
description: Orchestrates a plan-driven implementation loop with a built-in Angular code review. Use after a plan has been approved (Plan mode) and the user wants the change implemented by a dev subagent, reviewed by an Opus subagent running the angular-code-review skill, fixed by the dev subagent, then summarized. Trigger when the user asks to "implement and review", "build then review", or run the implement → review → fix → summary workflow.
---

# Plan, Implement, Review

## Overview

This skill turns an approved plan into shipped code through a delegated loop: a dev subagent implements, an Opus review subagent runs `/angular-code-review`, the same dev subagent fixes the findings, and the orchestrator reports what was and wasn't done.

The orchestrator (the agent running this skill) stays lightweight: it coordinates subagents and writes the final summary. It does NOT implement or review the code itself.

## Preconditions (verify before any work)

Stop and ask the user if either is missing — do not start implementing.

1. **An approved plan exists.** The plan must come from Cursor Plan mode / an approved plan in the current conversation. If there is no clear, approved plan, ask the user to provide or approve one first. Restate the plan as a numbered list of concrete deliverables so completion can be checked later.
2. **The orchestrator is running the `auto` model.** State which model you are currently on. If it is not `auto`, stop and ask the user to switch to the `auto` model before continuing — this workflow is cost-optimized: cheap `auto` orchestration delegates expensive work to subagents. Do not proceed until on `auto`.

## Workflow checklist

Copy this and keep it updated as you go:

```
- [ ] Step 0: Preconditions verified (approved plan + orchestrator on `auto`)
- [ ] Step 1: Implement the plan in the dev subagent (auto model)
- [ ] Step 2: Review the changes in an Opus subagent (/angular-code-review)
- [ ] Step 3: Fix review findings in the SAME dev subagent
- [ ] Step 4: Write the final summary
```

## Step 1: Implement in the dev subagent

Launch ONE dev subagent to do the implementation. Reuse this same subagent later for fixes (keep its agent ID).

- Tool: `Task` with `subagent_type: "generalPurpose"`.
- Model: **do not pass a `model`** — omitting it makes the subagent inherit the orchestrator's `auto` model, satisfying the "both on auto" requirement.
- Prompt: subagents do not see the conversation, so include the **full plan** (all numbered deliverables), the relevant file paths, and the project conventions reminder ("follow `AGENTS.md`: standalone components, signals, `inject()`, native control flow, ngrx `FetchState`, i18n all user-facing strings, files < 300 lines"). Instruct it to run `npm run lint` and fix lint errors before returning.
- Ask the subagent to return: a list of changed files, which plan deliverables it completed, and anything it could not do (with the reason).

Record the dev subagent's **agent ID** — you will `resume` it in Step 3.

## Step 2: Review in an Opus subagent

Launch a separate review subagent over the code that was just written.

- Tool: `Task` with `subagent_type: "generalPurpose"`, `readonly: true`.
- Model: **`claude-opus-4-8-thinking-high`** (Opus). If that slug is unavailable, tell the user Opus is unavailable rather than silently substituting another model.
- Prompt the review subagent to:
  1. Read and follow the skill at `/home/dle/.claude/skills/angular-code-review/SKILL.md`.
  2. Scope the review to the just-written changes: run `git diff` (and `git status`) to find modified/untracked files, then read them.
  3. Produce its report using that skill's output template (Critical / Suggestions / Positive across the four roles).
  4. Save the report to `.cursor/reviews/` (e.g. `.cursor/reviews/<short-feature-name>-review.md`) and also return it.

## Step 3: Fix in the same dev subagent

`resume` the Step 1 dev subagent (pass its agent ID) with the review report. Instruct it to:

- **Fix every Critical issue.**
- **Address Suggestions that are relevant** — apply the ones that genuinely improve the code; for any suggestion it deliberately skips, record a one-line reason. Do not blindly apply suggestions that conflict with the plan or project conventions.
- Re-run `npm run lint` (and unit tests with `CHROME_BIN=/usr/bin/chromium ng test` when the change warrants it) and fix failures.
- Return: which Critical issues were fixed, which Suggestions were applied vs. skipped (with reasons).

## Step 4: Final summary (orchestrator writes this)

After fixes land, the orchestrator presents a concise summary to the user covering:

- **Fixed:** Critical issues resolved and Suggestions applied.
- **Not fixed / deferred:** review findings intentionally skipped, each with a reason.
- **Plan coverage:** which planned deliverables are done, and which were not done (with why).
- **Manual testing needed:** call out anything that should be verified by hand (e.g. visual/UX checks, accessibility/AXE, i18n rendering, flows not covered by automated tests, mock-server interactions). Be specific about what to click/check.

Keep it scannable. This summary is the deliverable of the skill.

## Notes

- Always reuse the single dev subagent across Steps 1 and 3 so it keeps the context of what it built.
- The review subagent is independent and read-only — it must not modify code.
- If the orchestrator drifts off `auto` or no plan is approved, return to Preconditions before continuing.
