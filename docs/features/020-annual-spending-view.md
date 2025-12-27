# Annual Spending View

- **Status:** Draft
- **Last Updated:** 2025-12-27

## Overview

The Annual Spending View provides a high-level perspective on your spending patterns by aggregating all payments for each bill across an entire year. Unlike the [Monthly History View](./017-monthly-history-view.md) which shows individual payments organized by month, Annual Spending groups all payments for each bill within a selected year, calculating totals, averages, and payment counts. This aggregated view helps you identify which bills consume the most resources over time and understand your financial commitments at a yearly scale.

When you select a year, you see a pie chart visualizing spending proportions by bill, a table listing each bill with its aggregated statistics, and a summary panel showing overall totals. The chart and table synchronize interactively: clicking a pie segment highlights the corresponding table row, and clicking a table row highlights the corresponding chart segment. This synchronization makes it easy to connect the visual representation with the detailed numbers.

This view reinforces the "Active Payer" philosophy by providing annual perspective on spending habits. By seeing which bills dominate your yearly spending, you build awareness of where your money goes and can make informed decisions about which bills to prioritize or reduce. The aggregated view complements monthly views by showing patterns that emerge over longer time periods, such as seasonal variations or the cumulative impact of recurring bills.

## Viewing annual spending

Navigate to the Annual Spending View by clicking "Annual Spending" in the sidebar under the Reports section. The page opens showing the current year by default. The layout matches the Monthly History View: a chart at the top, a bills table below, and a summary panel on the right side.

The page header provides access to common controls including the sidebar toggle, Add Bill button, tag filter, and bill search. For details about header controls, see [Page Header](./019-page-header.md).

Year navigation happens in the summary panel on the right side of the page. The panel header displays the current year (for example, "2025") with navigation arrows on the right. Click the left arrow to move to the previous year, or the right arrow to move to the next year. The URL updates immediately with `?year=YYYY`, and the page refreshes to show spending data for the new year. You can navigate to any year where you've logged payments, or future years if you've backdated payments.

## The spending chart

The pie chart at the top of the Annual Spending View visualizes spending proportions by bill for the selected year. Each bill appears as a segment of the pie, with the segment size proportional to that bill's total spending relative to all bills. The chart displays no labels or identifying marks on the segments themselves, keeping the visualization clean and uncluttered.

The chart uses a rotating color palette to distinguish between bills. When you have many bills, colors repeat in a predictable pattern, ensuring each bill has a distinct visual identity. Hovering over any segment reveals a tooltip showing the bill name and formatted total amount, using your configured currency and locale settings.

The chart supports interactive highlighting. When you click a pie segment, the corresponding row in the table below highlights, and the chart segment itself receives a visual emphasis (primary color border and increased opacity). Clicking the same segment again removes the highlight. This synchronization helps you connect the visual representation with the detailed statistics in the table.

If no payments exist for the selected year, the chart displays a neutral-colored circular placeholder. This empty state appears when you navigate to a year before you started logging payments, or when you've applied filters that exclude all payments.

The chart's fixed height (400 pixels) keeps it visible without pushing the detailed bills table too far down the page. This balance ensures you can see both the high-level spending distribution and the detailed breakdown in a single view, supporting the "Active Payer" philosophy by making patterns visible without requiring separate analysis tools.

## The bills table

The bills table appears below the chart, showing aggregated spending data for each bill in the selected year. Each row displays five columns:

**Icon.** A small icon representing the bill's category (house, wifi, zap, etc.). This provides quick visual identification of bill types.

**Name.** The name of the bill. This matches the bill title you see in other views.

**Payments.** The number of payments logged for this bill during the selected year. This count includes all payments regardless of amount, showing how frequently you paid each bill. The number appears right-aligned with monospace font for easy scanning.

**Average.** The average payment amount for this bill during the selected year, calculated by dividing the total amount by the payment count and rounded to the nearest integer. This shows the typical payment size for each bill. The amount appears right-aligned with monospace font in your configured currency format.

**Amount.** The sum of all payment amounts for this bill during the selected year. This represents the total you spent on this bill across all payments in the year. The amount appears right-aligned with monospace font in your configured currency format.

