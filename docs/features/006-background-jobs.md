# Background Jobs

- **Status:** Draft
- **Last Updated:** 2025-12-30

## Overview

Oar runs two daily tasks in the background that keep your bill statuses accurate without requiring your attention. You don't need to configure anything; these jobs start automatically when the app runs.

## Daily status check

Runs at midnight (00:00 UTC).

This job scans all your pending bills and marks any with past due dates as "overdue." The job uses adjusted payment dates (not anchor dates) to determine overdue status, ensuring bills are marked overdue based on when payments actually clear. For example, a bill due Saturday January 15 with "Move to Next Business Day" strategy becomes overdue on Monday January 17, not on Saturday. You'll see the status change in the bill list the next time you open the app.

For details on how bill statuses work, see [Recurrence Engine](./001-recurrence-engine.md). For details on weekend date adjustment, see [Weekend Payment Date Adjustment](./021-weekend-payment-date-adjustment.md).

## Auto-pay processing

Runs at 00:05 UTC (five minutes after the status check).

If you've marked a bill as "auto-pay," this job can handle the bookkeeping when the due date arrives. It creates a payment record and advances the bill to its next due date. This behavior is controlled by the "Automatically log automatic bills" setting in Settings → Logging Settings. When the setting is disabled, the job skips processing and you must log payments manually.

### What "auto-pay" means in Oar

Marking a bill as auto-pay tells Oar that your bank handles payment automatically (direct debit, recurring card charge, etc.). Oar doesn't send money anywhere. When auto-logging is enabled, it logs the payment in your history so you have a complete record, then advances the due date so your bill list stays current.

This reduces manual work for bills you've already delegated to your bank. You made the conscious choice to set up auto-pay externally; Oar respects that decision by keeping your records in sync. However, if you prefer to verify each payment amount before logging (especially important for variable bills where estimates may differ from actual charges), you can disable auto-logging and log payments manually.

### When auto-pay bills get processed

The job only processes bills when the "Automatically log automatic bills" setting is enabled. A bill is processed when all these conditions are true:
- The auto-log setting is enabled
- You marked it as auto-pay
- The due date has arrived (today or earlier)
- It hasn't already been paid
- The amount due is greater than zero

The amount due check ensures bills that are already fully paid in the current cycle (from partial payments) or variable bills after cycle advance (where amount due resets to zero) are not processed until the next cycle when an amount is due.

Once processed:
- A payment record appears in the bill's history with the note "Logged by Oar"
- The due date advances to the next cycle (for recurring bills)
- One-time auto-pay bills are marked as paid

## Verification

To confirm background jobs are running:

1. Create a bill with a due date in the past. After midnight, check that its status changed to "overdue."
2. Mark a bill as auto-pay with a due date of today. After 00:05 UTC, check the bill's payment history. You should see a new payment with the note "Logged by Oar."

## Related Documents

* [Recurrence Engine](./001-recurrence-engine.md) - How recurring and one-time payments advance
* [Logging Payments](./002-auto-pay.md) - Recording payments, partial payments, and historical payment detection
* [Active Payer Signals](./010-active-payer-signals.md) - Explicit payment mode indicators (Auto/Manual) for each bill
* [Weekend Payment Date Adjustment](./021-weekend-payment-date-adjustment.md) - How weekend due dates are adjusted for banking reality

