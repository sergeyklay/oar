# Due Soon Screen

- **Status:** Draft
- **Last Updated:** 2025-12-21
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

The setting takes effect immediately. The sidebar subtitle and Due Soon page both update to reflect your new range.

## Viewing bills due soon

Click "Due Soon" in the sidebar to open the page. The header shows your current range setting as a subtitle (like "In next 7 days").

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

**Range of 0 (Today):** Shows only bills due today.

**Range of 1 (Today or tomorrow):** Shows bills due today or tomorrow.

**Range of 7 (default):** Shows bills due within the next week, including today and the 7th day.

For example, if today is December 21 and your range is 7:
- A bill due December 21 appears (today)
- A bill due December 28 appears (7th day)
- A bill due December 29 does not appear (outside range)

## Filtering by tag

You can filter the Due Soon view by tag, the same way you filter the Overview. Select a tag from the dropdown in the header to see only unpaid bills matching that tag within your configured range.

The filter combines both conditions: bills must be unpaid, within the range, AND have the selected tag.

## Edge cases

**Range of 0.** When set to "Today," only bills due today appear. If none are due, you see an empty state. This is useful for daily payment reviews.

**Overdue bills included.** Bills already overdue (due date before today) are included in the Due Soon view. These need your attention, so they stay visible regardless of the range setting.

**Variable bills.** When variable bills exist in the range, the total amount shows "(est.)" in both the sidebar and page context.

**Range change mid-session.** If you change the range in Settings, the Due Soon view updates on your next navigation. The sidebar subtitle also updates to reflect the new count.

**Bills at range boundary.** A bill due exactly on the last day of your range is included. If your range is 7 and a bill is due 7 days from today, it appears in the list.

**Empty range.** When no unpaid bills fall within your range, the page shows "No bills due soon" and the sidebar shows "No bills."

**Paid Recently interaction.** There's no overlap with the [Paid Recently](./004-due-this-month.md) screen. Due Soon shows unpaid bills; Paid Recently shows logged payments. A bill can appear on both if it's due soon and you've made partial payments.

## Verification

To confirm the Due Soon feature works:

1. Check the sidebar navigation. You should see "Due Soon" below "Overview" with a subtitle showing the bill count and total for your configured range.
2. Click "Due Soon" to navigate to the page.
3. Verify the page subtitle matches your range setting (e.g., "In next 7 days").
4. Check that only unpaid bills within your range appear.
5. Go to Settings > Behavior Options and change the Due Soon Range.
6. Return to Due Soon. The page subtitle and visible bills should reflect the new range.
7. Select a tag from the filter dropdown. Only matching bills within the range should appear.
8. Log a payment for a bill in the range. Verify it either disappears or updates based on its next due date.

