# Archive View

- **Status:** Draft
- **Last Updated:** 2025-12-25

## Overview

Financial commitments don't always disappear when they're no longer active. A subscription you paused, a service you cancelled, or a bill that ended might be something you want to reference later or reactivate. The Archive page preserves this history without cluttering your active bill views.

The Archive maintains the Active Payer philosophy by keeping archived bills accessible but distinct. Unarchiving a bill requires a conscious decision - you must navigate to the Archive, find the bill, and explicitly choose to restore it. This intentional friction prevents accidental reactivation while keeping your financial history at hand.

## Why archive exists

Active bill views focus on what needs your attention now. The Overview view shows all active bills, Due Soon highlights imminent obligations, and Due This Month displays your monthly commitments. Archived bills don't belong in these views because they represent past or paused commitments.

The Archive serves as a dedicated space for bills that are temporarily or permanently inactive. Whether you manually archived a bill because you paused a subscription, or it was automatically archived when it ended (if you configured the "After a Bill Ends" setting to "Move to the Archive"), the Archive keeps them organized and accessible.

## Accessing the Archive

The Archive appears in the sidebar under the Reports section, below the Forecast item. Clicking "Archive" navigates to the dedicated Archive page at `/archive`. The sidebar menu item displays the count of archived bills as a subtitle (e.g., "5 bills" or "No bills" if your archive is empty).

## Archive page layout

The Archive page uses the same table structure as other bill views, maintaining consistency across the interface. The table displays four columns:

**Category icon.** The same small icon representing the bill's category appears here, providing visual continuity.

**Name.** The bill title appears in bold, with the repeat interval and payment mode shown below (e.g., "Every month • Manual").

**Amount.** The payment amount displays in your currency. Variable bills show "(estimate)" below the amount, like in active views.

**Due date.** This column displays "Never" as the main text, with "Archived" as the subtitle. This consistent labeling signals that archived bills have no active due date, regardless of their original due date value.

## Visual design

Archived bills use a muted visual treatment to reinforce their inactive status. The due date column shows "Never" and "Archived" instead of relative dates, and the status bar (the colored vertical indicator) appears in a neutral gray rather than the urgency-based colors used for active bills.

The calendar panel still appears on the right side, but it serves a different purpose here. Payment day indicators (colored dots) are completely disabled on the Archive page. No dots appear below any dates, regardless of whether archived bills were originally due on those dates or whether payments were made on those dates. This visual distinction reinforces that archived bills are inactive and have no active due dates.

Clicking calendar days has no effect on the Archive view - the page always shows all archived bills regardless of the selected date. The calendar remains functional for month navigation and highlighting the current day, maintaining interface consistency. The date filter feedback message (the "Showing bills for..." text) is also hidden on the Archive page, since date filtering doesn't apply to archived bills.

## Filtering archived bills

You can filter archived bills by tag using the tag filter dropdown in the page header. This works the same way as filtering on other bill views: select a tag to see only archived bills that have that tag assigned. This helps when you have many archived bills and want to find specific ones, like all archived utility bills or subscription services.

## Bill detail panel for archived bills

Clicking an archived bill row opens the standard Bill Detail Panel, but with important modifications that reflect the bill's archived state:

**Due date display.** The panel shows "Never / Archived" in the date section instead of relative dates or formatted dates. The subtitle below shows "Archived" to reinforce the status.

**Action buttons.** The "Log Payment" and "Skip" buttons are hidden. Archived bills are inactive, so these actions don't apply. The panel focuses on review and restoration rather than payment management.

**Unarchive button.** The "Archive" button at the bottom of the panel becomes "Unarchive" for archived bills. Clicking it restores the bill to active status, moving it back to your active bill views.

**Visual styling.** The header uses a neutral muted background instead of urgency-based colors (red, amber, blue, or green). The title and amount text use readable gray tones rather than white text on colored backgrounds, maintaining visual clarity for inactive items.

## Unarchiving bills

Unarchiving a bill restores it to active status immediately. The system updates the bill's `isArchived` flag to `false`, and the bill reappears in your active views based on its due date and status.

After unarchiving:

