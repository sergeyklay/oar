# After a Bill Ends Setting

- **Status:** Draft
- **Last Updated:** 2025-01-27
- **Related:** [Logging Payments](./002-auto-pay.md), [Bill Detail Panel](./009-bill-detail-panel-and-skip-payment.md), [Recurrence Engine](./001-recurrence-engine.md)

## Overview

Bills don't last forever. A subscription might expire, a loan might get paid off, or you might cancel a service. When a bill reaches the end of its lifecycle, you need to decide what happens next. Do you want to keep it visible for reference, or move it out of the way?

The "After a Bill Ends" setting gives you control over this behavior. It's a simple choice with a clear impact: when a bill completes its lifecycle, you can either mark it as "Never Due" (keeping it visible but inactive) or move it to the Archive (hiding it from active views).

This setting aligns with the "Active Payer" philosophy because bill completion isn't automatic. You still log the payment that triggers the end. The setting only controls what happens after you've consciously acknowledged the bill's completion. You're making an informed decision, not sleepwalking through an automated process.

## When a bill ends

A bill ends in two scenarios:

**Scenario 1: End date reached.** You set an end date when creating or editing a bill. This tells Oar when a recurring bill should stop. When you log a payment that would advance the due date past the end date, the bill ends. For example, you have a monthly gym membership due March 15 with an end date of June 30. You log a payment on June 20 that advances the cycle. The next due date would be July 15, which exceeds the end date. The bill ends.

**Scenario 2: Interval changed to Never and fully paid.** You change a bill's repeat interval to "Never" (making it a one-time bill) and then log a payment that fully pays it. The bill ends because there's no next cycle to advance to. For example, you have a monthly subscription. You cancel it and change the interval to "Never." Then you log the final payment. The bill ends.

The system detects these scenarios automatically when you log a payment. You don't need to manually mark bills as ended. The detection happens behind the scenes, but you control the outcome through the setting.

## The setting

You find the "After a Bill Ends" setting in Settings under General → Behavior Options. It's a dropdown with two options:

**Mark as Never Due (default).** When a bill ends, it stays visible in your bill list. The status changes to "paid," the amount due becomes zero, and there's no next due date. The bill remains in your active views so you can reference it, but it won't appear in "Due Soon" or other time-based filters. This is useful when you want to keep a record of completed bills without cluttering your active obligations.

**Move to the Archive.** When a bill ends, it's immediately archived. The bill disappears from your active bill list, "Due Soon" screen, and other active views. You can still access it through the Archive view, but it's out of the way. This is useful when you want a clean separation between active bills and completed ones.

The setting applies globally to all bills. You can't set different behaviors for different bills. This keeps the system simple and predictable. Once you choose your preference, every bill that ends follows that rule.

## User flow

Here's what happens when a bill ends:

**Trigger:** You log a payment that causes a bill to end. This happens in the Log Payment dialog when you click "Log Payment" in the [Bill Detail Panel](./009-bill-detail-panel-and-skip-payment.md).

**Detection:** The system checks if the payment would cause the bill to end. It looks at two things: whether the next due date would exceed the bill's end date (if one is set), or whether the bill is a one-time bill that's now fully paid.

**Action:** If the bill ends, the system checks your "After a Bill Ends" setting. If you've chosen "Mark as Never Due," the bill's status updates to "paid" and the amount due becomes zero, but it stays visible. If you've chosen "Move to the Archive," the bill is archived and disappears from active views.

**Notification:** When a bill is archived, you see a toast notification: "Payment logged and bill archived." This confirms the action so you know what happened. If the bill is marked as "Never Due," you see the standard "Payment logged successfully" message.

**Result:** The bill is either marked as paid and remains visible, or it's archived and moved out of active views. Either way, the payment is recorded in the bill's payment history, and you can view it later.

## Edge cases and constraints

**Partial payments don't end bills.** If you log a partial payment on a one-time bill, the bill doesn't end until the cumulative payments fully pay it. The system only detects bill end when the amount due reaches zero after a payment.

**End date must be in the future.** When you set an end date on a bill, it must be after the current due date. The system won't let you set an end date in the past. This prevents confusion about when a bill should end.

**End date on one-time bills.** You can set an end date on a one-time bill, but it doesn't affect the bill's behavior. One-time bills end when they're fully paid, not when they reach an end date. The end date field exists for consistency, but it's ignored for one-time bills.

**Changing the setting after bills have ended.** If you change the "After a Bill Ends" setting, it only affects bills that end after the change. Bills that already ended keep their current state. You can manually archive or unarchive bills later if needed.

**Archived bills remain accessible.** When a bill is archived, it's not deleted. It's still in your database, and you can access it through the Archive view. You can also unarchive it later if you need to reference it or reactivate it.

**Auto-pay bills and bill end.** If you have auto-pay enabled on a bill that ends, the system still processes the final payment automatically. The bill end detection happens after the auto-payment, and the setting applies the same way as manual payments.

**Historical payments don't trigger bill end.** If you log a payment dated before the current billing cycle, it's treated as a historical payment and doesn't affect the bill's state. Bill end detection only happens for payments in the current cycle or future cycles.

**Multiple payments in the same cycle.** If you log multiple payments that together would cause a bill to end, the bill ends when the cumulative payments fully pay it. The system checks the total amount paid against the amount due, not individual payment amounts.

## Verification

To confirm the setting works:

1. Navigate to Settings → General → Behavior Options.
2. Find the "After a Bill Ends" dropdown. It should show your current preference (default is "Mark as Never Due").
3. Change it to "Move to the Archive" and verify the setting saves.
4. Create a test bill with a monthly frequency and set an end date one month in the future.
5. Log a payment that would advance the cycle past the end date.
6. Verify you see the "Payment logged and bill archived" toast notification.
7. Check that the bill no longer appears in your active bill list.
8. Navigate to the Archive view and confirm the bill is there.

To test the "Mark as Never Due" option:

1. Change the setting back to "Mark as Never Due."
2. Create another test bill with an end date.
3. Log a payment that ends the bill.
4. Verify you see "Payment logged successfully" (not the archive message).
5. Check that the bill remains in your active bill list with status "paid" and amount due zero.
6. Verify the bill doesn't appear in "Due Soon" or other time-based filters.

To test the "Never" interval scenario:

1. Create a monthly bill.
2. Edit it and change the repeat interval to "Never."
3. Log a payment that fully pays the bill.
4. Verify the bill ends according to your setting preference.
5. Check the payment history to confirm the payment was recorded.

