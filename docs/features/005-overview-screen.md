# Overview Screen

- **Status:** Draft
- **Last Updated:** 2025-12-25

## Overview

The Overview screen is your command center for managing bills. It displays all your bills in a table with four columns: category icon, name, amount, and due date. Each bill shows when payment is due using plain language like "Due in 3 days" or "Overdue by 5 days" so you can prioritize at a glance.

A colored status bar on the left edge of the due date cell gives you instant visual feedback about each bill's urgency. Red means overdue, amber means due soon, blue means you have time, and green means paid.

## The bill table

The table shows your bills with these columns:

**Category icon.** A small icon representing the bill's category (utilities, entertainment, insurance, etc.). This provides quick visual identification without taking up space.

**Name.** The bill title appears in bold, with the repeat interval shown below in smaller text. These display as friendly labels like "Every month," "Every year," or "Never" rather than technical terms.

**Amount.** The payment amount in your currency. Variable bills show "(estimate)" below the amount.

**Due date.** Shows when payment is due using human-readable text. A colored vertical bar on the left indicates the bill's urgency.

## Bill detail panel

Clicking anywhere on a bill row opens the **Bill Detail Panel** on the right side of the screen. This panel provides a focused view of the specific bill and serves as the primary location for taking action.

The detail panel replaces the calendar widget when a bill is selected, ensuring you have enough context to make a payment decision without navigating away from the Overview. From here, you can log a payment or skip the current billing cycle.

See the [Bill Detail Panel](./009-bill-detail-panel-and-skip-payment.md) documentation for full details on its behavior and the "Skip" action.

## Due date display

The due date column shows when a bill is due using everyday language instead of raw dates. The formatted date (like "Thu, Dec 25") appears below as a reference.

### Relative date formats

| Days until due | Display |
|----------------|---------|
| Past due, 1 day | Overdue by 1 day |
| Past due, multiple days | Overdue by 46 days |
| Today | Due today |
| Tomorrow | Due tomorrow |
| 2-6 days | Due in 3 days |
| 7 days | Due in 1 week |
| 8-13 days | Due in 10 days |
| 14-27 days | Due in 2 weeks |
| 28-45 days | Due in about 1 month |
| 2-5 months | Due in 3 months |
| 6+ months | Due in over 6 months |
| One-time bill, paid | Paid |

One-time bills (Interval: Never) that have been paid show "Paid" instead of the relative date. Recurring bills never show "Paid" because after payment their due date advances to the next billing cycle.

### Status bar colors

The vertical bar on the left edge of the due date cell indicates urgency:

| Color | Meaning |
|-------|---------|
| Red | Overdue. The due date has passed and the bill remains unpaid. |
| Amber | Due soon. The bill is due within the next 30 days. |
| Blue | Due later. The bill is due more than 30 days from now. |
| Green | Paid. For one-time bills that have been paid. |

The bar spans the full height of the cell, making it easy to scan down the column and spot bills needing attention.

## Repeat interval and payment mode

The subtitle below the bill name combines the repeat interval with the payment mode (Auto or Manual). This reinforces the "Active Payer" philosophy by explicitly signaling how each bill is handled.

* **Repeat interval.** Shows how often the bill recurs (e.g., "Every month").
* **Payment mode.** Indicates if the bill is paid automatically by your bank ("Auto") or if you must execute the payment yourself ("Manual").

| Internal value | Display label |
|----------------|---------------|
| weekly | Every week |
| biweekly | Every 2 weeks |
| twicemonthly | Twice per month |
| monthly | Every month |
| bimonthly | Every 2 months |
| quarterly | Every 3 months |
| yearly | Every year |
| once | Never |

The combined label appears as `Every month • Auto` or `Every month • Manual`.

### The logic of "Auto" vs "Manual"

Even when a bill is marked "Auto", the Active Payer philosophy suggests you shift the type of control. Auto-pay is not an excuse to relax, but a signal to shift from "remembering to pay" to "remembering to verify the charge". The "Auto" label serves as a reminder that while Oar will advance the due date automatically, you should still check that the expected amount was charged.

## Variable amounts

Bills with variable amounts (like utility bills that change each month) show "(estimate)" below the amount. This signals that the displayed amount is an approximation.

The estimate label uses muted styling to avoid visual clutter while providing important context.

## Logging payments

To record a payment for an unpaid bill, click the bill row to open the [Bill Detail Panel](./009-bill-detail-panel-and-skip-payment.md) and click the **Log Payment** button. This opens the payment dialog where you can enter the amount and date.

See the [Logging Payments](./002-auto-pay.md) documentation for details on the payment dialog, partial payments, and how due dates update.

## Editing bills

Clicking anywhere on a bill row opens the **Bill Detail Panel**. Management actions for the selected bill are located at the bottom of this panel:

- **Archive:** Moves the bill to your archive (removes it from active views). Archived bills can be accessed through the [Archive Screen](./013-archive-screen.md).
- **Edit:** Opens the bill form to modify title, amount, repeat interval, category, or tags.
- **Delete:** Removes the bill entirely (requires confirmation).

Payment history is available directly within the Bill Detail Panel through the collapsible "View Payment History" section. See [Bill Detail Panel](./009-bill-detail-panel-and-skip-payment.md) for details.

## Edge cases

**No bills.** When you have no bills, the table shows an empty state prompting you to add your first bill.

**Long bill names.** Bill titles truncate gracefully when they exceed the column width. The full title appears in the bill detail panel when you select a row.

**Past-due one-time bills.** Bills with a "Never" interval that are overdue continue showing "Overdue by X days" with a red status bar until you log a payment. Once paid, they show "Paid" with a green bar.

**Future recurring bills.** Recurring bills due far in the future (over 30 days) show a blue status bar to indicate no immediate action is needed.

**Day boundaries.** The system calculates day differences using the start of each day (midnight). A bill due at 11pm tonight shows as "Due today" throughout the day.

**Month calculations.** The "Due in X months" format uses calendar months. A bill due January 15 viewed on December 15 shows "Due in about 1 month" even though the exact day count might vary.

## Verification

To confirm the Overview screen works:

1. Navigate to the Overview page. You should see a table with four columns.
2. Check that bill names show combined subtitles like "Every month • Manual" or "Every month • Auto" below them. Verify the bullet point separates the interval from the payment mode.
3. Look for any variable bills. They should show "(estimate)" below the amount.
4. Verify overdue bills show "Overdue by X days" with a red status bar.
5. Check that bills due within 30 days show an amber bar.
6. Check that bills due more than 30 days away show a blue bar.
7. Find a paid one-time bill. It should show "Paid" with a green bar.
8. Click on a bill row. The Bill Detail Panel should appear on the right.
9. Look at the bottom of the Bill Detail Panel. You should see Archive, Edit, and Delete buttons.
10. Look for the "View Payment History" section in the panel to access past payments.

## Related Documents

* [Bill Detail Panel & Skip Payment](./009-bill-detail-panel-and-skip-payment.md) - The panel for managing a specific bill
* [Logging Payments](./002-auto-pay.md) - Recording payments, partial payments, and historical payment detection
* [Archive Screen](./013-archive-screen.md) - Viewing and managing archived bills
