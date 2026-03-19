---
name: specify
description: Transform a feature request into a detailed technical specification
argument-hint: Describe the feature or problem to specify
agent: Architect
---

Transform the provided feature request into a technical specification rigorous enough to be implemented without further clarification. The specification must close every architectural decision, anticipate edge cases, and leave zero ambiguity for the implementing engineer. Incomplete or vague sections cause real engineering delays -- treat each section as a binding contract between architect and implementer.

Before writing anything, read the relevant sections of existing documentation in [docs](../../docs) directory — this is the authoritative specification for all domain models, state machines, algorithms, and validation rules. Your spec must conform to it; do not invent behavior that contradicts the architecture document.

Apply coding standards from: [writing.instructions.md](../instructions/writing.instructions.md) and [typescript-react.instructions.md](../instructions/typescript-react.instructions.md)

${input:request:Describe the feature or problem to specify}
