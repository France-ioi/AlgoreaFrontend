---
name: plan-implement-review
description: End-to-end feature workflow from user instructions to shipped code. Plans with an Opus subagent in Plan mode (read-only exploration, no implementation), obtains plan approval, then runs the implement-review skill (dev subagent implements, Opus reviews, dev fixes, orchestrator summarizes). Use when the user gives a feature request or task and wants planning plus implementation with review. Trigger on "plan, implement and review", full feature delivery from instructions, or when no approved plan exists yet.
---

# Plan, Implement, Review

## Overview

This skill extends [implement-review](implement-review/SKILL.md) with an upfront planning phase:

1. **Plan** — Opus subagent explores the codebase in Plan mode and produces a structured plan.
2. **Approve** — User confirms the plan (or requests revisions).
3. **Implement → Review → Fix → Summarize** — Follow the [implement-review](implement-review/SKILL.md) skill with the approved plan.

The orchestrator coordinates subagents and writes the final summary. It does NOT plan, implement, or review code itself.

## Preconditions (verify before any work)

Stop and ask the user if either is missing — do not start.

1. **User instructions exist.** The user has stated what they want built or changed. If vague, ask clarifying questions before launching the planning subagent.
2. **The orchestrator is running the `auto` model in Agent mode.** State which model and mode you are on. If not `auto` in Agent mode, stop and ask the user to switch before continuing.

## Workflow checklist

```
- [ ] Step 0: Preconditions verified (user instructions + orchestrator on `auto` in Agent mode)
- [ ] Step 1: Plan in an Opus subagent (Plan mode — read-only)
- [ ] Step 2: Present plan and get user approval
- [ ] Step 3–6: Follow implement-review skill (implement → review → fix → summarize)
```

## Step 1: Plan in an Opus subagent (Plan mode)

Launch a planning subagent that behaves like Cursor Plan mode: explore and design only, **no code changes**.

- Tool: `Task` with `subagent_type: "explore"` (preferred for codebase exploration) or `subagent_type: "generalPurpose"`, **`readonly: true`**.
- Model: **`claude-opus-4-8-thinking-high`** (Opus). If that slug is unavailable, tell the user Opus is unavailable rather than silently substituting another model.
- Prompt must include:
  - The **full user instructions** (verbatim or faithfully summarized).
  - Instruction to act in **Plan mode**: read files, search the codebase, understand architecture (`AGENTS.md`, `.cursor/ARCHITECTURE.md`), and produce a plan — **do not write or modify any files**.
  - Required plan output format:

```markdown
# Plan: [short title]

## Goal
[One paragraph]

## Deliverables
1. [Concrete, checkable deliverable]
2. ...

## Approach
[Key technical decisions, files to touch, patterns to follow]

## Risks / open questions
- [Anything needing user input, or "None"]
```

- Ask the subagent to return the complete plan and any open questions.

Record the planning subagent's **agent ID** if the user requests plan revisions — `resume` it with feedback instead of starting over.

## Step 2: Present plan and get approval

1. Present the plan to the user clearly (the numbered **Deliverables** list is what implement-review will track).
2. If there are open questions, resolve them with the user before proceeding.
3. **Do not start implementation until the user approves the plan** (explicit "go ahead", "approved", or equivalent). If they want changes, `resume` the planning subagent with their feedback and repeat this step.

Once approved, restate the deliverables as the approved plan for the next phase.

## Steps 3–6: Implement, review, fix, summarize

Read and follow [implement-review/SKILL.md](implement-review/SKILL.md) using the approved plan from Step 2.

- The implement-review preconditions are satisfied once the plan is approved and you remain on `auto` in Agent mode.
- Start at implement-review **Step 1** (dev subagent implementation). Do not re-run planning.
- The **final summary** (implement-review Step 4) is the deliverable of this skill.

## Notes

- Planning subagent: read-only, Opus, no implementation.
- Implementation and fix subagent: auto model (inherit from orchestrator), same subagent reused for fixes.
- Review subagent: read-only, Opus, angular-code-review skill.
- If the user already has an approved plan and only wants implementation, use [implement-review](implement-review/SKILL.md) directly instead of this skill.
