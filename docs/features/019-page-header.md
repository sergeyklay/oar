# Page Header

- **Status:** Draft
- **Last Updated:** 2025-01-XX

## Overview

Navigating between different pages in a financial app shouldn't require relearning where common actions live. The page header provides a consistent set of controls across all views, so once you learn where to find something, you can rely on that location everywhere.

The header sits at the top of the main content area and includes navigation, actions, and search. Controls appear in the same positions across pages, creating a predictable interface that reduces the mental effort of finding what you need.

## User Flow

### Trigger

Every page displays the header automatically. There's no action required to show it; it's always present at the top of the main content area.

### Rules

The header contains four types of controls, arranged from left to right:

**Sidebar toggle** always appears at the far left. It controls the visibility of the left navigation sidebar and calendar.

**Add Bill button** appears next to the sidebar toggle when category data is available. It opens the bill creation dialog without navigating away from your current page.

**Tag filter** appears between the Add Bill button and search when you have at least one tag. It lets you filter the current view to show only bills with a selected tag. On Settings pages, the tag filter never appears regardless of whether you have tags, since tag filtering doesn't apply to configuration tasks.

**Bill search** always appears at the far right. It lets you find bills by title across the entire application.

The header's layout adapts based on what's available. If you have no tags, the tag filter disappears and the remaining controls adjust their spacing. If you're on a Settings page, the tag filter is hidden even when tags exist. The sidebar toggle and search always remain visible.

### UI Behavior

#### Sidebar Toggle

The sidebar toggle button displays a menu icon at the top left of every header. Click it once to hide the sidebar, click again to show it. When the sidebar is hidden, it collapses completely and your bill table expands to fill the available space, giving you more room to see bill names, amounts, and due dates without horizontal scrolling.

The toggle state persists across page navigation. If you hide the sidebar on Overview, then navigate to Due Soon, the sidebar remains hidden. Navigate to Archive, and it stays hidden. Return to Overview, and your preference is preserved. This works because the state is stored in the URL, so it survives page refreshes and browser navigation.

Hide the sidebar when you need more horizontal space, like when reviewing a long list of bills and wanting to see more columns at once, comparing bill amounts or due dates across multiple rows, or working on a smaller screen where space is limited. Show it again when you need to navigate to a different page, check your calendar, or access other features. The toggle is instant, so you can switch back and forth as needed.

#### Add Bill Button

Clicking the Add Bill button opens a dialog overlay with the bill creation form. The current page remains visible in the background, and you return to the same position after saving or canceling.

#### Tag Filter

Selecting a tag from the tag filter dropdown filters the page to show only bills with that tag. The URL updates to include the selected tag, making the filtered state shareable. An active tag badge appears next to the dropdown, and you can click the X on the badge to clear the filter.

#### Bill Search

Typing in the search input triggers a search after you've entered at least three characters and paused for 300 milliseconds. Matching bills appear in a dropdown below the input. Clicking a result navigates you to the appropriate page with that bill selected.

## Edge Cases & Constraints

**No tags created.** When you haven't created any tags yet, the tag filter doesn't appear. The header shows only the sidebar toggle, Add Bill button, and search. Once you create your first tag, the filter appears on supported pages.

**Settings pages.** Settings pages omit the tag filter even when tags exist, since tag filtering doesn't apply to configuration tasks. The Add Bill button still appears, allowing bill creation from anywhere in the application.

**Empty tag list on filtering pages.** If you delete all your tags after having created some, the tag filter disappears from pages that normally support filtering. The header layout adjusts automatically to accommodate the missing filter.

**Sidebar state persistence.** When you first visit a page, the sidebar is visible by default. If you've hidden it before and return to the same page, it remembers your preference. Refreshing the page with the sidebar hidden keeps it hidden, since the state is preserved in the URL. If someone shares a link with the sidebar hidden (the URL contains `?sidebar=hidden`), opening that link starts with the sidebar hidden. Using the browser's back or forward buttons preserves the sidebar state for each page.

**Mobile screens.** On smaller screens, the header layout adapts to the available width. Controls remain accessible, but spacing may adjust to prevent overlap or crowding.

**Browser zoom.** At different zoom levels, the header maintains its layout and functionality. All controls remain clickable and properly aligned, ensuring the interface works for users who require larger text or interface elements.

## Related Documents

* [Bill Search](./018-bill-search.md) - Search for bills by title across all pages
* [Organizing Bills with Tags](./003-organizing-bills-with-tags.md) - Categorizing bills with tags
