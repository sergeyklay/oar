# Editing Payment History

- **Status:** Draft
- **Last Updated:** 2025-12-23
- **Related:** [Logging Payments](./002-auto-pay.md), [Bill Detail Panel](./009-bill-detail-panel-and-skip-payment.md)

## Overview

Mistakes happen. You might log a payment with the wrong date, enter an incorrect amount, or realize you recorded a payment that never occurred. The payment history view in the Bill Detail Panel shows your transactions, but until now, you couldn't correct errors once they were recorded.

Editing payment history lets you fix mistakes while maintaining the integrity of your financial records. When you modify or delete a payment that affected your current billing cycle, Oar automatically recalculates the bill's state to keep everything consistent. This preserves the "Active Payer" principle: you're in control, but the system ensures your data remains accurate.

## User flow

### Viewing payment details

The payment history section in the Bill Detail Panel displays a list of all payments for the selected bill, ordered from newest to oldest. Each row shows the date, amount, and any notes you added when logging the payment.

To view detailed information about a specific payment:

1. Expand the "View Payment History" section in the Bill Detail Panel
2. Click any payment row in the list
3. A form appears at the bottom of the history section showing the selected payment's details

The form displays three fields in read-only mode:

* **Payment Date:** The date you recorded the payment, formatted as DD/MM/YYYY
* **Amount:** The payment amount in your currency
* **Note:** Any notes you added when logging the payment, or empty if none

Above the form, you'll see a header labeled "Selected Payment" with two buttons on the right: a trash icon for deletion and an "Edit" button for making changes.

### Editing a payment

When you need to correct a payment record:

1. Select the payment from the history list to view its details
2. Click the **Edit** button in the form header
3. The form fields become editable, and the trash and Edit buttons disappear
4. Modify the date, amount, or notes as needed
5. Click **Save** to apply your changes, or **Cancel** to discard them

After saving, the payment list refreshes to show your updated information. If the payment you edited affected the current billing cycle, Oar automatically recalculates the bill's due date, amount due, and status to reflect the corrected payment.

**What gets recalculated:**

If you change a payment's date or amount, and that payment was part of the current billing cycle, Oar:

* Recalculates the total amount paid in the current cycle
* Updates the amount due based on the new total
* Adjusts the due date if the payment total now covers the full amount due
* Updates the bill's status (pending, overdue, or paid) based on the new due date

For example: You have a $200 monthly bill with $50 remaining. You realize you logged a $100 payment as $150. After editing the payment to $100, Oar recalculates and shows $150 remaining instead of $50, because the corrected payment total is lower.

### Deleting a payment

Sometimes you need to remove a payment entirely. Perhaps you logged a payment by mistake, or you recorded a transaction that was later canceled.

To delete a payment:

1. Select the payment from the history list
2. Click the **trash icon** button in the form header
3. A confirmation dialog appears showing the payment details
4. Review the warning message about cycle recalculation
5. Click **Delete** to confirm, or **Cancel** to keep the payment

The confirmation dialog displays the payment amount and date so you can verify you're removing the correct record. It also warns that deleting a payment that affected the current cycle will trigger a recalculation.

After deletion, the payment disappears from the history list. If the deleted payment was part of the current billing cycle, Oar automatically recalculates the bill's state based on the remaining payments.

**What happens when you delete:**

If you delete a payment that was part of the current billing cycle, Oar:

* Removes the payment from the transaction history
* Recalculates the total amount paid in the current cycle using only the remaining payments
* Updates the amount due based on the new total
* Adjusts the due date if necessary (for example, if deleting the payment means the cycle no longer advanced)
* Updates the bill's status based on the new calculations

For example: You have a $200 monthly bill. You logged a full payment that advanced the due date to next month. Later, you realize that payment never occurred. After deleting it, Oar reverts the due date back to the original date and resets the amount due to $200, because the cycle advancement was based on a payment that no longer exists.

### Selection behavior

The payment selection state is temporary and doesn't persist. When you collapse the payment history section or switch to a different bill, any selected payment is cleared. This keeps the interface clean and prevents confusion when navigating between bills.

If no payment is selected, the bottom of the payment history section displays a message: "Select a payment to view and edit." This prompt only appears when the bill has at least one payment recorded.

## Edge cases and constraints

