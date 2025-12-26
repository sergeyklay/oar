# Monthly History View

- **Status:** Draft
- **Last Updated:** 2025-12-27

## Overview

The Monthly History View shows your actual payment history for any month you select. Unlike the [Forecast View](./016-forecast-view.md) which projects future obligations, Monthly History displays what you actually paid in the past. This retrospective view helps you understand your spending patterns, compare year-over-year trends, and validate how well your bill management matches reality.

When you select a month, you see every payment you logged during that period, organized in a table with the bill name, amount paid, and payment date. A chart at the top compares your spending for the current year against the same period from the previous year, making it easy to spot trends like seasonal increases in heating costs or changes in subscription spending.

This aligns with the "Active Payer" philosophy by making your past payment decisions visible and reviewable. You can't improve what you don't measure, and Monthly History provides the measurement. By seeing what you actually paid versus what you projected, you build awareness of your spending patterns and can adjust your bill estimates accordingly.

## Viewing payment history

Navigate to the Monthly History View by clicking "Monthly History" in the sidebar under the Reports section. The page opens showing the current month by default. The layout matches the Forecast View: a chart at the top, a payments table below, and a summary panel on the right side.

The header contains two controls:

**Tag Filter.** Select a tag from the dropdown to filter payments. Only payments for bills with the selected tag appear in both the chart and the table. This lets you analyze spending patterns for specific categories, like seeing how much you spent on utilities versus subscriptions in a given month. Clear the filter to see all payments.

**Sidebar Toggle.** Click to hide the left navigation sidebar and expand the history chart and content area.

Month navigation happens in the summary panel on the right side of the page. The panel header displays the current month and year (for example, "January 2026") with navigation arrows on the right. Click the left arrow to move to the previous month, or the right arrow to move to the next month. The URL updates immediately with `?month=YYYY-MM`, and the page refreshes to show payments for the new month. You can navigate to any past month where you've logged payments, or future months if you've backdated payments.

## The history chart

The chart at the top of the Monthly History View provides a visual comparison of your spending patterns year-over-year. When you select a month, the chart displays 12 bars ending at that month, showing both the current year and the previous year side-by-side for easy comparison. The selected month appears as the rightmost bar, providing a retrospective view of your payment history leading up to that point.

Each month appears as two bars grouped together. The left bar (in the primary theme color) shows "Current Year" - your actual payments for that month in the current year. The right bar (in a muted color) shows "Last Year" - your payments for the same month in the previous year. This side-by-side comparison makes it easy to spot trends like seasonal variations or changes in spending habits.

**Example:** If you select December 2025, the chart shows:
- Current Year bars: January 2025, February 2025, through December 2025 (with December 2025 as the rightmost bar)
- Last Year bars: January 2024, February 2024, through December 2024 (with December 2024 as the rightmost bar)

The bars align by month position, so January 2025 compares directly with January 2024, February 2025 with February 2024, and December 2025 with December 2024. This alignment makes it easy to see if you're spending more or less than the same period last year. The retrospective view ensures all bars represent actual historical data, avoiding empty future months.

Tag filtering affects the chart just like it affects the payments table. When you select a tag, the chart recalculates totals using only payments for bills with that tag. The bars adjust to reflect the filtered amounts, making it easy to see how spending in a specific category (like utilities or subscriptions) varies across months and compares year-over-year.

The X-axis shows abbreviated month names (Dec, Jan, Feb, etc.) for easy scanning. Hovering over any bar reveals a tooltip with formatted currency values for both the current year and last year amounts, using your configured currency and locale settings. The tooltip shows the same totals you'd see if you navigated to that month's detailed view.

The chart updates automatically when you change the selected month. The 12-month window shifts forward or backward to always end at your current selection. If you're viewing January 2026 and switch to June 2026, the chart now shows July 2025 through June 2026 for the current year (with June 2026 as the rightmost bar), and July 2024 through June 2025 for the previous year (with June 2025 as the rightmost bar).

