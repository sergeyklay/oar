# Forecast View

- **Status:** Draft
- **Last Updated:** 2025-12-26

## Overview

The Forecast View lets you project future financial liabilities by selecting any month and seeing all bills that would be due in that period. Unlike reactive views like "Due Soon" or "Due This Month" that show what's happening now, Forecast provides proactive planning capabilities.

When you select a future month like June 2026, the system doesn't query for existing records. Instead, it projects forward from your current bill definitions using recurrence rules. A monthly rent bill due January 15 will appear in every future month on the 15th, even though those future occurrences don't exist in the database yet. This projection approach is what makes Forecast different from other views.

The view also handles two special cases that require calculation rather than simple lookup. Variable bills like electricity get estimated amounts based on your payment history. Long-term bills like annual insurance show an "Amount to Save" calculation that breaks down the yearly cost into monthly portions. Together, these features help you understand not just what's due, but what you should be setting aside each month.

This aligns with the "Active Payer" philosophy by making future obligations visible and requiring conscious planning decisions. You must actively navigate to different months and review projections. The system doesn't automate payments or remove awareness; it enhances awareness through visibility.

## How projection works

Oar uses a "generated instances" model. When you create a bill, you define its recurrence pattern, not its individual occurrences. A monthly bill due January 15 doesn't create 12 separate records for each month of the year. Instead, the system calculates occurrences on demand.

The Forecast View uses this model to project future months. When you select June 2026, the system:

1. Fetches all active bill definitions (not filtered by date)
2. For each bill, uses RRule to calculate whether it has an occurrence in June 2026
3. If an occurrence exists, creates a virtual projection with the calculated due date
4. Enriches the projection with estimates (for variable bills) and amortization (for long-term bills)
5. Displays the projected bills as if they were real records

This means you can forecast any month, even years in the future, without the database needing to store every possible occurrence. The projection happens in memory using the same recurrence engine that advances bills after payments.

**Example:** You have a quarterly bill due March 10. When you select June 2026 in Forecast, the system calculates that the next occurrence after March 10 would be June 10, 2026. It projects a bill with due date June 10, 2026, even though no payment has been logged yet and no database record exists for that date.

## Viewing forecast data

Navigate to the Forecast View by clicking "Forecast" in the sidebar. The page opens showing the current month by default. The header contains two controls:

**Tag Filter.** Select a tag from the dropdown to filter bills. Only bills with the selected tag that have occurrences in the chosen month will appear. This works the same as tag filtering in other views. Clear the filter to see all bills.

**Sidebar Toggle.** Click to hide the left navigation sidebar and expand the forecast chart and content.

Month navigation happens in the summary panel on the right side of the page. The panel header displays the current month and year (for example, "January 2026") with navigation arrows on the right. Click the left arrow to move to the previous month, or the right arrow to move to the next month. The URL updates immediately with `?month=YYYY-MM`, and the page refreshes to show projected bills for the new month. You can navigate to past months to review what should have been due, or future months to plan ahead.

The main content area uses a vertical layout that maximizes the chart display. The forecast chart occupies the full width at the top, with no rounded corners and a flush connection to the section below. Below the chart, a two-column section displays the bills table on the left and the summary panel on the right. This layout maximizes chart width and positions the summary totals alongside the bill list.

## The forecast chart

The chart at the top of the Forecast View provides a visual overview of your projected financial liabilities over the next 12 months. Unlike the detailed bill list below, which shows individual bills for a single month, the chart summarizes totals across multiple months so you can quickly spot patterns and plan ahead.

When you select a month in the Forecast View, the chart displays 12 bars starting from that month. Each bar represents one month's projected financial burden, shown as two side-by-side bars grouped together. The left bar (in the primary theme color) shows "Amount Due" - the total of all direct payments projected for that month. The right bar (in a muted color) shows "Amount to Save" - the total amortized portions for long-term bills that you should be setting aside monthly.

This two-bar grouping helps you distinguish between immediate payments and savings obligations. A month with a tall "Amount Due" bar but short "Amount to Save" bar means you'll have high direct payments but fewer long-term savings requirements. The opposite pattern shows months when you should focus on building reserves for upcoming large bills.

Tag filtering affects the chart just like it affects the bill list. When you select a tag, the chart recalculates totals using only bills with that tag. The bars adjust to reflect the filtered amounts, making it easy to see how a specific category of bills (like utilities or subscriptions) varies across months.

The X-axis shows abbreviated month names (Jan, Feb, Mar, etc.) for easy scanning. Hovering over any bar reveals a tooltip with formatted currency values for both the "Amount Due" and "Amount to Save" amounts, using your configured currency and locale settings. The tooltip shows the exact same totals you'd see if you navigated to that month's detailed view.