1. **The bill disappears from the Archive page.** It no longer appears in the archived bills list.
2. **The sidebar count updates.** The Archive menu item subtitle decreases by one (e.g., from "5 bills" to "4 bills").
3. **The bill appears in active views.** Depending on its due date, it may appear in Overview, Due Soon, or Due This Month.
4. **The detail panel closes.** The panel automatically closes after successful unarchive, returning focus to the Archive page.
5. **A success notification appears.** A toast message confirms the bill was unarchived (e.g., "Bill unarchived - 'Netflix Subscription' has been unarchived").

The bill's original data remains intact. Its due date, amount, frequency, tags, and payment history are all preserved. Unarchiving makes it active again, as if you had never archived it.

## Manual vs automatic archiving

Bills can reach the Archive through two paths:

**Manual archiving.** You can archive any bill from the Bill Detail Panel by clicking the "Archive" button. This immediately moves the bill to the Archive, removing it from active views. This is useful for bills you want to pause temporarily, like a subscription you're taking a break from.

**Automatic archiving.** When a bill ends (fully paid one-time bill or recurring bill that reaches its end date), it can be automatically archived if you've configured the "After a Bill Ends" setting to "Move to the Archive." See [After a Bill Ends Setting](./012-after-a-bill-ends-setting.md) for details on this behavior.

Both paths lead to the same Archive view. The Archive doesn't distinguish between manually and automatically archived bills - they all appear together in the same list, and you can unarchive any of them with the same action.

## Edge cases

**Empty archive.** When you have no archived bills, the Archive page shows "No archived bills" with the subtitle "Archived bills will appear here." The sidebar shows "No bills" as the subtitle.

**Tag filtering with no matches.** If you filter by a tag that no archived bills have, the page shows "No bills with this tag" with guidance to try a different filter or clear it.

**Unarchiving a bill with past due date.** When you unarchive a bill whose due date has passed, it immediately appears in your active views as overdue. The bill's urgency status returns based on its due date, not its archive status.

**Calendar interaction.** The calendar on the Archive page is visible but non-functional for filtering. Clicking dates doesn't change which bills appear - the Archive always shows all archived bills regardless of date selection. This is intentional: archived bills have no active due dates, so date-based filtering doesn't apply. The calendar displays with no colored dots at all, making it visually distinct from active bill views where dots indicate bill statuses or payment dates.

**Bill detail panel styling.** Archived bills in the detail panel always use neutral colors (muted background, gray text) regardless of their original status. Even if a bill was overdue when archived, it doesn't show red colors in the Archive view because it's inactive.

**Payment history in archived bills.** Archived bills retain their full payment history. When you open an archived bill's detail panel and expand the payment history section, you can see all past payments like active bills. This preserves complete financial records even for inactive commitments.

## Verification

To confirm the Archive feature works as expected:

1. Archive a bill from the Bill Detail Panel. Click on any active bill, then click "Archive" at the bottom of the panel.
2. Verify the bill disappears from the Overview and other active views.
3. Check the sidebar. The Archive menu item should show a count (e.g., "1 bill").
4. Click "Archive" in the sidebar to navigate to the Archive page.
5. Verify the archived bill appears in the table with "Never" and "Archived" in the due date column.
6. Click on the archived bill row. The detail panel should open.
7. Check that the panel shows "Never / Archived" in the date section.
8. Verify that "Log Payment" and "Skip" buttons are hidden.
9. Verify that the "Unarchive" button is visible at the bottom (not "Archive").
10. Click "Unarchive." Verify the bill disappears from the Archive page.
11. Navigate back to Overview. Verify the bill reappears in the active bill list.
12. Check the sidebar Archive count decreased (e.g., back to "No bills").
13. Test tag filtering on the Archive page by selecting a tag from the dropdown.
14. Verify only archived bills with that tag appear.

## Related Documents

* [Overview View](./005-overview-view.md) - The main view for managing all bills
* [Bill Detail Panel & Skip Payment](./009-bill-detail-panel-and-skip-payment.md) - The panel for managing a specific bill
* [After a Bill Ends Setting](./012-after-a-bill-ends-setting.md) - What happens when a bill ends

