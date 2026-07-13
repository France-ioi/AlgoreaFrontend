---
name: 'implement-review'
description: 'Run implement → review → fix → summary on an already-approved plan. Use when planning is done and the user wants implementation with Opus angular-code-review.'
---

Read and follow the skill at `.cursor/skills/implement-review/SKILL.md`, then execute its workflow on the currently approved plan.

Before doing anything else, verify the skill's preconditions:
1. An approved plan exists (from Plan mode, a planning subagent, or explicit user approval in this conversation). If not, stop and ask for one — or suggest `/plan-implement-review` to plan first.
2. You (the orchestrator) are running the `auto` model in Agent mode. State your current model and mode; if not `auto` in Agent mode, stop and ask the user to switch before continuing.

Then proceed through the skill's steps: implement in the dev subagent (auto), review in an Opus subagent, fix in the same dev subagent, and write the final summary (fixed / not fixed / plan coverage / manual testing needed).
