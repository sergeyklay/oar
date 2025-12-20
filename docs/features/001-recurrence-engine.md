# Recurrence Engine

- **Status:** Draft
- **Last Updated:** 2025-12-20
- **Related:** [Logging Payments](./002-auto-pay.md)

## Concept

Bills repeat. Rent comes monthly. Insurance renews yearly. The recurrence engine handles this predictable rhythm by calculating when payments come due next and tracking their status as time passes.

Without automatic due date advancement, you'd manually edit every bill after each payment. The recurrence engine eliminates this busywork while preserving the "Active Payer" philosophy; it calculates dates, but you still decide when to log payments.

## User flow and logic

### Trigger: payment logged with "Update Due Date" enabled

When you log a payment and keep the "Update Due Date" toggle on (the default), the recurrence engine calculates the next due date based on the bill's repeat interval.

### Interval rules

| Interval | Behavior |
|-----------|----------|
| Every Week | Advances 7 days |
| Every 2 Weeks | Advances 14 days |
| Twice Per Month | Advances to the 15th or 1st (e.g., Jan 1 -> Jan 15 -> Feb 1) |
| Every Month | Advances to the same day next month |
| Every 2 Months | Advances to the same day in 2 months |
| Every 3 Months | Advances to the same day in 3 months |
| Every Year | Advances to the same day next year |
| Never | No next date; bill marked as paid |

**Examples:**
- A weekly bill due January 1 moves to January 8 after payment.
- A bi-weekly bill due January 1 moves to January 15.
- A twice-monthly bill due January 1 moves to January 15; if due January 15, it moves to February 1.
- A monthly bill due January 15 moves to February 15.
- A quarterly bill due January 10 moves to April 10.
- A bill with "Never" interval due March 1 becomes "paid" with no future due date.

### Trigger: daily status check (background job)

At midnight each day, a background job scans all pending bills. Any bill with a due date before today gets marked "overdue." This happens automatically without user action.

**Status determination:**
- Due date is today or in the future → pending
- Due date is in the past → overdue

### UI behavior

The bill list displays status badges based on these calculations:
- **Pending:** Due date hasn't passed yet
- **Overdue:** Due date passed without payment logged
- **Paid:** One-time bill (Interval: Never) fully paid

The due date shown in the bill list always reflects the current billing cycle. After you log a payment with "Update Due Date" enabled, the displayed date jumps to the next occurrence.

### Key components

Bill forms and the payment logging modal interact with these services through server actions. The UI never calculates dates directly.

## Edge cases and constraints

### Month-end dates

When a bill is due on the 31st, months without 31 days get skipped.

**Example:** A bill due January 31 skips February (28/29 days) and moves to March 31.

This behavior comes from strict date matching via the `rrule` library. The engine doesn't "roll back" to February 28; it waits for the next month that has a 31st.

### Leap year dates

Yearly bills due February 29 skip non-leap years.

**Example:** A bill due February 29, 2024 jumps to February 29, 2028 (the next leap year), not February 28, 2025.

If you need annual renewal on the last day of February every year, set the due date to February 28 instead.

### Twice per month logic

If you set a custom start date (not the 1st or 15th), the system calculates the second occurrence by adding 14 days. For example, a bill starting on the 5th will recur on the 19th.

### Timezone handling

Server functions normalize dates to midnight before comparison. This avoids issues where time-of-day affects overdue detection. A bill due "today" remains pending until tomorrow.

### Bills with "Never" interval after payment

These bills (formerly called "one-time") transition to "paid" status permanently. They don't advance because there's no next occurrence. The "Amount Due" zeroes out, and the bill stays in history.

### Race conditions in batch updates

The daily check bills job uses a specific database filter that re-validates the bill's state during the update. If another process changes a bill between the search and the update, no rows are affected. This prevents double-processing or conflicting status changes.

### Variable vs. fixed amounts

The recurrence engine treats variable and fixed bills identically. The "Variable Amount" flag affects UI display (showing "estimate" labels) but doesn't change how due dates advance.

## Future scope

Not included in this version:

- **Custom recurrence rules:** No support for "first Monday" or "every X weeks"
- **Skip patterns:** No way to skip specific occurrences (holidays, vacation months)
- **End dates:** Recurring bills continue indefinitely; there's no "ends after X payments"
- **Weekend adjustment:** No automatic shift to Friday/Monday when due dates land on weekends

## Verification

To confirm the recurrence engine works:

1. Create a monthly bill due today.
2. Log a payment with "Update Due Date" enabled.
3. The bill's due date should advance exactly one month.
4. Create a bill with "Every 2 Weeks" interval; due date should advance 14 days after payment.
5. Create a bill with "Never" interval, log payment; status should show "paid".
6. Create a bill due yesterday without logging payment; status should show "overdue".
