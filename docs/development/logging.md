# Logging in Oar

- **Status:** Draft
- **Last Updated:** 2025-12-24

## 1. Goal

Use Oar's centralized logging system to record application events, debug issues, and monitor behavior. This guide explains how to add logging to your code, choose appropriate log levels, and structure log messages for maximum value.

## 2. Prerequisites

No additional setup required. The logging infrastructure is already configured. You only need to import and use the logger in your code.

## 3. Core Principle

Oar uses a centralized logging system built on Pino. Direct use of `console.log`, `console.error`, or `console.warn` is forbidden. This ensures consistent log formatting, proper log levels, and environment-aware behavior.

The logger automatically adapts to your environment. On the server, it uses Pino with pretty formatting in development and JSON in production. On the client, it provides a lightweight wrapper that respects log levels and hides sensitive data in production.

## 4. Basic Usage

### Step 1: Import the Logger

At the top of your file, import `getLogger` and create a logger instance with a context name:

```typescript
import { getLogger } from '@/lib/logger';

const logger = getLogger('MyService');
```

The context name identifies where logs originate. Use your module, service, or component name. Examples: `StartupCatchUpService`, `BillFormDialog`, `Actions:Bills`.

### Step 2: Log Events

Use the logger methods to record events:

```typescript
logger.info('Service initialized');
logger.debug({ billId: '123' }, 'Processing bill');
logger.error(error, 'Failed to save bill');
```

Each log level serves a specific purpose. Use `info` for significant lifecycle events, `debug` for detailed development information, and `error` for failures that don't crash the application.

## 5. Log Levels

The logger supports six levels, ordered from most verbose to least:

- **trace**: Extremely verbose details, like loop iterations. Rarely used.
- **debug**: Granular development details, such as SQL queries or state changes. Hidden in production on the client.
- **info**: Significant lifecycle events, like service startup or job completion.
- **warn**: Unexpected but handled situations, like fallback behavior.
- **error**: Operation failures where the application continues. Must include an Error object.
- **fatal**: System is unusable and crash is imminent. Rarely used.

Choose the level that matches the event's importance. If you're unsure, use `info` for user-facing events and `debug` for internal details.

## 6. Structured Logging

Always pass data as an object first, then the message. This enables log aggregation tools to parse and filter logs effectively.

**Avoid string interpolation:**

```typescript
// Don't do this
logger.info('User ' + userId + ' logged in');
```

**Use structured logging:**

```typescript
// Do this instead
logger.info({ userId }, 'User logged in');
```

For errors, you can pass the Error object first, then the message:

```typescript
try {
  await saveBill(billData);
} catch (error) {
  logger.error(error, 'Failed to save bill');
}
```

When you need additional context, include the error in the structured data object using the `err` key:

```typescript
try {
  await saveBill(billData);
} catch (error) {
  logger.error({ err: error, billId: billData.id }, 'Failed to save bill');
}
```

Both patterns preserve stack traces and error properties. Use the structured approach when you need to include additional context data.

## 7. Usage Patterns by Context

### Server Actions

Log errors when operations fail, but avoid logging every validation error. Log at the catch block level:

```typescript
'use server';

import { getLogger } from '@/lib/logger';

const logger = getLogger('Actions:Bills');

export async function createBill(input: CreateBillInput) {
  const parsed = createBillSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, error: 'Validation failed' };
  }

  try {
    // ... create bill logic
    return { success: true, data: { id: newBill.id } };
  } catch (error) {
    logger.error(error, 'Failed to create bill');
    return { success: false, error: 'Failed to create bill' };
  }
}
```

### Domain Services

Services contain core logic, so logging helps track execution flow. Log at key decision points and when operations complete:

```typescript
import { getLogger } from '@/lib/logger';

const logger = getLogger('RecurrenceService');

export const RecurrenceService = {
  async checkDailyBills() {
    logger.debug('Starting daily bill check');

    const candidates = await db.select().from(bills);

    for (const bill of candidates) {
      if (bill.status === 'overdue') {
        logger.info(
          { billId: bill.id, billTitle: bill.title },
          'Bill marked overdue'
        );
      }
    }

    logger.info(
      { checked: candidates.length, updated: count },
      'Daily bill check complete'
    );
  },
};
```

### React Components

Client components should log sparingly. Most user interactions are handled by server actions, which already log errors. Only log client-specific issues:

```typescript
'use client';

// Usually no logger needed in client components
// Errors are handled by server actions and logged there
```

