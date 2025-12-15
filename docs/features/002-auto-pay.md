# Logging Payments

- **Status:** Draft
- **Last Updated:** 2025-12-11

## Overview

After paying a bill, log the payment in Oar to let the app know you've paid it, and update the next due date. When you click the Log Payment button, you'll see a popup that lets you enter the following information:

- Date: The date you paid the bill (required, defaults to the current date)
- Amount: The amount you paid (required, defaults to the bill amount)
- Note: A confirmation number or other note about the payment (optional)

You'll also see a toggle labeled 'Update Due Date'. Usually, you always want this on. It will update the due date to the next cycle. For example, if you have a monthly bill due on March 1, when you log a payment with the Update Due Date toggle on, the due date will move to April 1.

### Logging Partial Payments

If you want to log a partial payment, turn the Update Due Date toggle off. This will do two things: First, the due date will not change. Second, the amount due will reduce by the amount you log. For example, if you have a bill due that is $200 every month, and log a payment for $150 with the Update Due Date toggle off, the amount due will reduce to $150, and the due date will stay the same. It will not reduce the amount for all future payments, only the current amount due.

When you want the due date to change, log a payment for the remaining amount (in this example, $150), and leave the Update Due Date toggle on. Then, the due date will move forward one cycle, and the amount due will reset to $200.

## Implementation

TODO: Add implementation details here.

## Edge Cases

TODO: Add edge cases here.

## Future Scope

TODO: Add future scope here.
