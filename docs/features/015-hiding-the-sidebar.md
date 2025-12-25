# Hiding the Sidebar

- **Status:** Draft
- **Last Updated:** 2025-12-25

## Overview

When you're reviewing a long list of bills, you might want more horizontal space to see bill details without scrolling. Oar lets you hide the sidebar temporarily, giving your bill table the full width of the screen.

The sidebar toggle button appears at the top of every page, in the same spot on every screen. This consistency means you always know where to find it, whether you're on the Overview page, Due Soon, or any other view.

Hiding the sidebar gives you more space and remembers your preference as you navigate. If you hide the sidebar on the Overview page, it stays hidden when you move to Due Soon or any other page. This persistence respects your workflow, so you don't have to hide it again every time you change views.

## How it works

Every page has a small menu icon button at the top left. Click it once to hide the sidebar. Click it again to show the sidebar. The button's position never changes, so you can toggle the sidebar without hunting for controls.

When the sidebar is hidden, it collapses completely, and your bill table expands to fill the available space. This gives you more room to see bill names, amounts, and due dates without horizontal scrolling. When you show the sidebar again, everything returns to the normal layout.

The toggle state persists across page navigation. This means if you hide the sidebar on Overview, then navigate to Due Soon, the sidebar remains hidden. Navigate to Archive, and it's still hidden. Return to Overview, and your preference is preserved. This works because the state is stored in the URL, so it survives page refreshes and browser navigation.

## When to hide the sidebar

Hide the sidebar when you need to focus on your bills without distractions. This is especially useful when:

- You're reviewing a long list of bills and want to see more columns at once
- You're comparing bill amounts or due dates across multiple rows
- You're working on a smaller screen where every pixel counts
- You want a cleaner, more focused view of your financial obligations

Show the sidebar again when you need to navigate to a different page, check your calendar, or access other features. The toggle is instant, so you can switch back and forth as needed.

## Other page actions

While the sidebar toggle appears on every page, some pages include additional action buttons in the same area:

**Overview page** shows a plus icon button for creating new bills. Click it to open the bill creation dialog without navigating away from your bill list.

**Pages with tag filtering** (Overview, Due Soon, Due This Month, Archive) show a tag filter dropdown. This lets you filter bills by tag directly from the page header, keeping your filtering options close at hand.

These buttons appear in a consistent location across pages, so you always know where to find common actions. The sidebar toggle is always first, followed by page-specific actions when available.

## Edge cases

**First visit.** When you first visit a page, the sidebar is visible by default. If you've hidden it before and return to the same page, it remembers your preference.

**Browser refresh.** If you refresh the page with the sidebar hidden, it stays hidden. The state is preserved in the URL, so refreshing doesn't reset your layout preference.

**Shared links.** If someone shares a link with the sidebar hidden (the URL contains `?sidebar=hidden`), opening that link starts with the sidebar hidden. This lets you bookmark or share pages in your preferred layout.

**Navigation.** Moving between pages preserves your sidebar state. If you hide the sidebar on Overview, then navigate to Due Soon, then to Archive, the sidebar stays hidden throughout your session.

**Browser back button.** Using the browser's back or forward buttons preserves the sidebar state for each page. If you had the sidebar hidden on Overview, navigated away, then used back to return, the sidebar state matches what it was when you left.

**No tags.** On pages that normally show tag filtering, if you don't have any tags yet, the tag filter button doesn't appear. This prevents showing an empty dropdown.

## Verification

To confirm the sidebar toggle works:

1. Navigate to the Overview page. Look for the menu icon button at the top left.
2. Click the menu icon. The sidebar should hide and the bill table should expand.
3. Click the menu icon again. The sidebar should reappear and the table should return to normal width.
4. Hide the sidebar, then navigate to Due Soon. The sidebar should remain hidden.
5. Navigate to Archive. The sidebar should still be hidden.
6. Return to Overview. The sidebar should still be hidden, preserving your preference.
7. Refresh the page. The sidebar should remain hidden after refresh.
8. Show the sidebar again, then navigate to a different page. The sidebar should remain visible.
9. Open a new tab and navigate to a page. The sidebar should be visible by default (unless the URL contains `?sidebar=hidden`).

## Related Documents

* [Overview Screen](./005-overview-screen.md) - The main screen for managing all bills
* [Organizing Bills with Tags](./003-organizing-bills-with-tags.md) - Categorizing bills with tags
