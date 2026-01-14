### 🎯 Scope & Context

**Type:** Chore

**Intent:** Update transaction notes in `AutoPayService` to reflect accurate logging information. The notes field in auto-pay transaction records is changed from "Auto-processed on due date" to "Logged by Oar" to better represent the system's logging behavior.

### 🧭 Reviewer Guide

**Complexity:** Low

#### Entry Point

[Example 1: Start with `lib/services/AutoPayService.ts` - this is where the core logic change happens. The rest of the files are just adapting to the new return type introduced here. Understanding this file first will make the other changes obvious.]
[Example 2: Start with `lib/models/Bill.ts` - there are changes to how `nextDueDate` is calculated. This looks minor but it affects validation in 3 other services. Once you see the new calculation logic, the changes in `AutoPayService` and `BillValidator` will make sense.]
[Example 3: Start with `lib/services/PaymentProcessor.ts` - this contains the most significant change: switching from sync to async transaction handling. Pay attention to the error handling block on lines 45-60, this is where the behavior differs from before.]
[Example 4: Start with `lib/services/AutoPayService.ts` - this file drives the change. The modifications in other files follow from the new interface defined here.]
[Example 5: No specific entry point needed - changes are straightforward and self-contained. Each file can be reviewed independently. The `AutoPayService.ts` change is just a string update in the notes field, other files follow the same pattern.]

#### Sensitive Areas

- `lib/services/foo.ts`: Database transaction insertion logic with notes field value
- `lib/services/bar.ts`: Service logic to calculate next due date for recurring bills
- `lib/services/baz.ts`: Service logic to derive bill status based on next due date

### ⚠️ Risk Assessment

- **Breaking Changes:** No breaking changes
- **Migrations/State:** No migrations or state changes
