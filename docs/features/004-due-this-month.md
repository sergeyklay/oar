# Due This Month Screen

- **Status:** Draft
- **Last Updated:** 2025-12-25
- **Related:** [Overview Screen](./005-overview-screen.md), [Logging Payments](./002-auto-pay.md)

## Overview

The "Due This Month" view shows only unpaid bills due in the current calendar month, including automatic payments. It helps you see your complete financial obligations at a glance and plan cash flow for the month ahead.

Bills you've already paid are automatically excluded, even if their due date falls within the current month. This keeps the view focused on what you still need to pay.

The sidebar navigation displays a summary below the "Due This Month" menu item showing how many unpaid bills are due and the total amount. When variable bills are included, the total shows "(est.)" to indicate the amount may change.

## How it differs from Overview

The [Overview screen](./005-overview-screen.md) shows all your bills, optionally filtered by a specific date or tag. The Due This Month view automatically filters to show only unpaid bills due in the current calendar month.

**Overview:**
- Shows all bills by default
- Includes "Add Bill" button in the header
- Can filter by specific date using calendar navigation

**Due This Month:**
- Shows only unpaid bills due in the current month
- Excludes bills already marked as paid
- No "Add Bill" button (focused view)
- Always shows current month (no date navigation)
- Displays summary stats in sidebar navigation

Both views support tag filtering and show bill details in the right panel when you select a bill.

## Viewing bills due this month

Click "Due This Month" in the sidebar to navigate to the dedicated page. The page displays only unpaid bills sorted by due date, earliest first.

The sidebar menu item shows a summary subtitle:
- **With unpaid bills:** "3 bills - 2345 zł" (or your currency)
- **With variable bills:** "3 bills - 2345 zł (est.)"
- **No unpaid bills:** "No bills"

The "(est.)" indicator appears when any unpaid bill in the current month has variable amounts, signaling the total may change.

## Filtering by tag

You can filter the Due This Month view by tag, the same way you filter the Overview. Select a tag from the dropdown in the header to see only unpaid bills matching that tag within the current month.

The filter combines both conditions: bills must be unpaid, due this month, AND have the selected tag. Clear the tag filter to return to showing all unpaid bills due this month.

## Filtering by date

The calendar panel on the right side lets you filter bills by a specific date within the current month. Click any day in the calendar to see only bills due on that exact date. This narrows your view from the entire month to a single day, helping you focus on what's due on a particular date.

When you click a calendar day, the URL updates to include the selected date (e.g., `?date=2025-12-15`), and the bill list filters to show only bills due on that day. The calendar shows colored dots below dates: red for overdue bills, yellow for pending bills, and green for paid bills.

Clicking the same selected day again clears the date filter and returns to showing all unpaid bills due in the current month. You can also click the "Clear filter" button that appears below the calendar when a date is selected.

**Date filter precedence:** When a date is selected, it takes precedence over the month filter. If you click December 20, you'll see only bills due on December 20, not all bills due in December. This lets you drill down into specific dates while maintaining the monthly context.

## What counts as "this month"

The system uses calendar month boundaries and shows only unpaid bills. A bill is included only if:
1. Its due date falls within the current calendar month (first day at 00:00:00 to last day at 23:59:59)
2. It is not marked as paid

**Included (unpaid bills only):**
- Unpaid bills due on the first day of the month
- Unpaid bills due on the last day of the month
- Unpaid bills due on any day in between
- Automatic payments (auto-pay bills) that haven't been paid yet
- Manual payments that haven't been logged yet
- Bills with status "pending" or "overdue"

**Not included:**
- Bills already marked as paid (even if due date is in current month)
- Bills due in previous months
- Bills due in future months

## Edge cases

**Empty month.** When no unpaid bills are due in the current month, the page shows an empty state message: "No bills due this month." The sidebar shows "No bills" as the subtitle. This includes cases where all bills for the month have already been paid.

**Month boundaries.** Bills due exactly on the first or last day of the month are included. The system uses precise date calculations that account for leap years and varying month lengths.

**Variable bills.** When variable bills exist in the current month, the total amount includes them and shows "(est.)" in both the sidebar and page context. This helps you understand the displayed total may change.

**Timezone handling.** The current month is calculated using the server's timezone. In practice, this aligns with your local month since the server and your device typically share the same timezone context.

**Tag filtering with no matches.** If you select a tag with no unpaid bills due this month, you see an empty list with a message explaining no bills match your filter.

**Paid bills exclusion.** Bills marked as paid are automatically excluded from the Due This Month view, even if their due date falls within the current month. This keeps the view focused on upcoming obligations you still need to handle. Once you log a payment, that bill disappears from this view immediately.

**Date filter with no matches.** When you select a calendar date that has no bills due, the page shows "No bills due on this date" with guidance to try a different date or clear the filter. This helps you distinguish between "no bills this month" and "no bills on this specific date."

## Verification

To confirm the Due This Month feature works:

1. Check the sidebar navigation. You should see "Due This Month" below "Due Soon" with a subtitle showing unpaid bill count and total.
2. Click "Due This Month" to navigate to the page.
3. Verify only unpaid bills due in the current month appear.
4. Check that bills from previous or future months are not shown.
5. Verify bills already marked as paid do not appear, even if their due date is in the current month.
6. Select a tag from the filter dropdown. Only unpaid bills matching both the tag and current month should appear.
7. Click a date in the calendar. Verify the bill list filters to show only bills due on that date.
8. Verify the URL updates with the selected date parameter.
9. Click the same date again or click "Clear filter." Verify the date filter clears and all unpaid bills due this month reappear.
10. Click a bill to open its detail in the right panel.
11. Log a payment for a bill in the current month. Verify it disappears from the Due This Month view immediately.
12. Verify the sidebar subtitle updates when bills change (after logging payments or adding new bills).
