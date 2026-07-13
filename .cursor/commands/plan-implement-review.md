---
name: 'plan-implement-review'
description: 'Full feature workflow from user instructions: Opus plans (Plan mode), user approves, then implement → review → fix → summarize via implement-review.'
---

Read and follow the skill at `.cursor/skills/plan-implement-review/SKILL.md`, then execute its workflow on the user's instructions.

Before doing anything else, verify the skill's preconditions:
1. The user has stated what they want built or changed. If not, stop and ask.
2. You (the orchestrator) are running the `auto` model in Agent mode. State your current model and mode; if not `auto` in Agent mode, stop and ask the user to switch before continuing.

Then proceed: Opus planning subagent (read-only Plan mode) → present plan and get approval → follow `.cursor/skills/implement-review/SKILL.md` for implement (auto dev subagent) → Opus review → dev fixes → final summary.
