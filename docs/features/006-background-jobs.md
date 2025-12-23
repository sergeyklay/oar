# Background Jobs

- **Status:** Draft
- **Last Updated:** 2025-12-21
- **Related:** [Recurrence Engine](./001-recurrence-engine.md), [Logging Payments](./002-auto-pay.md), [Active Payer Signals](./010-active-payer-signals.md)

## Overview

Oar runs two daily tasks in the background that keep your bill statuses accurate without requiring your attention. You don't need to configure anything; these jobs start automatically when the app runs.

## Daily status check

Runs at midnight (00:00 UTC).

This job scans all your pending bills and marks any with past due dates as "overdue." You'll see the status change in the bill list the next time you open the app.

For details on how bill statuses work, see [Recurrence Engine](./001-recurrence-engine.md).

## Auto-pay processing

Runs at 00:05 UTC (five minutes after the status check).

If you've marked a bill as "auto-pay," this job handles the bookkeeping when the due date arrives. It creates a payment record and advances the bill to its next due date.

### What "auto-pay" means in Oar

Marking a bill as auto-pay tells Oar that your bank handles payment automatically (direct debit, recurring card charge, etc.). Oar doesn't send money anywhere. It logs the payment in your history so you have a complete record, then advances the due date so your bill list stays current.

This reduces manual work for bills you've already delegated to your bank. You made the conscious choice to set up auto-pay externally; Oar respects that decision by keeping your records in sync.

### When auto-pay bills get processed

A bill is processed when all these conditions are true:
- You marked it as auto-pay
- The due date has arrived (today or earlier)
- It hasn't already been paid

Once processed:
- A payment record appears in the bill's history with the note "Logged by Oar"
- The due date advances to the next cycle (for recurring bills)
- One-time auto-pay bills are marked as paid

## Verification

To confirm background jobs are running:

1. Create a bill with a due date in the past. After midnight, check that its status changed to "overdue."
2. Mark a bill as auto-pay with a due date of today. After 00:05 UTC, check the bill's payment history. You should see a new payment with the note "Logged by Oar."

