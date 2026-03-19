---
name: implement
description: Execute implementation plan or implement feature directly
argument-hint: Path to plan file, or feature description if working without plan
agent: Coder
---

Implement the requested feature following the project's architectural constraints.

Before writing any code, read the relevant sections of existing documentation in [docs](../../docs) directory — this is the authoritative specification. Drift from the spec is a bug.

**If a plan exists:** execute it strictly phase-by-phase. Complete each step, verify it compiles and passes tests, then proceed to the next. Do not skip steps or reorder phases.

**If no plan exists:** analyze the request, identify required changes across all layers (domain → service → adapter → integration), and implement atomically following the architecture guidelines.

Apply coding standards from: [writing.instructions.md](../instructions/writing.instructions.md) and [typescript-react.instructions.md](../instructions/typescript-react.instructions.md)

Follow your implementation rules strictly.

${input:request:Path to plan file or feature description}