The chart updates automatically when you change the selected month. The 12-month window shifts forward or backward to always start from your current selection. If you're viewing January 2026 and switch to June 2026, the chart now shows June 2026 through May 2027, keeping you focused on the planning horizon ahead of your selected month.

If no bills are projected for any of the 12 months in the chart range, the chart displays an empty state message: "No bills projected for this period." This can happen when you apply a tag filter that excludes all bills, or when you select a month far in the future after all your bills have end dates.

The chart's compact height (200 pixels) keeps it visible without pushing the detailed bill list too far down the page. This balance ensures you can see both the high-level trend and the detailed breakdown in a single view, supporting the "Active Payer" philosophy by making patterns visible without requiring separate navigation or analysis tools.

## Understanding estimated amounts

Variable bills like electricity or heating don't have fixed amounts. The Forecast View estimates these amounts using your payment history. Two strategies work together to provide the best estimate:

**Historical Month Strategy.** For seasonal bills, this looks at what you paid in the same month last year. If you're forecasting June 2026, it checks your June 2025 payments. This works well for bills that follow seasonal patterns, like heating costs that spike in winter.

**Average Last Three Payments Strategy.** If no historical month data exists, the system falls back to averaging your last three payments. This provides a general-purpose estimate for bills without strong seasonal patterns.

If neither strategy has enough data, the system uses the bill's base amount as a fallback. The estimate always appears with visual distinction (muted text or italic styling) so you know it's a projection, not a certainty.

The estimation happens automatically when you select a month. The system queries your transaction history, applies the strategies, and displays the estimated amount alongside fixed bills. You don't need to configure anything; it just works based on your payment patterns.

## Understanding amortization

Long-term bills like annual insurance or quarterly taxes create a planning challenge. A $1,200 annual bill due in December doesn't mean you only need money in December; you should be setting aside $100 each month to avoid a cash crunch.

The Forecast View calculates this "Amount to Save" automatically. For any bill with a recurrence longer than one month, it divides the bill amount by the number of months in the recurrence period:

- Quarterly bill ($300 every 3 months) = $100 per month to save
- Annual bill ($1,200 every 12 months) = $100 per month to save
- Bi-monthly bill ($200 every 2 months) = $100 per month to save

This calculation appears in the "Amount to Save" column for each qualifying bill. The summary panel shows a "Total to Save" that sums all these monthly portions. The "Grand Total" combines "Total Due" (direct payments this month) with "Total to Save" (monthly portions for future bills) to show your complete monthly financial burden.

**Important:** This is steady-state amortization. It assumes ideal monthly savings and doesn't handle catch-up scenarios. If you're starting mid-cycle or missed previous months, the calculation still shows the ideal monthly amount. Future enhancements may add catch-up logic, but for now, this provides a baseline for planning.

## The summary panel

The summary panel appears in the right column of the bottom section, positioned alongside the bills table. The panel header shows the current month and year (for example, "January 2026") with navigation arrows on the right side. Click these arrows to move between months; the left arrow goes to the previous month, and the right arrow goes to the next month. This places month navigation right where you're already looking, making it easy to explore different months without moving your focus away from the summary totals.

Below the header, the panel displays four summary items that update as you change months or filters:

**Bills Due.** The count of projected bills for the selected month. This appears first in the summary and shows the total number of bills that have occurrences in the chosen period. If you're viewing January 2026 and 10 bills are projected for that month, it displays "Bills Due: 10". This count updates automatically when you change months or apply tag filters, giving you immediate context for the totals below.

**Total Due.** The sum of all direct payments due in the selected month. This includes both fixed amounts and estimated amounts for variable bills. If you have 5 bills totaling $500, this shows $500.

**Total to Save.** The sum of all amortized monthly portions. If you have a $1,200 annual bill and a $300 quarterly bill, this shows $125 ($100 + $25). This always appears in the summary, helping you see the complete picture of your monthly financial obligations.

**Grand Total.** The sum of Total Due and Total to Save. This represents your complete monthly financial burden: what you'll pay directly this month plus what you should be setting aside for future bills.

All amounts display in your configured currency format. The summary updates immediately when you change months or apply tag filters. The panel's position in the bottom section keeps it visible alongside the detailed bill list, making it easy to compare individual bills with the overall totals.

## Edge cases

**Empty months.** When no bills have occurrences in the selected month, the table shows an empty state: "No bills due in [Month Year]." The summary panel shows "Bills Due: 0" and all monetary totals show zero. This happens when you select a month when none of your recurring bills fall, or when tag filtering excludes all bills.