If no payments exist for any of the 12 months in the chart range, the chart displays an empty state message: "No payment data for this period." This can happen when you apply a tag filter that excludes all payments, or when you select a month before you started logging payments.

The chart's compact height (200 pixels) keeps it visible without pushing the detailed payments table too far down the page. This balance ensures you can see both the high-level trend and the detailed breakdown in a single view, supporting the "Active Payer" philosophy by making patterns visible without requiring separate analysis tools.

## The payments table

The payments table appears below the chart, showing every payment you logged during the selected month. Each row displays four columns:

**Category Icon.** A small icon representing the bill's category (house, wifi, zap, etc.). This provides quick visual identification of payment types.

**Bill.** The name of the bill you paid. This matches the bill title you see in other views.

**Amount.** The payment amount in your configured currency format, right-aligned with monospace font for easy scanning. This shows what you actually paid, which may differ from the bill's base amount if you logged a partial payment or paid extra.

**Date.** The date you logged the payment, formatted as "1 December 2025" (day number, full month name, full year). This format makes it easy to see exactly when each payment occurred within the month.

Payments appear in reverse chronological order (newest first), so your most recent payments appear at the top of the list. This ordering helps you see recent activity first when reviewing a month's history.

If no payments exist for the selected month, the table shows an empty state message: "No payments in [Month Year]." The message suggests trying a different month. If you've applied a tag filter, the message changes to "No payments with this tag in [Month Year]" and suggests trying a different tag or month.

## The summary panel

The summary panel appears in the right column of the bottom section, positioned alongside the payments table. The panel header shows the current month and year (for example, "January 2026") with navigation arrows on the right side. Click these arrows to move between months; the left arrow goes to the previous month, and the right arrow goes to the next month. This places month navigation right where you're already looking, making it easy to explore different months without moving your focus away from the summary totals.

Below the header, the panel displays two summary items that update as you change months or filters:

**Payments.** The count of payments logged in the selected month. This appears first in the summary and shows the total number of payments you recorded during that period. If you logged 8 payments in January 2026, it displays "Payments: 8". This count updates automatically when you change months or apply tag filters, giving you immediate context for the total below.

**Total Paid.** The sum of all payment amounts in the selected month. This includes every payment you logged, regardless of whether it was a full payment, partial payment, or extra payment. If you logged 8 payments totaling $1,200, this shows $1,200. This always appears in the summary, helping you see the complete picture of your spending for the month.

All amounts display in your configured currency format. The summary updates immediately when you change months or apply tag filters. The panel's position in the bottom section keeps it visible alongside the detailed payments table, making it easy to compare individual payments with the overall totals.

## Year-over-year comparison

The chart's year-over-year comparison feature helps you identify spending patterns and trends. By showing current year and previous year side-by-side, you can quickly see:

**Seasonal patterns.** Heating costs spike in winter months, cooling costs in summer. The comparison makes these patterns obvious.

**Spending changes.** If you added a new subscription or canceled a service, the comparison shows the impact on your monthly totals.

**Estimation accuracy.** Compare what you actually paid (shown in Monthly History) with what you projected (shown in Forecast View) to improve your bill estimates over time.

The comparison works by aligning months by position, not by calendar year. When you select December 2025, the chart shows January 2025 through December 2025 for the current year (with December 2025 as the rightmost bar), and January 2024 through December 2024 for the previous year (with December 2024 as the rightmost bar). This alignment ensures you're comparing equivalent periods, making trends easier to spot. The retrospective view means all bars represent actual payment history, not empty future months.

If you don't have payment history for the previous year (for example, you just started using Oar), the "Last Year" bars will show zero. As you build payment history over time, the comparison becomes more meaningful.

## Edge cases

**Empty months.** When no payments were logged in the selected month, the table shows an empty state: "No payments in [Month Year]." The summary panel shows "Payments: 0" and "Total Paid" shows zero. The chart may still show data if payments exist in adjacent months within the 12-month window.

