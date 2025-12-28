# Include Automatic Bills in Bills Due Soon Setting

- **Status:** Draft
- **Last Updated:** 2025-12-27

## Overview

Some bills pay themselves. Your Netflix subscription charges automatically. Your phone bill drafts from your account. These automatic payments don't require your immediate attention, but they still represent financial obligations. The question is: do you want to see them when you're planning what needs your manual action?

The "Include automatic bills in bills due soon" setting gives you control over this visibility. When enabled, automatic bills appear alongside manual bills in the [Due Soon](./008-due-soon-view.md) and [Due This Month](./004-due-this-month.md) views. When disabled, only bills requiring manual payment appear, letting you focus on what needs your action.

This setting aligns with the "Active Payer" philosophy by giving you control over your awareness level. Some users want to see all obligations, including automatic ones, for complete financial visibility. Others prefer to focus only on bills requiring manual action. The choice is yours, and you can change it anytime.

## The setting

You find the "Include automatic bills in bills due soon" setting in Settings under General → View Options. It's a toggle switch that's enabled by default, maintaining backward compatibility with existing behavior.

**Enabled (default).** Automatic bills appear in Due Soon and Due This Month views alongside manual bills. This gives you complete visibility into all upcoming obligations, whether they require action or not.

**Disabled.** Automatic bills are excluded from Due Soon and Due This Month views. Only bills requiring manual payment appear, helping you focus on what needs your immediate attention.

The setting applies only to Due Soon and Due This Month views. Other views like [Overview](./005-overview-view.md) and [Paid Recently](./014-paid-recently-view.md) always show all bills regardless of this setting. This keeps the filtering focused on the views where you're actively planning upcoming payments.

## How it works

The system identifies automatic bills using the `isAutoPay` flag. When you create or edit a bill, you can mark it as automatic payment. Bills marked this way are subject to the setting's filter.

**When the setting is enabled:**
- Automatic bills appear in Due Soon view if they fall within your configured range
- Automatic bills appear in Due This Month view if they're due in the current month
- The sidebar subtitles include automatic bills in their counts and totals

**When the setting is disabled:**
- Automatic bills are excluded from Due Soon view, even if they fall within your configured range
- Automatic bills are excluded from Due This Month view, even if they're due in the current month
- The sidebar subtitles exclude automatic bills from their counts and totals
- Manual bills always appear regardless of the setting

The filter applies at the database query level, so it's efficient and immediate. When you toggle the setting, the affected views update automatically without requiring a page refresh.

## User flow

Here's what happens when you change the setting:

**Trigger:** You navigate to Settings → General → View Options and toggle the "Include automatic bills in bills due soon" switch.

**Action:** The setting saves immediately. The system revalidates the Due Soon and Due This Month pages to reflect the change.

**Result:** If you disabled the setting, automatic bills disappear from both views. If you enabled it, automatic bills reappear. The sidebar subtitles update to reflect the new counts and totals.

**Persistence:** The setting persists across sessions. Your preference is stored in the database and remains until you change it.

## Edge cases and constraints

**Setting only affects Due Soon and Due This Month.** The Overview view always shows all bills, including automatic ones. The Paid Recently view always shows all payments, regardless of whether the bill was automatic. This keeps the filtering focused on the views where you're actively planning upcoming payments.

**Tag and date filters work independently.** If you filter by tag or select a specific date, the automatic bill filter still applies. For example, if you disable the setting and filter by the "Subscriptions" tag, you'll see only manual subscription bills due in that range, not automatic ones.

**Default behavior preserves existing experience.** The setting defaults to enabled, so existing users see no change in behavior. Automatic bills continue to appear as they always have. This maintains backward compatibility while giving new users the option to customize their view.

**Manual bills always appear.** The setting only affects automatic bills. Bills requiring manual payment always appear in Due Soon and Due This Month views, regardless of the setting. This ensures you never miss bills that need your action.

**Sidebar subtitles update immediately.** When you change the setting, the sidebar navigation subtitles for Due Soon and Due This Month update to reflect the new counts and totals. This gives you immediate feedback about how the setting affects your view.

**Empty views when all bills are automatic.** If you disable the setting and all bills in your Due Soon or Due This Month range are automatic, the view shows an empty state. This is expected behavior; the view is working correctly by filtering out automatic bills.

**Mixed automatic and manual bills.** When the setting is enabled, you see both types. When disabled, you see only manual bills. The view doesn't distinguish between the two types visually; you can identify automatic bills by their auto-pay indicator in the [Bill Detail Panel](./009-bill-detail-panel-and-skip-payment.md).

## Verification

To confirm the setting works:

1. Navigate to Settings → General → View Options.
2. Find the "Include automatic bills in bills due soon" toggle. It should be enabled by default.
3. Note the bill count in the Due Soon sidebar subtitle.
4. Navigate to Due Soon and verify automatic bills appear in the list.
5. Return to Settings and disable the toggle.
6. Navigate back to Due Soon and verify automatic bills no longer appear.
7. Check the sidebar subtitle; the count should decrease if automatic bills were present.
8. Navigate to Due This Month and verify automatic bills are also excluded.
9. Navigate to Overview and verify all bills still appear regardless of the setting.
10. Re-enable the setting and verify automatic bills reappear in both views.

To test with tag filtering:

1. Disable the setting.
2. Navigate to Due Soon and select a tag that includes both automatic and manual bills.
3. Verify only manual bills with that tag appear.
4. Re-enable the setting.
5. Verify both automatic and manual bills with that tag appear.

## Related Documents

* [Due Soon View](./008-due-soon-view.md) - Bills due within a configurable time range
* [Due This Month View](./004-due-this-month.md) - Bills due in the current calendar month
* [Active Payer Signals](./010-active-payer-signals.md) - Explicit payment mode indicators (Auto/Manual) for each bill
* [Logging Payments](./002-auto-pay.md) - Recording payments, partial payments, and historical payment detection

