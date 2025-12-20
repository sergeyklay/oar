# Logging Payments

- **Status:** Draft
- **Last Updated:** 2025-12-20

## Overview

After paying a bill, log the payment in Oar to let the app know you've paid it and update the next due date. When you click the Log Payment button, you'll see a popup that lets you enter this information:

- Date: The date you paid the bill (required, defaults to today)
- Amount: The amount you paid (required, defaults to the bill amount)
- Note: A confirmation number or other note about the payment (optional)

You'll also see a toggle labeled 'Update Due Date'. Usually, you want this on. It updates the due date based on the bill's repeat interval (weekly, monthly, etc.). For example, if you have a monthly bill due on March 1, when you log a payment with the toggle on, the due date moves to April 1.

### Logging Partial Payments

If you want to log a partial payment, turn the Update Due Date toggle off. This does two things: First, the due date stays the same. Second, the amount due reduces by the amount you log. For example, if you have a bill due that is $200 every month, and log a payment for $150 with the toggle off, the amount due reduces to $50, and the due date stays the same. It doesn't reduce the amount for all future payments, only the current amount due.

When you log a payment for the remaining amount (in this example, $50) and leave the Update Due Date toggle on, the due date moves forward one cycle and the amount due resets to $200.
