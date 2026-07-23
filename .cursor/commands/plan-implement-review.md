---
name: 'plan-implement-review'
description: 'Full feature workflow from user instructions: Opus plans (Plan mode); user approves only if the plan has open questions; otherwise proceed immediately to implement → review → fix → summarize via implement-review.'
---

Read and follow the skill at `.cursor/skills/plan-implement-review/SKILL.md`, then execute its workflow on the user's instructions.

Before doing anything else, verify the skill's preconditions:
1. The user has stated what they want built or changed. If not, stop and ask.
2. You (the orchestrator) are running the `auto` model in Agent mode. State your current model and mode; if not `auto` in Agent mode, stop and ask the user to switch before continuing.

Then proceed: Opus planning subagent (read-only Plan mode) → present the plan → **if the plan has open questions for the user, resolve them and get approval; if not, skip validation and proceed** → follow `.cursor/skills/implement-review/SKILL.md` for implement (auto dev subagent) → Opus review → dev fixes → final summary.
