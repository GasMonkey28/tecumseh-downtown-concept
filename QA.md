# Demo verification

Checked September 17, 2026. This is a bounded prototype review, not a WCAG conformance audit or production certification.

## Version 2: verified locally and on GitHub Pages

The expanded version 2 interaction suite passed locally and against the [public demonstration](https://gasmonkey28.github.io/tecumseh-downtown-concept/) on September 17, 2026. The deployed implementation commit was 6309214ab0c5e6203ff108a62d5a9fe1c7ffa292; subsequent changes document verification and version the same assets. Node tests ran locally.

- Four Node tests: combined event filters, business search/category intersection, leap-year/calendar alignment, and month/year boundaries.
- Browser interaction tests in Microsoft Edge (Chromium) at 1440, 1024, 768, 390 and 320 CSS pixels wide.
- Event search and category selection, empty results, list/calendar switching, month navigation, and event detail previews.
- Business search and category intersection, empty results, and business detail previews.
- Three selectable fictional Art Trail stops, expandable market FAQs, and three sample itinerary modes with working business detail links.
- Date-range filtering, invalid-range handling, filter reset, featured-event controls and direct event URLs.
- Native dialog Escape dismissal and focus restoration to the opening control.
- First keyboard stop reaches the skip link; accessible names on search fields; visible keyboard focus.
- Mobile menu opens and closes after navigation; Escape restores focus to its toggle.
- No document-level horizontal overflow at the five tested widths, including mobile calendar view.
- Reduced-motion preference disables smooth scrolling.
- No JavaScript runtime exceptions during the interaction suite; all in-page anchor targets and displayed image resources resolve.
- Desktop full-page and mobile screenshots visually reviewed. A narrow mobile date-input layout found during visual review was fixed and the interaction suite rerun successfully.

## Not verified or implemented

Safari/Firefox behavior, a full screen-reader audit, comprehensive contrast and zoom testing, and a legal accessibility assessment remain out of scope. No production CMS, authentication, backend, data persistence, recurrence editor, operational backup/recovery or performance SLA is implemented.

The data helper tests can be rerun with `npm test`. Browser checks above were run from the preparation workspace using its supplied Playwright runtime; follow the interactions in README to reproduce manually.