**Empty payment history.** If a bill has no payments, the selection prompt doesn't appear. The history section simply shows "No payments recorded yet."

**Historical payments.** Payments recorded before the current billing cycle started are considered "historical." Editing or deleting a historical payment doesn't trigger cycle recalculation because it didn't affect the current cycle. The payment record updates, but the bill's due date, amount due, and status remain unchanged.

**Multiple payments in current cycle.** If you have several payments in the current cycle and you edit or delete one, Oar sums all remaining current-cycle payments to determine the new amount due. For example: You have a $200 bill with three payments of $50, $75, and $75 in the current cycle. If you delete one $75 payment, the system recalculates using the remaining $125 total, leaving $75 due.

**Deleting the payment that advanced the cycle.** If you delete a payment that caused the bill to advance to the next cycle, Oar reverts the due date back to the previous cycle. The system checks whether any payments remain in the previous cycle to determine the correct state. If the previous cycle was fully paid, the current cycle remains. If the previous cycle had partial payments, the due date reverts and the amount due reflects those partial payments.

**Overpayment corrections.** If you edit a payment amount downward and the new total is less than what was previously paid, the amount due increases accordingly. The system never allows negative amounts due, so if your corrections result in overpayment, the amount due becomes zero.

**One-time bills.** For bills that repeat "Never," deleting the payment that marked the bill as paid will revert the bill to pending status with the full amount due. Editing such a payment works the same way as recurring bills, but since one-time bills don't have cycles, the recalculation focuses on whether the bill should be marked as paid based on the total payments.

**Concurrent edits.** Oar is designed for single-user use. If you're editing a payment in one browser tab and delete it in another, the system will reflect the most recent change. For best results, complete one operation before starting another.

**Date validation.** When editing a payment date, you can only select dates in the past. Future dates aren't allowed because you can't record a payment that hasn't happened yet. The date picker disables future dates automatically.

**Amount validation.** Payment amounts must be positive integers (whole numbers). The system stores amounts in the smallest currency unit (cents for dollars, grosze for złoty, etc.), so you enter amounts like "164.20" and the system converts them internally. You can't enter negative amounts or zero.

**Notes length.** Payment notes are limited to 500 characters. If you try to save a note longer than this, you'll see a validation error. Truncate your note or split the information across multiple payments if needed.

## Active Payer alignment

This feature reinforces the "Active Payer" philosophy in several ways:

**Conscious correction.** Unlike systems that auto-import and never let you fix mistakes, Oar gives you full control over your payment records. Every edit and deletion requires explicit action: selecting a payment, clicking Edit or Delete, and confirming your changes.

**Awareness through recalculation.** When you modify a payment that affected your current cycle, Oar immediately shows you the consequences by recalculating the bill's state. You see exactly how your correction impacts your obligations, building awareness of the relationship between payments and billing cycles.

**No silent automation.** The system doesn't automatically "fix" payments or merge duplicates. You decide what needs correction and when. The recalculation happens transparently, but the decision to edit or delete remains yours.

**Data sovereignty.** All payment editing happens locally in your database. No external services are involved. Your corrections are immediate and permanent, stored on your machine.

## Verification

To confirm payment editing works correctly:

1. Open the Bill Detail Panel for a bill with at least one payment
2. Expand the "View Payment History" section
3. Verify the message "Select a payment to view and edit" appears at the bottom
4. Click a payment row and verify the detail form appears with read-only fields
5. Verify the form shows the correct date, amount, and notes
6. Click the Edit button and verify the fields become editable
7. Change the amount and click Save
8. Verify the payment list refreshes with the updated amount
9. If the payment affected the current cycle, verify the bill's amount due updates in the panel header

To confirm payment deletion works correctly:

1. Select a payment that was part of the current billing cycle
2. Note the bill's current due date and amount due
3. Click the trash icon and confirm deletion in the dialog
4. Verify the payment disappears from the history list
5. Verify the bill's due date and amount due recalculate correctly
6. If the deleted payment had advanced the cycle, verify the due date reverts appropriately

To confirm historical payment handling:

1. Find a recurring bill with a payment dated before the current cycle started
2. Edit that historical payment's amount or date
3. Verify the bill's due date and amount due remain unchanged
4. Delete the historical payment
5. Verify the bill's state still doesn't change
6. Check that the payment no longer appears in history, but the bill's current obligations are unaffected

