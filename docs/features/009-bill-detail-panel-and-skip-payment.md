# Bill Detail Panel & Skip Payment

- **Status:** Draft
- **Last Updated:** 2025-12-25

## Overview

Oar emphasizes intentionality in financial management. While the Overview screen provides a high-level table view of your obligations, the **Bill Detail Panel** is where you focus on a specific commitment and decide how to handle it.

The panel appears when you click on a bill in any list. It strips away the surrounding noise to present a clear "Active Payer" decision point: do you pay this bill now, or do you skip this specific occurrence?

## Design philosophy

The panel uses a bold visual language to signal urgency. The header background color changes based on the bill's status, echoing the vertical status bars found in the main table. This immediate splash of color (red for overdue, amber for due soon, blue for later, or green for paid) sets the context before you read a single word.

## User flow

### Trigger
You open the panel by clicking any bill row in the Overview table or other bill lists. Selecting a different bill updates the panel content, while clicking the "X" or the background closes it.

### Information hierarchy

The panel presents information in a prioritized stack:

1. **Status Header:** A plain-language summary like "Due in 2 weeks" or "Overdue by 3 days."
2. **Specific Date:** The exact date of the obligation (e.g., "Monday, 12 January 2026").
3. **Amount:** The remaining balance for the current cycle. If you have made partial payments, the display shows your current obligation and the total amount in parentheses, like "$50.00 ($100.00)". Overdue amounts are highlighted in red to demand attention.
4. **Contextual Data:** Any notes or tags associated with the bill.

### Core actions
Two primary buttons drive the user interaction:

* **Log Payment:** Opens the standard payment dialog. This is the primary path for fulfilling your financial commitment.
* **Skip:** A specialized action for deferred obligations. Clicking "Skip" advances the bill to its next occurrence without recording a transaction.

## The "Skip" action

The "Skip" action is designed for real-world flexibility. Sometimes a service is paused, a bill is waived for a month, or you're managing a subscription you've decided not to use this cycle but want to keep for the future.

When you skip a payment:
1. **No Transaction:** Unlike logging a payment of $0, no record is added to your transaction history.
2. **Date Advancement:** The bill's due date moves forward based on its repeat interval (e.g., a monthly bill moves to the next month).
3. **Amount Reset:** The amount due resets to the bill's base amount, preparing it for the next cycle.

*Note: You can't skip one-time bills, as they have no future occurrences to advance to.*

## Payment history

The Bill Detail Panel includes an inline payment history section positioned above the notes. This collapsible region lets you review past payments without leaving the current context.

### Collapsed state

When collapsed, the section displays:
- **Title:** "View Payment History" with a right-pointing chevron
- **Subtitle:** Either "No Payments" or "Last Paid {amount} on {date}" showing your most recent payment

The subtitle gives you instant context about your payment pattern. Click anywhere on the header to expand.

### Expanded state

Clicking the header transforms the panel into a focused payment history view:

1. **Other sections hide.** The status block, action buttons, notes, and tags all disappear to give the transaction list room to breathe.
2. **Header changes.** The title becomes "← Payment History" with a back arrow.
3. **Transaction list appears.** Each payment displays in a compact format: date, amount, and notes (if any).

Click the back arrow or header to collapse the section and restore the full panel view.

### Transaction display

Each payment entry shows:
- **Date:** Formatted as DD/MM/YYYY
- **Amount:** Your currency-formatted payment
- **Notes:** Any notes you added when logging the payment (truncated to a single line if long)

Hover over a transaction to see the full note text in a tooltip. The list scrolls vertically when you have many payments, keeping the panel height manageable.

Click any payment row to view its details and edit or delete it. See [Editing Payment History](./011-editing-payment-history.md) for details on correcting payment mistakes.

## Edge cases and constraints

* **Archived Bills:** When viewing an archived bill (accessed through the [Archive Screen](./013-archive-screen.md)), the panel behavior changes. The "Log Payment" and "Skip" buttons are hidden, the "Archive" button becomes "Unarchive," and the due date displays "Never / Archived" instead of relative dates. The header uses neutral colors rather than urgency-based status colors.
* **One-time Bills:** The "Skip" button is disabled for bills that repeat "Never." These must either be paid or deleted.
* **Already Paid:** If a bill is marked as "Paid" (common for one-time bills), both the Log Payment and Skip buttons are disabled.
* **Partial Payment Visibility:** When you pay only part of a bill and choose not to advance the due date, the panel displays your remaining balance and the total base amount in parentheses. This ensures you never lose sight of the original commitment while celebrating progress.
* **Negative Margins:** The panel header uses a "full-bleed" design with negative margins to touch the edges of the sidebar, ensuring the status color is the dominant visual element.
* **Variable Estimates:** If a bill is marked as variable, the amount displayed includes an "(estimate)" label to remind you that the final payment might differ.
* **Empty History:** Bills with no payments show "No payments recorded yet." in the expanded view.
* **Data Loading:** Payment history loads when the panel opens, not when you expand the section. This ensures instant display when you click to view history.

## Verification

To confirm the Bill Detail Panel works as expected:
1. Open the Overview screen and click on a recurring bill.
2. Verify the panel slides in and the header background color matches the bill's urgency.
3. Check that the amount is red if the bill is overdue.
4. Log a partial payment (e.g., pay $50 of a $100 bill and disable "Update Due Date"). Verify the panel now displays "$50.00 ($100.00)".
5. Click "Skip" on a recurring bill. Verify a confirmation toast appears and the due date in the table updates to the next interval.
6. Click on a one-time bill and verify the "Skip" button is disabled.
7. Look for the "View Payment History" section above the notes.
8. If the bill has payments, verify the subtitle shows the last payment info. If not, verify it shows "No Payments."
9. Click "View Payment History" to expand. Verify the status block, action buttons, notes, and tags all hide.
10. Check the transaction list displays dates, amounts, and notes correctly.
11. Click the back arrow. Verify all hidden sections reappear.

## Related Documents

* [Overview Screen](./005-overview-screen.md) - The main screen for managing all bills
* [Logging Payments](./002-auto-pay.md) - Recording payments, partial payments, and historical payment detection
* [Editing Payment History](./011-editing-payment-history.md) - Correcting payment mistakes and managing payment records
* [Archive Screen](./013-archive-screen.md) - Viewing and managing archived bills
