# Paid Recently Screen

- **Status:** Draft
- **Last Updated:** 2025-12-25

## Overview

The Paid Recently screen shows payments you've logged within a configurable lookback period. Unlike bill views that focus on upcoming obligations, this screen looks backward to show what you've already paid. It helps you track your payment activity and verify that payments were recorded correctly.

The range is configurable from 0 to 30 days, letting you adjust how far back you want to see. Set it to 3 days for a tight view of recent activity, or stretch it to 30 days for a broader payment history review.

## How it differs from bill views

Bill views like Overview, Due Soon, and Due This Month show unpaid bills - what you still need to pay. The Paid Recently screen shows completed payments - what you've already paid. These views complement each other: one shows obligations, the other shows completed transactions.

**Bill views:**
- Show unpaid bills with due dates
- Focus on upcoming obligations
- Use colored status indicators (red, amber, blue, green)
- Calendar shows bill status dots

**Paid Recently:**
- Shows completed payments with payment dates
- Focuses on past activity
- No status indicators (payments are complete)
- Calendar shows white dots only on days with payments

## Configuring the range

Navigate to Settings > Behavior Options to adjust the "Paid Recently Range" preference. Available options:

| Setting | Subtitle displays as |
|---------|---------------------|
| 0 | Today |
| 1 | Today or yesterday |
| 3 | Last 3 days |
| 5 | Last 5 days |
| 7 | Last 7 days (default) |
| 10 | Last 10 days |
| 14 | Last 14 days |
| 20 | Last 20 days |
| 30 | Last 30 days |

The setting takes effect immediately. The page content updates to reflect your new range.

## Viewing recent payments

Click "Paid Recently" in the sidebar to open the page. The page displays payments within your configured range.

The page displays a table with four columns:

**Category icon.** A small icon representing the bill's category, providing visual identification.

**Name.** The bill title appears in bold, showing which bill the payment was for.

**Amount Paid.** The payment amount in your currency. This may differ from the bill's base amount if you made a partial payment.

**Payment Date.** Shows when the payment was made using a formatted date (like "Mon, Dec 15"). If you added notes when logging the payment, they appear below the date in smaller text.

Payments appear sorted by payment date, most recent first. This puts your latest activity at the top, making it easy to see what you've paid recently.

## What counts as "paid recently"

The system calculates the range using these rules:

1. Start from the selected range days ago at midnight (00:00:00)
2. End at today at 23:59:59
3. Include all payments with `paidAt` dates in this window

When range is set to 0 (Today), only payments made today appear.

Setting it to 1 (Today or yesterday) shows payments made within the last two days.

At the default of 7 days, payments made within the last week are visible, including both today and payments from 7 days ago.

For example, if today is December 21 and your range is 7:
- A payment made December 21 appears (today)
- A payment made December 15 appears (7 days ago)
- A payment made December 14 does not appear (outside range)

## Filtering by date

The calendar panel on the right side lets you filter payments by a specific date. Click any day in the calendar to see only payments made on that exact date. This narrows your view from the configured range to a single day, helping you focus on payments made on a particular date.

When you click a calendar day, the URL updates to include the selected date (e.g., `?date=2025-12-15`), and the payment list filters to show only payments made on that day. The calendar shows white dots below dates that have payments. These dots appear only on days where at least one payment was made, and they're always white regardless of the bill's status or category.

Clicking the same selected day again clears the date filter and returns to showing all payments within your configured range. You can also click the "Clear filter" button that appears below the calendar when a date is selected.

**Date filter precedence:** When a date is selected, it takes precedence over your configured range setting. If your range is set to 7 days but you click December 15, you'll see only payments made on December 15, not all payments from the last 7 days. This lets you drill down into specific dates while maintaining the flexibility of your range setting.

**Calendar dot behavior:** The calendar on Paid Recently uses a different visual style than bill views. Instead of colored dots indicating bill statuses (red for overdue, yellow for pending, green for paid), it shows white dots only on days where payments occurred. Days without payments show no dots at all. This visual distinction reinforces that you're viewing payment history, not bill statuses.

## Edge cases

**Range of 0.** When set to "Today," only payments made today appear. If none were made today, you see an empty state. This is useful for daily payment verification.

**Empty range.** When no payments fall within your range, the page shows "No payments in this time range" with guidance that payments will appear when you log them on your bills.

**Range change mid-session.** If you change the range in Settings, the Paid Recently view updates on your next navigation to reflect the new range.

**Payments at range boundary.** A payment made exactly on the boundary day of your range is included. If your range is 7 and a payment was made 7 days ago, it appears in the list.

**Date filter with no matches.** When you select a calendar date that has no payments, the page shows "No payments in this time range" (the same message as an empty range). You can distinguish between "no payments in your configured range" and "no payments on this specific date" by checking whether a date is selected in the calendar. If you see the "Clear filter" button below the calendar, you're viewing a filtered date with no payments. If there's no filter button, you're viewing your full range with no payments.

**Partial payments.** If you made multiple partial payments for the same bill, each payment appears as a separate row in the list. This gives you a complete record of all payment activity, even when payments were split across multiple transactions.

**Payment notes.** When you log a payment with notes, those notes appear below the payment date in the table. This helps you remember context about specific payments, like account numbers or payment methods.

**Timezone handling.** Payment dates are stored in UTC and displayed in your local timezone. The date filtering uses your local timezone to determine which payments fall on the selected date.

## Verification

To confirm the Paid Recently feature works:

1. Log a payment for a bill using the Bill Detail Panel.
2. Check the sidebar navigation. You should see "Paid Recently" in the Reports section.
3. Click "Paid Recently" to navigate to the page.
4. Verify the payment you logged appears in the list.
5. Check that the payment date, amount, and bill name are correct.
6. Go to Settings > Behavior Options and change the Paid Recently Range.
7. Return to Paid Recently. The visible payments should reflect the new range.
8. Verify payments outside the new range no longer appear.
9. Click a date in the calendar that has payments. Verify the list filters to show only payments made on that date.
10. Verify white dots appear on calendar days that have payments.
11. Verify no dots appear on days without payments.
12. Click the same date again or click "Clear filter." Verify the date filter clears and all payments within your range reappear.
13. Click a date with no payments. Verify the empty state message appears.

## Related Documents

* [Due Soon Screen](./008-due-soon-screen.md) - Bills due within a configurable time range
* [Logging Payments](./002-auto-pay.md) - Recording payments, partial payments, and historical payment detection

