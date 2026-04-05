---
name: create-skill
description: "Create or update a workspace SKILL.md that captures a reusable multi-step workflow for this repo. Use when you want a project-specific skill to automate agent customization and document a repeatable process."
---

# Create Skill

This workspace skill helps the assistant author a new `SKILL.md` file for a reusable workflow or task.

## When to use
- You want a workspace-scoped skill that encodes a multi-step process.
- You need to capture a repeatable workflow, decision points, and completion checks.
- You want the agent to generate a skill that is easy for teammates to invoke.

## What this skill produces
- A new `SKILL.md` in `.agents/skills/<name>/` or `.github/skills/<name>/`.
- YAML frontmatter with a clear `name` and `description`.
- A focused body describing the workflow, trigger phrases, and example prompts.
- Suggested follow-up customizations such as prompts, instructions, or agents.

## Workflow
1. Review the ongoing conversation and repo context.
2. Identify the repeated task, the step-by-step process, and success criteria.
3. Choose an appropriate skill name and file location.
4. Write the `SKILL.md` with descriptive metadata and task guidance.
5. Confirm the file is saved and the YAML frontmatter is valid.

## Example prompts
- "Use create-skill to write a SKILL.md for the checkout review workflow."
- "Create a workspace skill for deploying the app."
- "Generate a reusable skill that guides engineers through schema migration."
