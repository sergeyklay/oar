# Bill Search

- **Status:** Draft
- **Last Updated:** 2025-01-28

## Overview

When you manage many bills, scrolling through lists to find a specific one becomes tedious. Bill Search lets you type a few characters and jump directly to the bill you need, whether it's active or archived.

The search input appears in the header on every major page, giving you a consistent way to find bills from anywhere in the app. Type at least three characters, and matching bills appear in a dropdown. Click a result, and you're taken to the appropriate page with that bill selected and its detail panel open.

This feature aligns with the Active Payer philosophy by requiring conscious action—you must type at least three characters to search. There's no automatic suggestion or predictive text. You actively seek the bill you need, which builds awareness of your financial obligations.

## User Flow

### Trigger

The search input appears in the page header on Overview, Due Soon, Due This Month, Paid Recently, Forecast, Monthly History, and Archive pages. It sits on the right side of the header, aligned with other header controls.

### Search Behavior

Type at least three characters in the search field. The system waits 300 milliseconds after you stop typing before executing the search. This debounce prevents unnecessary queries while you're still entering your search term.

The search matches the beginning of any word in the bill title. For example, searching for "electric" matches "Electric Bill" and "My Electric Company" because both titles contain a word starting with "electric". The search is case-insensitive, so "ELECTRIC" matches "electric" and "Electric".

If you type fewer than three characters, no search runs. The dropdown stays closed, and no queries are sent to the server. This minimum length requirement reduces noise and ensures meaningful searches.

### Results Display

When matches are found, a dropdown appears below the search input. Each result shows the bill's category icon and title. Results include both active and archived bills, so you can find any bill regardless of its status.

The dropdown displays up to 20 results, ordered alphabetically by title. If more than 20 bills match your query, only the first 20 appear. This limit keeps the interface responsive and prevents overwhelming dropdowns.

### Navigation

Clicking a search result navigates you to the appropriate page. If the bill is archived, you're taken to the Archive page. If it's active, you're taken to the Overview page. The URL includes a `selectedBill` parameter with the bill's ID, which opens the bill's detail panel automatically.

After navigation, the search input clears, the dropdown closes, and the page renders with your selected bill highlighted in the list and its detail panel visible on the right side.

### Closing the Dropdown

The dropdown closes when you click outside the search component, press the Escape key, or select a result. The search input retains its value until you select a result or manually clear it, but the dropdown only shows when there are results to display.

## Edge Cases & Constraints

**Short queries.** If you type fewer than three characters, no search executes. The dropdown remains closed, and no server requests are made. This prevents unnecessary database queries for incomplete searches.

**No results.** If your search matches no bills, the dropdown doesn't appear. The search input remains visible, and you can modify your query or clear it.

**Whitespace handling.** Leading and trailing whitespace in your query is trimmed before searching. Multiple spaces between words are treated as a single separator. For example, "  electric   bill  " becomes "electric bill" before matching.

**Word matching.** The search matches the start of words, not substrings within words. Searching for "bill" matches "Electric Bill" and "Monthly Bill" but not "Billing Statement" because "billing" doesn't start with "bill". This word-boundary matching keeps results relevant.

**Multiple words.** When you search for multiple words, all words must match. Searching for "electric bill" only returns bills whose titles contain words starting with both "electric" and "bill". This AND logic narrows results to bills that match your complete intent.

**Case sensitivity.** The search is case-insensitive. "ELECTRIC" matches "electric" and "Electric". The system converts your query to lowercase before matching, so capitalization doesn't affect results.

**Archived bills.** Search includes archived bills in results. If you search for a bill you archived, clicking it takes you to the Archive page instead of Overview. This ensures you can find any bill, regardless of its status.

**Query length limit.** Search queries are limited to 100 characters. If you type more than 100 characters, the server action returns an error. This prevents excessively long queries that could impact performance.

**Result limit.** Search returns a maximum of 20 results. If more than 20 bills match your query, only the first 20 appear, ordered alphabetically. This limit keeps the dropdown manageable and ensures fast rendering.

**Offline behavior.** Search queries your local SQLite database, so it works offline. There are no external API calls or network dependencies. All search logic runs on your machine, preserving data sovereignty.

**Special characters.** The search handles special characters in bill titles, but your query is matched literally. If a bill title contains punctuation or special characters, you must include those in your search query to match it.

**Empty database.** If you have no bills yet, searching returns no results. The dropdown doesn't appear, and you can continue typing or clear the input.

**Rapid typing.** The 300-millisecond debounce prevents a search from running on every keystroke. If you type quickly, the search waits until you pause for 300 milliseconds before executing. This reduces server load and improves responsiveness.

**Navigation state.** After selecting a search result, the `selectedBill` parameter in the URL opens the bill's detail panel. If you navigate away and return, the selection is preserved only if the URL parameter remains. Using browser back or forward buttons preserves the selection state.

## Related Documents

* [Overview View](./005-overview-view.md) - The main view for managing all bills
* [Archive View](./013-archive-view.md) - Viewing and managing archived bills
* [Bill Detail Panel](./009-bill-detail-panel-and-skip-payment.md) - The panel for managing a specific bill
* [Page Header](./019-page-header.md) - Common header controls available on all pages

