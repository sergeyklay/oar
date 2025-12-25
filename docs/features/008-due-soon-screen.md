# Due Soon Screen

- **Status:** Draft
- **Last Updated:** 2025-12-25
- **Related:** [Due This Month Screen](./004-due-this-month.md), [Overview Screen](./005-overview-screen.md)

## Overview

The Due Soon screen answers one question: "What needs my attention right now?" While the [Due This Month](./004-due-this-month.md) view shows your full monthly picture, Due Soon narrows the focus to imminent obligations.

The range is configurable. Set it to 3 days for tight weekly reviews, or stretch it to 30 days for monthly planning sessions. This flexibility lets you tune the view to match your personal financial rhythm.

## How it differs from Due This Month

Both screens filter for unpaid bills, but they use different time windows:

**Due This Month:**
- Fixed to the current calendar month (1st through last day)
- Scope never changes; the month determines visibility
- Ideal for monthly budgeting and cash flow planning

**Due Soon:**
- Uses a rolling window from today forward
- Configurable from 0 to 30 days in Settings
- Adapts to your preferred review frequency

A bill due in 10 days appears on Due Soon if your range is set to 14 days, but disappears if you shrink the range to 7. The same bill always appears on Due This Month as long as it falls within the current calendar month.

## Configuring the range

Navigate to Settings > Behavior Options to adjust the "Due Soon Range" preference. Available options:

| Setting | Subtitle displays as |
|---------|---------------------|
| 0 | Today |
| 1 | Today or tomorrow |
| 3 | In next 3 days |
| 5 | In next 5 days |
| 7 | In next 7 days (default) |
| 10 | In next 10 days |
| 14 | In next 14 days |
| 20 | In next 20 days |
| 30 | In next 30 days |

The setting takes effect immediately. The sidebar subtitle and Due Soon page content both update to reflect your new range.

## Viewing bills due soon

Click "Due Soon" in the sidebar to open the page. The page displays unpaid bills within your configured range.

The sidebar menu item shows a summary:
- **With unpaid bills:** "3 bills - 1250 zl" (or your currency)
- **With variable bills:** "3 bills - 1250 zl (est.)"
- **No upcoming bills:** "No bills"

Bills appear sorted by due date, earliest first. The view excludes paid bills; once you log a payment, the bill either disappears (if it advanced past your range) or updates to show its new due date.

## What counts as "due soon"

The system calculates the range using these rules:

1. Start from today at midnight (00:00:00)
2. End at the selected range day at 23:59:59
3. Include all unpaid bills with due dates in this window
4. Exclude bills marked as paid

When range is set to 0 (Today), only bills due today appear.

Setting it to 1 (Today or tomorrow) shows bills due within the next two days.

At the default of 7 days, bills due within the next week are visible, including both today and the 7th day.

For example, if today is December 21 and your range is 7:
- A bill due December 21 appears (today)
- A bill due December 28 appears (7th day)
- A bill due December 29 does not appear (outside range)

## Filtering by tag

You can filter the Due Soon view by tag, the same way you filter the Overview. Select a tag from the dropdown in the header to see only unpaid bills matching that tag within your configured range.

The filter combines both conditions: bills must be unpaid, within the range, and have the selected tag.

## Filtering by date

The calendar panel on the right side lets you filter bills by a specific date. Click any day in the calendar to see only bills due on that exact date. This narrows your view from the configured range to a single day, helping you focus on what's due on a particular date.

When you click a calendar day, the URL updates to include the selected date (e.g., `?date=2025-12-15`), and the bill list filters to show only bills due on that day. The calendar shows colored dots below dates: red for overdue bills, yellow for pending bills, and green for paid bills.

Clicking the same selected day again clears the date filter and returns to showing all bills within your configured range. You can also click the "Clear filter" button that appears below the calendar when a date is selected.

**Date filter precedence:** When a date is selected, it takes precedence over your configured range setting. If your range is set to 7 days but you click December 20, you'll see only bills due on December 20, not all bills due within the next 7 days. This lets you drill down into specific dates while maintaining the flexibility of your range setting.

## Edge cases

**Range of 0.** When set to "Today," only bills due today appear. If none are due, you see an empty state. This is useful for daily payment reviews.

**Overdue bills included.** Bills already overdue (due date before today) are included in the Due Soon view. These need your attention, so they stay visible regardless of the range setting.

**Variable bills.** When variable bills exist in the range, the total amount shows "(est.)" in both the sidebar and page context.

**Range change mid-session.** If you change the range in Settings, the Due Soon view updates on your next navigation. The sidebar subtitle also updates to reflect the new count.

**Bills at range boundary.** A bill due exactly on the last day of your range is included. If your range is 7 and a bill is due 7 days from today, it appears in the list.

**Empty range.** When no unpaid bills fall within your range, the page shows "No bills due soon" and the sidebar shows "No bills."

**Paid Recently interaction.** The Paid Recently view in the sidebar shows your logged payments from the past few days. Due Soon shows unpaid bills. These views don't overlap, but a bill can appear on Due Soon while its past payments appear in Paid Recently if you've made partial payments.

**Date filter with no matches.** When you select a calendar date that has no bills due, the page shows "No bills due on this date" with guidance to try a different date or clear the filter. This helps you distinguish between "no bills in range" and "no bills on this specific date."

## Verification

To confirm the Due Soon feature works:

1. Check the sidebar navigation. You should see "Due Soon" below "Overview" with a subtitle showing the bill count and total for your configured range.
2. Click "Due Soon" to navigate to the page.
3. Check that only unpaid bills within your range appear.
4. Go to Settings > Behavior Options and change the Due Soon Range.
5. Return to Due Soon. The visible bills should reflect the new range.
6. Select a tag from the filter dropdown. Only matching bills within the range should appear.
7. Click a date in the calendar. Verify the bill list filters to show only bills due on that date.
8. Verify the URL updates with the selected date parameter.
9. Click the same date again or click "Clear filter." Verify the date filter clears and all bills within your range reappear.
10. Log a payment for a bill in the range. Verify it either disappears or updates based on its next due date.

