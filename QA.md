# Demo verification

Checked September 17, 2026. This is a bounded prototype review, not a WCAG conformance audit or production certification.

## Passed locally

- Four Node tests: combined event filters, business search/category intersection, leap-year/calendar alignment, and month/year boundaries.
- Browser interaction tests in Microsoft Edge (Chromium) at 1440, 390 and 320 CSS pixels wide.
- Event search and category selection, empty results, list/calendar switching, month navigation, and event detail previews.
- Business search and category intersection, empty results, and business detail previews.
- Art Trail and Farmers Market concept previews.
- Native dialog Escape dismissal and focus restoration to the opening control.
- First keyboard stop reaches the skip link; accessible names on search fields; visible keyboard focus.
- Mobile menu opens and closes after navigation.
- No document-level horizontal overflow at the three tested widths, including mobile calendar view.
- Reduced-motion preference disables smooth scrolling.
- No JavaScript runtime exceptions during the interaction suite.
- Desktop full-page and mobile screenshots visually reviewed. A mobile search-layout overflow found in the first pass was fixed and the interaction suite rerun successfully.

## Not verified or implemented

Safari/Firefox behavior, a full screen-reader audit, comprehensive contrast and zoom testing, and a legal accessibility assessment remain out of scope. No production CMS, authentication, backend, data persistence, recurrence editor, operational backup/recovery or performance SLA is implemented.

The data helper tests can be rerun with `npm test`. Browser checks above were run from the preparation workspace using its supplied Playwright runtime; follow the interactions in README to reproduce manually.