**Bills with end dates.** If a bill has an end date that falls before the selected month, it won't appear in the forecast. The projection logic checks end dates and skips bills that have already concluded. For example, a bill ending March 31 won't appear in April projections.

**One-time bills.** Bills with "Never" repeat interval only appear if their specific due date falls within the selected month. They don't project forward like recurring bills. If you have a one-time bill due June 15, it appears in June but not in July or any other month.

**Variable bills with no history.** When a variable bill has no payment history, the system uses its base amount as the estimate. The amount still shows as estimated (with visual distinction) so you know it's a projection. As you log payments, future forecasts will use those payments to improve estimates.

**Small amortization amounts.** For bills with long recurrence periods or small amounts, the monthly "Amount to Save" may round to cents. For example, a $1 bill every 12 months rounds to $0.08 per month. The system always rounds to the nearest cent (minor unit), preserving fractional amounts.

**Month boundaries and leap years.** The projection logic handles month boundaries correctly, including leap years. A bill due February 29 in a leap year projects correctly to the next occurrence, even if the next year isn't a leap year (it moves to February 28 or March 1, depending on the recurrence pattern).

**Tag filtering with no matches.** If you select a tag that has no bills with occurrences in the selected month, you see an empty state: "No bills with this tag in [Month Year]." The message suggests trying a different tag or month.

**Future months beyond bill end dates.** When projecting far into the future, bills with end dates automatically stop appearing once their end date passes. You don't need to manually remove them; the projection logic respects the end date you configured when creating the bill.

**Timezone handling.** Month boundaries are calculated using the server's timezone, which typically aligns with your local timezone. The projection uses precise date calculations that account for timezone differences when determining month boundaries.

## How it differs from other views

**Overview View.** Shows all bills by default, can filter by specific date, includes "Add Bill" button. Forecast shows only projected occurrences for a selected month, no date filtering, focused on planning rather than management.

**Due This Month.** Shows only unpaid bills due in the current calendar month, excludes paid bills, always shows current month. Forecast can show any month (past or future), includes all bills (paid status doesn't matter for projections), focuses on planning rather than immediate obligations.

**Due Soon.** Shows bills within a configurable time range from today, focuses on immediate upcoming obligations. Forecast shows a complete calendar month regardless of how far in the future, focuses on monthly planning rather than urgency.

The key difference is that Forecast uses projection logic to show future occurrences that don't exist in the database yet, while other views query for existing records. This makes Forecast unique in its ability to plan months or years ahead.

## Verification

To confirm the Forecast View works correctly:

1. Navigate to the Forecast page from the sidebar. Verify it opens showing the current month.
2. Use the navigation arrows in the summary panel to select a future month (e.g., 6 months ahead). Verify the URL updates with `?month=YYYY-MM` and the page refreshes.
3. Check that recurring bills appear with projected due dates in that month. A monthly bill should appear on the same day of the month.
4. Verify variable bills show estimated amounts with visual distinction (muted or italic styling).
5. Check that long-term bills (quarterly, annual) show "Amount to Save" in the dedicated column.
6. Review the summary panel. Verify the header shows the current month and year with navigation arrows. Verify "Bills Due" shows the correct count of projected bills for the selected month. Verify "Total Due" sums all bill amounts, "Total to Save" sums amortization amounts, and "Grand Total" combines both.
7. Select a tag from the filter in the header. Verify only bills with that tag appear in the selected month. Verify the chart bars adjust to reflect the filtered totals.
8. Verify the "Amount to Save" column always appears in the bill list, and estimate indicators always show for variable bills.
9. Verify the forecast chart displays 12 months starting from the selected month. Hover over bars to verify tooltips show formatted currency values for both "Amount Due" and "Amount to Save" amounts.
10. Select a month when no bills have occurrences. Verify the empty state message appears in both the chart and the bill list.
11. Select a past month using the navigation arrows. Verify bills that should have been due in that month appear correctly.
12. Check a bill with an end date. Select a month after the end date. Verify the bill doesn't appear.
13. Verify one-time bills only appear in their specific due month, not in other months.

## Related Documents

* [Overview View](./005-overview-view.md) - The main view for managing all bills
* [Due This Month View](./004-due-this-month.md) - Bills due in the current calendar month
* [Recurrence Engine](./001-recurrence-engine.md) - How recurring and one-time payments advance
* [Organizing Bills with Tags](./003-organizing-bills-with-tags.md) - Categorizing bills with tags

