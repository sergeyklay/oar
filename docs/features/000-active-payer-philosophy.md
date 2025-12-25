# Active Payer Philosophy

- **Status:** Draft
- **Last Updated:** 2025-12-25

## Overview

Oar rejects mindless automation. Most expense trackers record what already happened; Oar makes you confront what's coming. The Active Payer philosophy is the foundation of how Oar approaches personal finance: every payment requires your conscious acknowledgment. This friction prevents zombie subscriptions and builds financial awareness.

Unlike passive expense trackers that merely record what happened, Oar is a commitment calendar that enforces awareness of upcoming financial obligations. You are not a passive observer—you are an Active Payer who must consciously acknowledge every bill. This is a feature, not friction.

## Core principles

### Friction builds awareness

When you manually record a payment, you're forced to acknowledge the money leaving your account. This small friction builds financial awareness over time. You can't sleepwalk through your expenses when every payment requires a conscious action.

The system doesn't hide the "boring" parts of banking. Instead, it brings them to the forefront. Every bill, every payment, every obligation requires your attention. This intentional friction shifts you from passive observer to active participant in your financial life.

### Automation with awareness

Oar doesn't reject all automation. Some bills are paid automatically by your bank (direct debit, recurring card charges). The system respects that choice, but it doesn't let you forget about those bills.

When a bill is marked as auto-pay, the system shifts the type of control you exercise. Auto-pay is not an excuse to relax, but a signal to shift from "remembering to pay" to "remembering to verify the charge." The system logs these payments automatically, but you must still verify that the expected amount was charged.

### Sovereignty by default

Your data lives on your machine. No cloud sync, no telemetry, no external APIs for core features. You own your financial truth absolutely. This sovereignty extends to how you interact with your bills: you decide when to log payments, when to skip cycles, and when to archive completed obligations.

The system provides tools and calculations, but you make the decisions. The recurrence engine calculates due dates, but you decide when to log payments. The system can mark bills as auto-pay, but you must verify the charges.

## How Active Payer manifests in Oar

### Manual payment logging

Every payment requires explicit logging. There's no automatic import from bank feeds. You open the Log Payment dialog, enter the amount and date, and confirm the payment. This process takes a few extra clicks compared to a simple checkmark, but those clicks ensure you look at the amount and date.

See [Logging Payments](./002-auto-pay.md) for details on how payment logging works.

### Visual signals

The system uses visual signals to maintain your awareness:

- **Auto/Manual indicators:** Every bill shows whether it requires your action (Manual) or your verification (Auto)
- **Urgency colors:** Status bars use color to prioritize your attention (red for overdue, amber for due soon)
- **Estimate labels:** Variable bills are marked with "(estimate)" to remind you the final charge might differ

See [Active Payer Signals](./010-active-payer-signals.md) for details on visual indicators.

### Intentional decision points

The Bill Detail Panel presents clear decision points: do you pay this bill now, or do you skip this specific occurrence? The system doesn't make these decisions for you. It presents the information and waits for your choice.

Even when bills end (fully paid one-time bills or recurring bills that reach their end date), you control what happens next through the "After a Bill Ends" setting. The system detects the end, but you choose whether to keep it visible or archive it.

### Conscious corrections

When you make a mistake—wrong date, incorrect amount, duplicate payment—you can correct it. The system doesn't automatically merge duplicates or "fix" your entries. You decide what needs correction and when. Every edit and deletion requires explicit action.

See [Editing Payment History](./011-editing-payment-history.md) for details on correcting payment mistakes.

## Why Active Payer matters

Financial health comes from awareness, not automation. When you're actively engaged with your bills, you notice patterns. You see when subscriptions increase in price. You catch errors before they compound. You make informed decisions about which services to keep and which to cancel.

Passive systems encourage you to set it and forget it. Active Payer systems encourage you to set it and verify it. The difference is subtle but profound: one builds dependency, the other builds financial discipline.

## Edge cases and constraints

**Auto-pay bills:** Bills marked as auto-pay still require your verification. The system logs payments automatically, but you should check your bank statement to ensure the expected amount was charged. If amounts differ, you can edit the logged payment.

**Historical payments:** When onboarding existing bills, you can log past payments without affecting the current billing cycle. The system detects historical payments and records them separately. This lets you build complete payment history while keeping current obligations accurate.

**Partial payments:** You can log partial payments and choose whether to advance the due date. This flexibility handles real-world scenarios like splitting payments or paying early. The system shows your remaining balance clearly so you never lose sight of the original commitment.

**Bill completion:** When bills end, you control what happens next. You can keep them visible for reference or archive them. The system detects completion, but you choose the outcome. This preserves the Active Payer principle: you're making an informed decision, not sleepwalking through an automated process.

## Related Documents

* [Logging Payments](./002-auto-pay.md) - Recording payments, partial payments, and historical payment detection
* [Active Payer Signals](./010-active-payer-signals.md) - Explicit payment mode indicators (Auto/Manual) for each bill
* [Overview View](./005-overview-view.md) - The main view for managing all bills
* [Editing Payment History](./011-editing-payment-history.md) - Correcting payment mistakes and managing payment records

