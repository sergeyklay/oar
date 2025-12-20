# Overview screen

- **Status:** Draft
- **Last Updated:** 2025-12-20

## Overview

The Overview screen is your command center for managing bills. It displays all your bills in a table with five columns: category icon, name, amount, due date, and actions. Each bill shows when payment is due using plain language like "Due in 3 days" or "Overdue by 5 days" so you can prioritize at a glance.

A colored status bar on the left edge of the due date cell gives you instant visual feedback about each bill's urgency. Red means overdue, amber means due soon, blue means you have time, and green means paid.

## The bill table

The table shows your bills with these columns:

**Category icon.** A small icon representing the bill's category (utilities, entertainment, insurance, etc.). This provides quick visual identification without taking up space.

**Name.** The bill title appears in bold, with the payment frequency shown below in smaller text. Frequencies display as "Every month," "Every year," or "One-time" rather than technical terms.

**Amount.** The payment amount in your currency. Variable bills show "(estimate)" below the amount to indicate the final amount may differ.

**Due date.** Shows when payment is due using human-readable text. A colored vertical bar on the left indicates the bill's status.

**Actions.** Contains the Log Payment button and a menu with additional actions like viewing payment history or editing the bill.

## Due date display

The due date column shows when a bill is due using everyday language instead of raw dates. The formatted date (like "Wed, Dec 25") appears below as a reference.

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

One-time bills that have been paid show "Paid" instead of the relative date. Recurring bills never show "Paid" because after payment their due date advances to the next billing cycle.

### Status bar colors

The vertical bar on the left edge of the due date cell indicates urgency:

| Color | Meaning |
|-------|---------|
| Red | Overdue. The due date has passed and the bill remains unpaid. |
| Amber | Due soon. The bill is due within the next 30 days. |
| Blue | Due later. The bill is due more than 30 days from now. |
| Green | Paid. For one-time bills that have been paid. |

The bar spans the full height of the cell, making it easy to scan down the column and spot bills needing attention.

## Frequency subtitle

The frequency appears below the bill name using friendly labels:

| Internal value | Display label |
|----------------|---------------|
| once | One-time |
| monthly | Every month |
| yearly | Every year |

This makes the table readable without requiring users to understand database terminology.

## Variable amounts

Bills with variable amounts (like utility bills that change each month) show "(estimate)" below the amount. This signals that the displayed amount is an approximation based on previous payments or your best guess.

The estimate label uses muted styling to avoid visual clutter while still providing important context.

## Logging payments

Click the Log Payment button (banknote icon) on any unpaid bill to record a payment. See the [Logging Payments](./002-auto-pay.md) documentation for details on the payment dialog, partial payments, and how due dates update.

The Log Payment button is disabled for bills already marked as paid.

## Editing bills

Click the three-dot menu on any bill row to access additional actions:

- **View history:** Opens a dialog showing all past payments for this bill
- **Edit:** Opens the bill form to modify title, amount, frequency, category, or tags
- **Delete:** Removes the bill (requires confirmation)

## Edge cases

**No bills.** When you have no bills, the table shows an empty state prompting you to add your first bill.

**Long bill names.** Bill titles truncate gracefully when they exceed the column width. The full title appears in the bill detail panel when you select a row.

**Past-due one-time bills.** One-time bills that are overdue continue showing "Overdue by X days" with a red status bar until you log a payment. Once paid, they show "Paid" with a green bar.

**Future recurring bills.** Recurring bills due far in the future (over 30 days) show a blue status bar to indicate no immediate action is needed.

**Day boundaries.** The system calculates day differences using the start of each day (midnight) to avoid timezone confusion. A bill due at 11pm tonight shows as "Due today" throughout the entire day.

**Month calculations.** The "Due in X months" format uses calendar months. A bill due January 15 viewed on December 15 shows "Due in about 1 month" even though the exact day count might vary.

## Verification

To confirm the Overview screen works:

1. Navigate to the Overview page. You should see a table with five columns.
2. Check that bill names show frequency subtitles like "Every month" below them.
3. Look for any variable bills. They should show "(estimate)" below the amount.
4. Verify overdue bills show "Overdue by X days" with a red status bar.
5. Check that bills due within 30 days show an amber bar.
6. Check that bills due more than 30 days away show a blue bar.
7. Find a paid one-time bill. It should show "Paid" with a green bar.
8. Click the Log Payment button on an unpaid bill. The payment dialog should open.
9. Click the three-dot menu. You should see View History, Edit, and Delete options.

## Future scope

The following features are not included in this version:

- Sorting bills by different columns (amount, due date, name)
- Bulk actions (mark multiple bills as paid)
- Inline editing of bill amounts
- Customizable column visibility
- Export to CSV or PDF

