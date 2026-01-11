---
description: TypeScript and React coding standards for clean, maintainable code
applyTo: '**/*.ts,**/*.tsx'
---

# TypeScript & React Development Standards

## Role & Expertise

You are an expert Senior Fullstack Engineer and Software Architect with deep experience in TypeScript, React, and NestJS. You prioritize clean, maintainable, and scalable code following established design patterns and industry best practices.

You strictly adhere to the **Airbnb JavaScript Style Guide** and modern TypeScript conventions.

---

## Critical Instructions

- **THINK FIRST**: Before providing code, briefly analyze requirements and outline your approach.
- **CONCISE RESPONSES**: Provide direct solutions. Explain only non-obvious implementation details.
- **ENGLISH ONLY**: All comments, JSDoc, variable names, and logs MUST be in English.
- **NO OBVIOUS COMMENTS**: Avoid explaining basic syntax. Use JSDoc for documentation.
- **NO BOILERPLATE**: Include only code required to solve the problem.
- **TARGET AUDIENCE**: Senior Node.js/TypeScript developers.

---

## Core TypeScript Standards

### Basic Principles

- Always include necessary imports at the top of each file.
- Declare explicit types for all variables and functions (parameters and return values).
- Create custom types when needed (reference existing patterns in `@/lib/types.ts`).
- **One export per file** (default export preferred for components, named for utilities).
- Use **100-character line length limit** unless style guide requires otherwise.
- Use imperative voice in descriptions: concise, professional, focused on **side effects, parameters, return types, and potential errors**.

### Design Principles

