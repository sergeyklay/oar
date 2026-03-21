---
name: implement
description: Execute implementation plan or implement feature directly
argument-hint: Path to plan file, or feature description if working without plan
agent: Coder
---

Implement the requested feature following the project's architectural constraints.

**Your scope: production `.ts`/`.tsx` files only.** Test files (`*.test.ts` or `*.test.tsx`) are handled by the Tester agent via handoff after you finish. Focus entirely on implementation.

Before writing any code, read the relevant sections of existing documentation in [docs](../../docs) directory — this is the authoritative specification. Drift from the spec is a bug.

**If a plan exists:** execute it strictly phase-by-phase. Complete each step, verify it compiles and passes tests, then proceed to the next. Do not skip steps or reorder phases.

**If no plan exists:** analyze the request, identify required changes across all layers (domain → service → adapter → integration), and implement atomically following the architecture guidelines.

Apply coding standards from: [writing.instructions.md](../instructions/writing.instructions.md) and [typescript-react.instructions.md](../instructions/typescript-react.instructions.md)

When finished, provide an implementation summary (files modified, changes made, testing considerations) and use the **Verify Implementation** handoff to pass work to the Tester agent.

${input:request:Path to plan file or feature description}
