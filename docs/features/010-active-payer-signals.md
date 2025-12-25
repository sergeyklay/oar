# Active Payer Signals

- **Status:** Draft
- **Last Updated:** 2025-12-25

## Overview

Oar is built on the "Active Payer" philosophy: financial health comes from awareness, not automation. While most apps try to hide the "boring" parts of banking, Oar brings them to the forefront.

We use specific visual signals to ensure you never sleepwalk through a charge. The most important of these is the distinction between **Auto** and **Manual** payments.

## Why distinguish auto vs manual?

When a bill is paid manually, the awareness is built-in: you have to log in to your bank, authorize the transfer, and record it in Oar. The friction *is* the feature.

However, for bills you've already delegated to your bank (like Netflix or Spotify), that friction is gone. Without a signal, these bills can become "zombie subscriptions" - money that leaves your account without you noticing.

By labeling these bills explicitly in the Overview, we shift the type of control you exercise. Auto-pay is not an excuse to relax, but a signal to shift from "remembering to pay" to "remembering to verify the charge".

* **Manual:** Control via action (I must pay this).
* **Auto:** Control via verification (I must check this).

## The auto/manual indicator

Every bill in the [Overview Screen](./005-overview-screen.md) displays its payment mode right below the title, alongside its repeat interval.

### Visual Representation

The indicator appears as a subtle suffix:
`Every month • Auto` or `Every month • Manual`

This placement ensures that whenever you scan your commitments, you immediately know which ones require your physical action and which ones require your mental verification.

### Logic & Behavior

* **Manual mode:** The default for all new bills. These bills stay in a "Pending" or "Overdue" status until you manually log a payment.
* **Auto mode:** Reserved for bills where you've confirmed an external automatic payment exists. Oar will automatically log these payments and advance the due date, but it marks them with a specific note ("Logged by Oar") in the history.

## Active Payer signals in the UI

Beyond the Auto/Manual text, Oar uses other signals to maintain your awareness:

1. **Urgency Colors:** The colored status bars (Red, Amber, Blue) in the Overview prioritize your attention.
2. **Estimate Labels:** Variable bills are marked with `(estimate)` to remind you that the final charge might differ from your expectations.
3. **Intentional Friction:** The "Log Payment" flow requires a few extra clicks compared to a simple "Checkmark" to ensure you look at the amount and date.

## Edge cases

* **Changing Modes:** You can toggle a bill between Auto and Manual at any time by editing it. If you cancel an auto-pay at your bank, you must update it in Oar to prevent the system from logging a payment that didn't happen.
* **Variable auto-pay:** If a bill is both Variable and auto-pay, it will be labeled `Every month • Auto` and show `(estimate)` next to the amount. This is a high-priority verification signal: the system will log your *estimated* amount, so you should check your bank statement and correct the logged transaction if they differ.

## Verification

To confirm the signals are working as intended:

1. Create a bill and leave "auto-pay" unchecked. It should appear as `• Manual`.
2. Edit a bill and check "auto-pay". It should now appear as `• Auto`.
3. Verify that the styling (color and size) matches the repeat interval text, ensuring it provides context without overwhelming the primary bill information.
4. Check a bill that is both variable and auto-pay; ensure both `• Auto` and `(estimate)` are visible.

## Related Documents

* [Overview Screen](./005-overview-screen.md) - The main screen for managing all bills
* [Logging Payments](./002-auto-pay.md) - Recording payments, partial payments, and historical payment detection
* [Background Jobs](./006-background-jobs.md) - Automated system tasks

