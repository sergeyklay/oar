# ADR-002: Client-Side Only Date Rendering Strategy

- **Status:** Accepted
- **Last Updated:** 2025-01-23

## Context

Oar runs inside a Docker container that operates in UTC time. Users access the application from their local machines, which may be in any timezone. When a Server Component renders a date using `date-fns`'s `format()` function, it produces HTML based on the server's UTC timezone. When React hydrates that HTML on the client, it runs the same formatting logic using the user's local timezone. The server HTML says "Jan 23, 2025 12:00 UTC" while the client expects "Jan 23, 2025 07:00 EST". React detects this mismatch and throws a hydration error.

This problem appears in two scenarios. First, Server Components that call `format(new Date(), ...)` produce different timestamps on the server versus the client because the `new Date()` call happens at different moments. Second, Server Components that format dates from the database render in UTC, but the client expects local time. Both cases cause React to reject the server-rendered HTML during hydration.

The industry default is to normalize all dates to UTC on the server and format them on the client. This works for REST APIs where the client controls rendering, but Next.js Server Components render HTML on the server. We can't format dates on the server in the user's timezone because we don't know the user's timezone until JavaScript runs in the browser.

## Decision

Oar enforces a strict client-side-only date rendering strategy. All date formatting happens after React hydrates on the client. We introduced a shared `ClientDate` component that handles this pattern consistently across the application.

### The ClientDate component

The `ClientDate` component (`components/ui/client-date.tsx`) uses a mount detection pattern to ensure it only renders formatted dates after the component mounts on the client. During Server-Side Rendering, it returns a non-breaking space (`&nbsp;`) that preserves layout without rendering mismatched text. After the component mounts, a `useEffect` hook sets an `isMounted` flag, triggering a re-render that displays the actual formatted date.

The component accepts `string`, `number`, or `Date` objects as input. This flexibility decouples the UI from the database schema. If we store dates as timestamps, strings, or Date objects, the component handles the conversion. We avoid complex database migrations just to change how dates are stored.

### Enforcement rule

We strictly forbid direct usage of `format(date, ...)` within JSX in both Server Components and Client Components. Any date that appears in the UI must pass through `ClientDate`. This rule applies to all components, regardless of whether they're server or client components. Even Client Components can cause hydration issues if they render dates during the initial server render.

This enforcement prevents hydration errors, but it also guarantees users see dates in their local timezone. A bill due date stored as "2025-01-23T12:00:00Z" in the database displays as "Jan 23, 2025" for a user in EST and "Jan 24, 2025" for a user in JST. The user's browser timezone determines the display, not the server's UTC timezone.

## Consequences

### Benefits

**Hydration error elimination:** React no longer detects mismatches between server and client HTML. The server renders a placeholder, the client initially renders the same placeholder, then updates with the actual date after mounting. React sees consistent initial render output.

**Local timezone accuracy:** Users always see dates in their local timezone. A bill due on January 23rd displays as January 23rd regardless of whether the user is in New York, Tokyo, or London. The server doesn't need to know the user's timezone.

**Layout stability:** The non-breaking space placeholder maintains the layout structure. When the date appears after mounting, it doesn't cause content shift or layout jumps. The space reserves the exact width needed for the formatted date.

**Type flexibility:** The component accepts multiple input types, which simplifies database schema changes. We can migrate from timestamp integers to ISO strings without updating every component that displays dates.

**Consistent pattern:** All date formatting uses the same component. Developers don't need to remember different patterns for Server Components versus Client Components. One component handles all cases.

### Trade-offs

**Initial render delay:** Dates appear after the component mounts, which typically takes less than 100 milliseconds. During this brief window, users see a non-breaking space instead of the date. For most use cases, this delay is imperceptible. For critical dates like payment due dates, the delay is acceptable because the date appears before the user needs to interact with it.

**SEO consideration:** Search engines see the placeholder during initial render. This doesn't affect Oar because it's a personal finance app that requires authentication. Search engines don't index authenticated content, so the placeholder doesn't impact discoverability.

**Test complexity:** Tests that verify date rendering must account for the asynchronous nature of `ClientDate`. Test assertions need to wait for the component to mount and render the actual date. This adds complexity compared to testing synchronous date formatting, but the pattern is consistent and testable.

**Bundle size:** The component adds a small amount of JavaScript to the client bundle. The `useEffect` hook and mount detection logic add minimal overhead. The benefit of eliminating hydration errors outweighs the small bundle size increase.

## Rejected alternatives

### Server-side timezone detection

We could detect the user's timezone via headers or cookies and format dates on the server in the user's timezone. Rejected because:

- Requires storing timezone preferences in the database
- Adds complexity to every Server Component that renders dates
- Doesn't solve the `new Date()` timing issue
- Users can change timezones without updating their preferences

### Suppress hydration warnings

React provides a `suppressHydrationWarning` prop that masks hydration mismatches. Rejected because:

- Masks the problem rather than solving it
- Can lead to other React rendering issues
- Doesn't guarantee consistent date display
- Violates React's recommended patterns

### Date formatting in Server Actions

We could format dates in Server Actions before passing them to components. Rejected because:

- Breaks separation of concerns; formatting is presentation logic
- Doesn't help with dates calculated in components
- Still requires timezone handling on the server
- Makes components less reusable

### UTC normalization with client conversion

We could store all dates in UTC and convert them on the client using a utility function. Rejected because:

- Requires every component to remember to call the conversion function
- Easy to forget in new components
- Doesn't solve the hydration issue if formatting happens during SSR
- Adds complexity without solving the core problem

## Verification

You know this strategy is working correctly when:

1. No hydration errors appear in the browser console when viewing pages with dates
2. Dates display in the user's local timezone, not UTC
3. Dates appear after a brief moment (less than 100ms) on initial page load
4. All date formatting in the codebase uses `<ClientDate />` instead of direct `format()` calls
5. Tests that verify date rendering wait for the component to mount before asserting

