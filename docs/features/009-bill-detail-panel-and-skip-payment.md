# Bill Detail Panel & Skip Payment

- **Status:** Draft
- **Last Updated:** 2025-12-21
- **Related:** [Overview Screen](./005-overview-screen.md), [Logging Payments](./002-auto-pay.md)

## Overview

Oar emphasizes intentionality in financial management. While the Overview screen provides a high-level table view of your obligations, the **Bill Detail Panel** is where you focus on a specific commitment and decide how to handle it.

The panel appears when you click on a bill in any list. It strips away the surrounding noise to present a clear "Active Payer" decision point: do you pay this bill now, or do you skip this specific occurrence?

## Design Philosophy

The panel uses a bold visual language to signal urgency. The header background color changes based on the bill's status, echoing the vertical status bars found in the main table. This immediate splash of color—red for overdue, amber for due soon, blue for later, or green for paid—sets the context before you read a single word.

## User Flow

### Trigger
You open the panel by clicking any bill row in the Overview table or other bill lists. Selecting a different bill updates the panel content, while clicking the "X" or the background closes it.

### Information Hierarchy
The panel presents information in a prioritized stack:
1. **Status Header:** A plain-language summary like "Due in 2 weeks" or "Overdue by 3 days."
2. **Specific Date:** The exact date of the obligation (e.g., "Monday, 12 January 2026").
3. **Amount:** The total amount due. Overdue amounts are highlighted in red to demand attention.
4. **Contextual Data:** Any notes or tags associated with the bill.

### Core Actions
Two primary buttons drive the user interaction:

* **Log Payment:** Opens the standard payment dialog. This is the primary path for fulfilling your financial commitment.
* **Skip:** A specialized action for deferred obligations. Clicking "Skip" advances the bill to its next occurrence without recording a transaction.

## The "Skip" Action

The "Skip" action is designed for real-world flexibility. Sometimes a service is paused, a bill is waived for a month, or you're managing a subscription that you've decided not to use this cycle but want to keep for the future.

When you skip a payment:
1. **No Transaction:** Unlike logging a payment of $0, no record is added to your transaction history.
2. **Date Advancement:** The bill's due date moves forward based on its repeat interval (e.g., a monthly bill moves to the next month).
3. **Amount Reset:** The amount due resets to the bill's base amount, preparing it for the next cycle.

*Note: You can't skip one-time bills, as they have no future occurrences to advance to.*

## Edge Cases & Constraints

* **One-time Bills:** The "Skip" button is disabled for bills that repeat "Never." These must either be paid or deleted.
* **Already Paid:** If a bill is already marked as "Paid" (common for one-time bills), both the Log Payment and Skip buttons are disabled.
* **Negative Margins:** The panel header uses a "full-bleed" design with negative margins to touch the edges of the sidebar, ensuring the status color is the dominant visual element.
* **Variable Estimates:** If a bill is marked as variable, the amount displayed includes an "(estimate)" label to remind you that the final payment might differ.

## Verification

To confirm the Bill Detail Panel works as expected:
1. Open the Overview screen and click on a recurring bill.
2. Verify the panel slides in and the header background color matches the bill's urgency.
3. Check that the amount is red if the bill is overdue.
4. Click "Skip" on a recurring bill. Verify a confirmation toast appears and the due date in the table updates to the next month/interval.
5. Click on a one-time bill and verify the "Skip" button is disabled.