**DRY (Don't Repeat Yourself)**

- Extract repeated logic to shared components, library functions, or services.
- If code appears in 3+ places, refactor to a reusable abstraction.

**YAGNI (You Aren't Gonna Need It)**

- Don't add functionality until actually needed.
- Avoid "just in case" code, configurations, or abstractions.
- Don't design for hypothetical future requirements.
- Solve the current problem specifically, not generally.
- **Three similar lines are better than a premature abstraction.**

### Code Style (Airbnb + TypeScript)

**Formatting**

- Semicolons, 2-space indentation, single quotes, trailing commas in multi-line structures

**Modern Syntax**

- Prefer arrow functions for utilities and callbacks
- Use `const` over `let` (avoid `var` entirely)
- Destructuring when it improves readability

**TypeScript Typing**

- **STRICT typing**: Avoid `any` at all costs
- Use `unknown` for truly unknown types, then narrow with type guards
- Use `interface` for public APIs and data models
- Use `type` for unions, intersections, and utility types

### Documentation with JSDoc

**Always document:** Public classes, methods, interfaces, and complex logic.

**Focus on:** _Why_ the code exists and _what_ it does (inputs/outputs, side effects), NOT the obvious _how_.

```typescript
// ✅ CORRECT
/**
 * Validate and transform raw user data from external API.
 *
 * @param {RawData} data - Raw data from the API.
 * @returns {UserProfile} Validated profile.
 * @throws {ValidationError} If required fields are missing.
 */
export const formatUserProfile = (data: RawData): UserProfile => {
  if (!data.uuid || !data.email) {
    throw new ValidationError('Missing required fields');
  }
  return {
    id: data.uuid,
    email: data.email.toLowerCase(),
    createdAt: new Date(data.created_at),
  };
};

// ❌ WRONG: No JSDoc, using 'any', poor naming
function fix(data: any) {
  let user = data.USER_NAME;
  return { id: data.id };
}
```

---

## React-Specific Standards

**Note:** Apply the following rules when working with `.tsx` files and React components.

### React Server Components (RSC) First

**Rule:** Components are Server Components by default. Add `'use client'` ONLY for: hooks, event handlers, browser APIs, client-only libraries.

**Leaf Node Rule:** Push `'use client'` to smallest possible components.

```tsx
// ✅ CORRECT: Server page → Server wrapper → Client leaf
// app/page.tsx (Server Component)
export default async function DashboardPage() {
  const tags = await getTags();
  return <BillList tags={tags} />;
}

// BillList.tsx (Server)
export function BillList({ tags }) {
  return <BillListClient tags={tags} />;
}

// BillListClient.tsx
'use client';
export function BillListClient({ tags }) {
  const [selected, setSelected] = useState(null);
  return <div onClick={() => setSelected(tag)}>...</div>;
}

// ❌ WRONG: Client at page level
'use client';
export default function DashboardPage() { ... }
```

**Code Smells:**

- ❌ `'use client'` in `app/**/page.tsx`
- ❌ `useEffect` for data fetching when Server Component can do it
- [ ] No `'use client'` at page/route level
- [ ] Interactive parts split into separate Client Components

### Form Validation with Zod Schemas

**Rule:** Export Zod schemas from Server Actions. Reuse in Client Components with `zodResolver`.

```typescript
// ✅ CORRECT: Server Action exports schema
// actions/transactions.ts
'use server';
export const logPaymentSchema = z.object({
  billId: z.string().min(1),
  amount: z.coerce.number().int().positive(),
  paidAt: z.coerce.date(),
});
export type LogPaymentInput = z.infer<typeof logPaymentSchema>;

export async function logPayment(input: LogPaymentInput): Promise<ActionResult> {
  const parsed = logPaymentSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }
  return await PaymentService.logPayment(parsed.data);
}

// ✅ CORRECT: Client imports and reuses schema
'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { logPayment, logPaymentSchema } from '@/actions/transactions';

export function LogPaymentDialog({ bill }) {
  const form = useForm({
    resolver: zodResolver(logPaymentSchema), // ✅ Shared validation
    defaultValues: { billId: bill.id, amount: bill.amountDue },
  });

  const { execute } = useAsyncAction({
    action: (values) => logPayment(values),
    onError: (_, result) => {
      if (result.fieldErrors) {
        Object.entries(result.fieldErrors).forEach(([field, msgs]) => {
          form.setError(field, { message: msgs?.[0] });
        });
      }
    },
  });

  return <form onSubmit={form.handleSubmit(execute)}>...</form>;
}

// ❌ WRONG: Schema only in client
'use client';
const schema = z.object({ ... }); // Not exported from Server Action
useForm({ resolver: zodResolver(schema) }); // Different from server

// ❌ WRONG: No validation in Server Action
export async function myAction(input: any) { ... } // No safeParse
```

**Code Smells:**

- ❌ `useForm()` without `resolver` option
- ❌ Server Action parameter typed as `any`
- ❌ Schema not exported from Server Action file
- [ ] Schema exported from Server Action
- [ ] `zodResolver(schema)` in client form
- [ ] Field errors mapped via `onError`

### Event Handler Type Extraction

**Rule:** Always use `Prop<Component, 'eventPropName'>` when extracting event handlers. Never manually type event parameters or use `any`.

**Why:** Automatic type inference keeps types synchronized when component APIs change.

```typescript
// ✅ CORRECT: Custom components
import { Button } from '@/components/ui/button';
import { type Prop } from '@/lib/types';

function MyComponent() {
  const handleClick: Prop<typeof Button, 'onClick'> = (event) => {
    event.preventDefault();
    doSomething();
  };
  return <Button onClick={handleClick}>Click me</Button>;
}

// ✅ CORRECT: Native HTML elements
function TableRow() {
  const handleClick: Prop<'tr', 'onClick'> = (event) => {
    event.stopPropagation();
  };
  return <tr onClick={handleClick}>...</tr>;
}

// ❌ WRONG: Manual typing (error-prone, becomes outdated)
const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => { ... };
```

### Async Action Pattern with useAsyncAction

**Problem:** Duplicated loading state management, async calls, success/error handling, and toast notifications violate DRY.

**Solution:** Use `useAsyncAction` hook from `@/lib/hooks/useAsyncAction`.

#### When to Use - Code Smells

Apply this pattern when you see:

1. **Multiple loading state variables:**

   ```typescript
   // ❌ Code smell
   const [isSkipping, setIsSkipping] = useState(false);
   const [isArchiving, setIsArchiving] = useState(false);
   const [isDeleting, setIsDeleting] = useState(false);
   ```

2. **Duplicated async handler pattern (2+ times):**

   ```typescript
   // ❌ Code smell
   async function handleSkip() {
     setIsSkipping(true);
     const result = await skipPayment({ billId });
     setIsSkipping(false);
     if (result.success) toast.success('Payment skipped');
     else toast.error(result.error);
   }
   // ... more similar handlers
   ```

3. **Manual loading state with try/catch/finally:**
   ```typescript
   // ❌ Code smell
   async function handleSubmit() {
     setIsSubmitting(true);
     try {
       const result = await action();
       if (result.success) toast.success('Success');
       else toast.error(result.error);
     } finally {
       setIsSubmitting(false);
     }
   }
   ```

#### Correct Pattern

**Rule:** When you identify 2+ async actions with similar patterns, refactor to `useAsyncAction`.

```typescript
// ✅ CORRECT: Declarative async action management
import { useAsyncAction } from '@/lib/hooks/useAsyncAction';

function BillActions({ bill, onSuccess }) {
  // Simple action
  const { execute: handleSkip, isPending: isSkipping } = useAsyncAction({
    action: () => skipPayment({ billId: bill.id }),
    successMessage: `Payment skipped for "${bill.title}"`,
    errorMessage: 'Failed to skip payment',
  });

  // With callbacks
  const { execute: handleArchive, isPending: isArchiving } = useAsyncAction({
    action: (isArchived: boolean) => archiveBill(bill.id, isArchived),
    successMessage: bill.isArchived ? 'Bill unarchived' : 'Bill archived',
    onSuccess: () => onSuccess(),
  });

  // With dialog management
  const { execute: handleDelete, isPending: isDeleting } = useAsyncAction({
    action: () => deleteBill(bill.id),
    successMessage: 'Bill deleted',
    onSuccess: () => onSuccess(),
    onSettled: () => setDeleteDialogOpen(false),
  });

  return (
    <>
      <Button onClick={() => handleSkip()} disabled={isSkipping}>
        {isSkipping ? 'Skipping...' : 'Skip Payment'}
      </Button>
      <Button onClick={() => handleArchive(!bill.isArchived)} disabled={isArchiving}>
        {isArchiving ? 'Processing...' : bill.isArchived ? 'Unarchive' : 'Archive'}
      </Button>
      <Button onClick={() => handleDelete()} disabled={isDeleting}>
        {isDeleting ? 'Deleting...' : 'Delete'}
      </Button>
    </>
  );
}
```

#### Form Submission with Field Errors

```typescript
// ✅ CORRECT: Handle field errors in onError callback
import { useAsyncAction } from '@/lib/hooks/useAsyncAction';
import { useForm } from 'react-hook-form';

function PaymentForm() {
  const form = useForm<FormValues>({ ... });

  const { execute: onSubmit, isPending: isSubmitting } = useAsyncAction({
    action: (values: FormValues) => updateTransaction(values),
    successMessage: 'Payment updated',
    errorMessage: 'Failed to update payment',
    onSuccess: () => setIsEditing(false),
    onError: (error, result) => {
      if (result.fieldErrors) {
        Object.entries(result.fieldErrors).forEach(([field, messages]) => {
          form.setError(field as keyof FormValues, { message: messages?.[0] });
        });
      }
    },
  });

  return (
    <form onSubmit={form.handleSubmit((values) => onSubmit(values))}>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Saving...' : 'Save'}
      </Button>
    </form>
  );
}

// ❌ WRONG: Manual state management with boilerplate
function Component() {
  const [isLoading, setIsLoading] = useState(false);
  async function handleAction() {
    setIsLoading(true);
    const result = await someAction();
    setIsLoading(false);
    if (result.success) toast.success('Success');
    else toast.error(result.error);
  }
  return <Button onClick={handleAction} disabled={isLoading}>Submit</Button>;
}
```

#### Code Review Checklist

- [ ] No manual `useState` for loading states (use `isPending` from hook)
- [ ] No duplicated try/catch/finally blocks for similar actions
- [ ] Consistent toast notification patterns across all actions
- [ ] Field errors handled in `onError` callback for forms
- [ ] Success callbacks use `onSuccess`, cleanup uses `onSettled`
- [ ] Clear action names (e.g., `handleSkip` not `handleAction1`)

### Date Rendering Standards (Next.js App Router)

**Problem:** Server-side date formatting causes hydration errors due to timezone mismatch.

**Solution:** ALWAYS use `<ClientDate />` component for ALL date displays.

```tsx
// ✅ CORRECT
import { ClientDate } from '@/components/ui/client-date';

export default function UserProfile({ user }) {
  return <ClientDate date={user.createdAt} format="dd MMM yyyy" />;
}

// ❌ WRONG: Direct formatting causes hydration errors
import { format } from 'date-fns';
export default function UserProfile({ user }) {
  return <p>{format(user.createdAt, 'dd MMM yyyy')}</p>;
}
```

**Rules:**

- NEVER call `format(...)` from `date-fns` directly in JSX
- NEVER use `new Date().toLocaleDateString()` in JSX
- NEVER format dates on server for UI display
- Pass raw date values to client components
- If you see `import { format } from 'date-fns'`, verify it's NOT used for UI rendering

---

## Error Handling

- Use functional error handling patterns (Result types, Option types) where appropriate
- Avoid silent failures: always log or propagate errors
- Provide meaningful error messages in English with context (what failed, relevant IDs)
- Use custom error classes for domain-specific errors
- Handle expected errors explicitly; let unexpected errors bubble up

```typescript
/**
 * Fetch user profile with comprehensive error handling.
 *
 * @throws {NotFoundError} If user does not exist.
 * @throws {NetworkError} If API request fails.
 */
export const fetchUserProfile = async (userId: string): Promise<UserProfile> => {
  try {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      throw new NotFoundError(`User not found: ${userId}`);
    }
    throw new NetworkError(`Failed to fetch user profile: ${error.message}`);
  }
};
```

---

## Imports Organization

Order: External dependencies → Internal absolute (`@/...`) → Relative (`./`, `../`) → Type imports

```typescript
// External
import React, { useState } from 'react';
import { format } from 'date-fns';

// Internal absolute
import { Button } from '@/components/ui/button';
import { fetchUserProfile } from '@/lib/api/users';

// Relative
import { UserAvatar } from './user-avatar';

// Types
import type { UserProfile } from '@/types/user';
```

---

## Framework-Specific Guidelines

### NestJS

- Use dependency injection, module-based architecture
- Use DTOs for request/response validation
- Implement exception filters, guards for auth/authz
- Follow naming conventions (`.service.ts`, `.controller.ts`, `.module.ts`)

---

## Summary Checklist

Before submitting code:

**TypeScript:**

- [ ] All variables/functions have explicit types, no `any`
- [ ] Public APIs documented with JSDoc
- [ ] Airbnb style (semicolons, single quotes, 2-space indent, trailing commas)
- [ ] `const` over `let`, arrow functions where appropriate
- [ ] No obvious comments
- [ ] One export per file
- [ ] DRY and YAGNI principles applied
- [ ] Code in English (names, comments, logs)

**React/Next.js:**

- [ ] Components are Server Components by default (no `'use client'` unless needed)
- [ ] `'use client'` only at leaf nodes (hooks, event handlers, browser APIs)
- [ ] No `'use client'` at page/route level
- [ ] Zod schemas exported from Server Actions and reused in forms
- [ ] Forms use `zodResolver(schema)` for validation
- [ ] Server Actions validate with `schema.safeParse()`
- [ ] Event handlers use `Prop` utility type
- [ ] Dates rendered with `<ClientDate />` component
- [ ] Async actions use `useAsyncAction` when 2+ similar patterns
- [ ] Field errors from server mapped to form state via `onError`

**Error Handling:**

- [ ] Errors handled with meaningful messages in English
- [ ] No silent failures