Bills appear sorted by total amount in descending order, so the bills you spent the most on appear at the top. This ordering helps you quickly identify your largest spending categories.

The table supports interactive highlighting. When you click a row, the corresponding segment in the pie chart highlights, and the table row itself receives a visual emphasis (accent background color). Clicking the same row again removes the highlight. This synchronization works in both directions: clicking the chart highlights the table, and clicking the table highlights the chart.

If no payments exist for the selected year, the table shows an empty state message: "No payments in *year*." The message suggests trying a different year. This can happen when you navigate to a year before you started logging payments.

## The summary panel

The summary panel appears in the right column of the bottom section, positioned alongside the bills table. The panel header shows the current year (for example, "2025") with navigation arrows on the right side. Click these arrows to move between years; the left arrow goes to the previous year, and the right arrow goes to the next year. This places year navigation right where you're already looking, making it easy to explore different years without moving your focus away from the summary totals.

Below the header, the panel displays three summary items that update as you change years:

**Total Bills.** The count of distinct bills with payments in the selected year. This appears first in the summary and shows how many different bills you paid during that period. If you logged payments for 12 different bills in 2025, it displays "Total Bills: 12". This count updates automatically when you change years, giving you immediate context for the diversity of your spending.

**Total Payments.** The sum of all payment counts across all bills in the selected year. This shows the total number of payments you logged, regardless of which bill they were for. If you logged 48 payments total across all bills in 2025, it displays "Total Payments: 48". This count helps you understand payment frequency at an annual scale.

**Amount Paid.** The sum of all payment amounts across all bills in the selected year. This includes every payment you logged, regardless of whether it was a full payment, partial payment, or extra payment. If you logged payments totaling $12,000 across all bills in 2025, this shows $12,000. This always appears in the summary with bold formatting and a top border, helping you see the complete picture of your annual spending.

All amounts display in your configured currency format. The summary updates immediately when you change years. The panel's position in the bottom section keeps it visible alongside the detailed bills table, making it easy to compare individual bill totals with the overall annual totals.

## Aggregation logic

The Annual Spending View aggregates payments using specific rules that ensure accurate year-over-year comparisons:

**Year boundaries.** Payments are grouped into years based on their logged date. A payment logged on January 1, 2025 belongs to 2025, while a payment logged on December 31, 2025 also belongs to 2025. The system uses the full calendar year (January 1 through December 31) for aggregation, ensuring consistent boundaries regardless of when you view the data.

**Bill grouping.** All payments for the same bill within a year are grouped together. If you logged 12 payments for "Rent" in 2025, those 12 payments aggregate into a single row in the table. The system identifies bills by their unique bill ID, so even if you rename a bill mid-year, all payments for that bill still group together.

**Amount calculations.** Total amounts sum all payment amounts for each bill using integer arithmetic (minor units). This ensures precision and avoids floating-point rounding errors. Average amounts calculate by dividing the total by the payment count and rounding to the nearest integer. If a bill has 12 payments totaling 120,000 cents ($1,200), the average calculates as 10,000 cents ($100) per payment.

**Sorting.** Bills sort by total amount in descending order, so the largest spending categories appear first. This ordering helps you quickly identify which bills consume the most resources. If two bills have the same total amount, their relative order may vary, but the most significant bills always appear near the top.

**Empty years.** If you navigate to a year with no payments, the chart shows a neutral placeholder, the table shows an empty state message, and the summary shows zeros for all counts and amounts. This is expected behavior and doesn't indicate an error.

## Edge cases

**Empty years.** When no payments were logged in the selected year, the table shows an empty state: "No payments in [Year]." The summary panel shows "Total Bills: 0", "Total Payments: 0", and "Amount Paid" shows zero. The chart displays a neutral-colored circular placeholder.

**Years with partial data.** If you select a year where you only logged payments for some months, the view shows aggregated data for all payments in that year, regardless of which months they occurred in. The aggregation doesn't require a full year of data to function.