**Months with no previous year data.** If you select a month before you started logging payments, or if you don't have payment history for the previous year, the "Last Year" bars in the chart will show zero. This is expected and doesn't indicate an error.

**Tag filtering with no matches.** If you select a tag that has no payments in the selected month, you see an empty state: "No payments with this tag in [Month Year]." The message suggests trying a different tag or month. The chart bars adjust to show zero for months with no matching payments.

**Partial payments.** The table shows the actual amount you logged, which may be less than the bill's base amount if you logged a partial payment. The "Total Paid" in the summary reflects the sum of all logged amounts, not the sum of bill amounts.

**Backdated payments.** If you logged a payment with a date in the past, it appears in the month where that date falls, not the month when you logged it. This ensures the history reflects when payments actually occurred, not when you recorded them.

**Deleted bills.** If you delete a bill, its payment history remains visible in Monthly History as long as the payments were logged. The bill name still appears in the table, but you won't be able to click through to the bill detail panel since the bill no longer exists.

**Future months.** If you navigate to a future month and have backdated payments logged for that month, they will appear. Otherwise, future months show empty states until you log payments for those periods.

**Timezone handling.** Month boundaries are calculated using the server's timezone, which typically aligns with your local timezone. Payments are grouped into months based on their logged date, accounting for timezone differences when determining month boundaries.

## How it differs from other views

**Forecast View.** Shows projected future obligations based on bill definitions and recurrence rules. Monthly History shows actual payments you've logged, focusing on what happened rather than what will happen.

**Paid Recently View.** Shows payments within a configurable lookback period from today, focusing on recent activity. Monthly History shows a complete calendar month regardless of when it occurred, focusing on monthly patterns rather than recency.

**Bill Detail Panel Payment History.** Shows payment history for a single bill. Monthly History shows payments across all bills for a selected month, providing a broader view of your spending patterns.

The key difference is that Monthly History uses actual payment records from your transaction history, while Forecast uses projection logic to show future occurrences. This makes Monthly History unique in its ability to show what you actually spent versus what you projected.

## Verification

To confirm the Monthly History View works correctly:

1. Navigate to the Monthly History page from the sidebar. Verify it opens showing the current month.
2. Use the navigation arrows in the summary panel to select a different month. Verify the URL updates with `?month=YYYY-MM` and the page refreshes.
3. Check that payments you logged for that month appear in the table with the correct bill name, amount, and date.
4. Verify the date column shows dates in "1 December 2025" format (day number, full month name, full year).
5. Review the summary panel. Verify the header shows the current month and year with navigation arrows. Verify "Payments" shows the correct count of payments for the selected month. Verify "Total Paid" sums all payment amounts correctly.
6. Verify the chart displays 12 months ending at the selected month, with the selected month appearing as the rightmost bar. Check that both "Current Year" and "Last Year" bars appear for months where you have payment history.
7. Hover over chart bars to verify tooltips show formatted currency values for both current year and last year amounts.
8. Select a tag from the filter in the header. Verify only payments for bills with that tag appear in the table. Verify the chart bars adjust to reflect the filtered totals.
9. Navigate to a month with no payments. Verify the empty state message appears in the table.
10. Navigate to a month before you started logging payments. Verify the chart shows zero for "Last Year" bars if you don't have previous year data.
11. Check that payments appear in reverse chronological order (newest first) in the table.
12. Verify the chart aligns months by position (January 2025 compares with January 2024, December 2025 compares with December 2024). Verify the selected month appears as the rightmost bar in the chart.

## Related Documents

* [Forecast View](./016-forecast-view.md) - Projecting future financial liabilities by month
* [Paid Recently View](./014-paid-recently-view.md) - Payments made within a configurable lookback period
* [Logging Payments](./002-auto-pay.md) - Recording payments, partial payments, and historical payment detection
* [Editing Payment History](./011-editing-payment-history.md) - Correcting payment mistakes and managing payment records

