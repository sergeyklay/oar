---
name: makePlan
description: Generate a detailed implementation plan from a specification
argument-hint: Path to spec file or feature description
agent: Planner
---

Analyze the provided specification section-by-section and create an atomic, layer-aware implementation plan.

Before planning, read the relevant sections of existing documentation in [docs](../../docs) directory to ensure the plan respects milestone ordering and dependencies.

Follow your planning process and output format rules strictly.

Apply coding standards from: [writing.instructions.md](../instructions/writing.instructions.md) and [typescript-react.instructions.md](../instructions/typescript-react.instructions.md)

${input:request:Path to spec file or feature description}