If you need client-side logging for debugging, use the logger but avoid logging sensitive data like financial amounts or personal information.

### Background Jobs

Cron jobs and scheduled tasks should log their lifecycle:

```typescript
const logger = getLogger('Scheduler');

async function handler() {
  logger.info({ jobName: 'daily-bill-check' }, 'Job started');

  try {
    const result = await RecurrenceService.checkDailyBills();
    logger.info(
      { checked: result.checked, updated: result.updated },
      'Job completed successfully'
    );
  } catch (error) {
    logger.error(error, 'Job failed');
  }
}
```

## 8. Environment Behavior

The logger behaves differently based on where it runs:

**Server-side (Node.js):**
- Development: Pretty-printed logs with colors via `pino-pretty`
- Production: JSON logs to stdout for log aggregation tools

**Client-side (Browser):**
- Development: All log levels appear in the browser console
- Production: Only `error` and `fatal` logs appear. `debug`, `info`, `warn`, and `trace` are suppressed.

This prevents sensitive data from appearing in production browser logs while maintaining visibility for critical errors.

## 9. Testing

The logger is automatically mocked in tests via `lib/__mocks__/logger.ts`. You don't need to configure anything. Import `getLogger` and assert on the mock:

```typescript
import { getLogger } from '@/lib/logger';

jest.mock('@/lib/logger');

it('logs error when operation fails', async () => {
  await myFunction();

  const logger = getLogger('test');
  expect(logger.error).toHaveBeenCalledWith(
    expect.any(Error),
    'Operation failed'
  );
});
```

The mock returns the same logger instance for all calls, so you can access it via `getLogger('any-name')` in your tests.

## 10. Common Patterns

### Logging with Context

When logging events that involve multiple pieces of data, include them all in the object:

```typescript
logger.info(
  {
    billId: bill.id,
    amount: bill.amount,
    dueDate: bill.dueDate.toISOString(),
  },
  'Bill created'
);
```

### Conditional Logging

For expensive operations that only matter in development, use `debug`:

```typescript
logger.debug({ query: sql, params }, 'Executing database query');
```

In production, these logs are suppressed, avoiding performance overhead.

### Error Context

When logging errors, include relevant context in the structured data object, not in the message string. Put the error object in the data using the `err` key:

```typescript
try {
  await processPayment(billId, amount);
} catch (error) {
  logger.error(
    { err: error, billId, amount },
    'Failed to process payment'
  );
}
```

This keeps all context together in the structured data, making it easier for log aggregation tools to parse and filter. The error object preserves the stack trace and error properties for debugging.

## 11. Edge Cases and Constraints

**Circular References:** If your log data contains circular references, Pino handles them automatically by replacing circular paths with `[Circular]`.

**Large Objects:** Avoid logging entire database rows or large objects. Log only the fields you need for debugging.

**Sensitive Data:** Never log passwords, API keys, or full financial amounts in client-side code. The production client logger suppresses most logs, but it's better to avoid the risk.

**Async Operations:** The logger methods are synchronous and don't block. You can call them without `await`.

**Child Loggers:** The `child` method creates a new logger with additional context. This is handled automatically by `getLogger`, so you rarely need to call `child` directly.

## 12. Verification

How do you know logging is working?

1. **In Development:** Check your terminal (server) or browser console (client). You should see colorized, formatted logs.

2. **In Tests:** Assert on the mock logger:

```typescript
const logger = getLogger('test');
expect(logger.info).toHaveBeenCalledWith('Expected message');
```

3. **In Production:** Check your log aggregation service (if configured) for JSON-formatted logs from the server.

## 13. Troubleshooting

### Logs Not Appearing

If logs don't appear in development:
- Verify you're using `getLogger` from `@/lib/logger`, not `console.log`
- Check that the log level is appropriate (debug logs are hidden in production client)
- Ensure the logger is initialized at the module level, not inside a function

### Type Errors

If TypeScript complains about logger types:
- Ensure you're importing from `@/lib/logger`, not directly from `pino`
- The logger returns a `pino.Logger` type, which should work with all Pino methods

### Test Failures

If tests fail because logger isn't mocked:
- Ensure `jest.mock('@/lib/logger')` is called before imports
- The manual mock in `lib/__mocks__/logger.ts` is used automatically

### Performance Concerns

If logging seems slow:
- Use `debug` level for verbose logs that only matter in development
- Avoid logging in tight loops; batch the operation and log the summary
- The logger is optimized for performance, but excessive logging can still impact throughput

