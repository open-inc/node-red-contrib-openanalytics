# CLAUDE.md

This file provides guidance to Claude Code when working in this repository.

## Interaction Style

### Ask when anything is unclear

If any part of a task is ambiguous, underspecified, or could be interpreted in more than one way, **stop and ask the user before proceeding**. Do not guess or silently pick an interpretation. This applies to:

- Unclear requirements or acceptance criteria
- Multiple plausible implementation approaches
- Ambiguity about which package, file, or environment is affected
- Uncertainty about naming, versioning, or release impact
- Anything that would be hard to undo (deletions, force pushes, publishing)

### Always respond with options

When asking a clarifying question or proposing how to proceed, present the user with **concrete options** rather than open-ended questions:

- List 2–4 realistic alternatives with a short explanation of each (trade-offs, effort, risk).
- **Clearly highlight which option is the best practice / recommended**, and briefly explain why.
- Put the recommended option first and mark it, e.g. "(Recommended)".

Example format:

> **Option A (Recommended – best practice):** …because…
> **Option B:** …trade-off…
> **Option C:** …trade-off…