**Single payment per bill.** If a bill has only one payment in the selected year, the average amount equals the total amount. The table still shows both columns for consistency, but the values match.

**Zero-amount payments.** If you logged a payment with zero amount (which shouldn't normally happen, but is technically possible), it still counts toward the payment count but doesn't affect the total or average calculations. The aggregation handles zero amounts correctly.

**Deleted bills.** If you delete a bill, its payment history remains visible in Annual Spending as long as the payments were logged. The bill name still appears in the table, but you won't be able to click through to the bill detail panel since the bill no longer exists.

**Renamed bills.** If you rename a bill mid-year, all payments for that bill still group together under the current bill name. The system uses bill IDs for grouping, not bill names, so name changes don't affect aggregation.

**Future years.** If you navigate to a future year and have backdated payments logged for that year, they will appear. Otherwise, future years show empty states until you log payments for those periods.

**Timezone handling.** Year boundaries are calculated using the server's timezone, which typically aligns with your local timezone. Payments are grouped into years based on their logged date, accounting for timezone differences when determining year boundaries.

**Large numbers of bills.** If you have many bills (more than 12), the chart color palette repeats, but each bill still has a distinct visual identity. The table handles any number of bills, with sorting ensuring the most significant spending categories appear first.

## How it differs from other views

**Monthly History View.** Shows individual payments organized by month with year-over-year comparison. Annual Spending aggregates all payments for each bill within a year, showing totals and averages rather than individual payment details. Monthly History focuses on monthly patterns, while Annual Spending focuses on annual patterns.

**Forecast View.** Shows projected future obligations based on bill definitions and recurrence rules. Annual Spending shows actual payments you've logged, focusing on what happened rather than what will happen.

**Paid Recently View.** Shows payments within a configurable lookback period from today, focusing on recent activity. Annual Spending shows a complete calendar year regardless of when it occurred, focusing on annual patterns rather than recency.

**Bill Detail Panel Payment History.** Shows payment history for a single bill. Annual Spending shows payments across all bills for a selected year, providing a broader view of your spending patterns.

The key difference is that Annual Spending uses aggregation to show high-level patterns across an entire year, while other views focus on individual payments or shorter time periods. This makes Annual Spending unique in its ability to show which bills dominate your yearly spending and how payment frequency and amounts vary across bills.

## Verification

To confirm the Annual Spending View works correctly:

1. Navigate to the Annual Spending page from the sidebar. Verify it opens showing the current year.
2. Use the navigation arrows in the summary panel to select a different year. Verify the URL updates with `?year=YYYY` and the page refreshes.
3. Check that bills you paid during that year appear in the table with the correct name, payment count, average amount, and total amount.
4. Verify bills appear sorted by total amount in descending order (largest spending first).
5. Review the summary panel. Verify the header shows the current year with navigation arrows. Verify "Total Bills" shows the correct count of distinct bills. Verify "Total Payments" sums all payment counts correctly. Verify "Amount Paid" sums all payment amounts correctly.
6. Verify the pie chart displays segments for each bill, with segment sizes proportional to spending amounts.
7. Hover over chart segments to verify tooltips show bill names and formatted currency values.
8. Click a pie chart segment. Verify the corresponding table row highlights. Verify the chart segment receives visual emphasis.
9. Click a table row. Verify the corresponding chart segment highlights. Verify the table row receives visual emphasis.
10. Click the same chart segment or table row again. Verify the highlight removes.
11. Navigate to a year with no payments. Verify the empty state message appears in the table. Verify the chart shows a neutral placeholder. Verify the summary shows zeros.
12. Verify the chart displays no labels or identifying marks on segments (only tooltips on hover).
13. Check that average amounts calculate correctly by dividing total amounts by payment counts and rounding to integers.

## Related Documents

* [Monthly History View](./017-monthly-history-view.md) - Reviewing actual payment history with year-over-year comparison
* [Forecast View](./016-forecast-view.md) - Projecting future financial liabilities by month
* [Paid Recently View](./014-paid-recently-view.md) - Payments made within a configurable lookback period
* [Logging Payments](./002-auto-pay.md) - Recording payments, partial payments, and historical payment detection

