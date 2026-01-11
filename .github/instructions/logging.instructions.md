---
description: Standards for logging, error handling, and debugging in Next.js
applyTo: '**/*.ts,**/*.tsx'
---

# Logging & Observability Standards

## 1. Core Principle: No Console Logs

- **FORBIDDEN:** Direct use of `console.log`, `console.error`, `console.warn`.
- **REQUIRED:** Use the unified logger exported from `@/lib/logger`.
- **ENFORCEMENT:** ESLint `no-console` rule is set to `error` to automatically catch violations. Exceptions are allowed in test setup files for mocking purposes.

## 2. Logger Setup

The project uses `pino` with `pino-pretty` for development.

Always initialize a child logger with the current module/component context/name at the top of the file:

```typescript
import { getLogger } from '@/lib/logger';

const logger = getLogger('BillService'); // Context name is mandatory
```

## 3. Logging Patterns

### Simple message (no data)

```typescript
logger.info('Starting catch-up process...');
logger.warn('No bills found for processing');
```

### Message with structured data

Pass data object first, message second:

```typescript
// ✅ Correct: object first, message second
logger.info({ billId, amount }, 'Payment logged');
logger.debug({ query, duration: 42 }, 'Query executed');

// ❌ Wrong: string interpolation
logger.info('Payment logged for bill ' + billId);
logger.info(`Payment logged for bill ${billId}`);
```

### Error logging

Pass Error object directly as first argument:

```typescript
try {
  await processBill(billId);
} catch (error) {
  // ✅ Correct: Error as first argument
  logger.error(error, 'Failed to process bill');
}
```

```typescript
// ❌ Wrong: wrapping error in object with wrong key
logger.error({ error }, 'Failed to process bill');

// ❌ Wrong: only message, no error object
logger.error('Failed to process bill');
```

### Error with additional context

Use `err` key when including extra data alongside the error:

```typescript
catch (error) {
  // ✅ Correct: error under 'err' key with additional data
  logger.error({ err: error, billId, userId }, 'Payment failed');
}
```

## 4. Log Levels

| Level   | Use Case                        | Example                       |
| ------- | ------------------------------- | ----------------------------- |
| `fatal` | System unusable, crash imminent | DB connection lost            |
| `error` | Operation failed, app continues | Failed to save bill           |
| `warn`  | Unexpected but handled          | Retry succeeded after failure |
| `info`  | Lifecycle events                | Job started, Job complete     |
| `debug` | Development details             | Query results, state changes  |
| `trace` | Extremely verbose               | Loop iterations               |

## 5. Environment Behavior

- **Server:** JSON in production, pretty-printed in development.
- **Client (dev):** Logs to browser console.
- **Client (prod):** Only `error` and `fatal` are logged. Never log PII or financial data on client.
