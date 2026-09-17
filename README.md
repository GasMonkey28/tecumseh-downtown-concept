# Downtown, together — Tecumseh concept

An independent, unsolicited website concept by Vince Ma. **Not an official City of Tecumseh or Downtown Development Authority website.** This is a portfolio demonstration, not commissioned work, a completed client engagement, an endorsement, or evidence of meeting the RFP's completed-project requirement.

## Try the experience

The interface starts in **May 2027**, a fixed demonstration month. All six event records and four business profiles are fictional. No actual event dates, merchants, opening hours, addresses, tickets or availability are asserted.

1. Browse the May events, filter Arts & culture, and open an event detail.
2. Switch to Calendar and move to June. Search works in both views.
3. Search businesses for `coffee`, or choose a category. Try a query with no match.
4. Open the Art Trail and Farmers Market concept previews.
5. Try the mobile navigation, keyboard controls, Escape to dismiss details and reduced-motion preference.

## What this demonstrates

- Event-first homepage and visitor-centered information hierarchy.
- Searchable business directory and reusable detail patterns.
- Responsive visual design with original, locally stored SVG/CSS artwork.
- Native dialog, semantic headings, form labels, focus indicators, result announcements and reduced-motion support.
- A small, dependency-free static implementation in HTML, CSS and JavaScript.

The warm palette, serif typography and illustrated streetscape are **design proposals**, not approved City branding. The street, sculpture, produce and decorative map are original abstractions, not accurate representations of Tecumseh assets. This uses no City logo, third-party stock images, analytics, trackers, remote fonts, API keys or paid services.

## Honest scope

This prototype has **no CMS, staff authentication, persistence, recurring-event authoring, production form submissions, bookings, payments or hosting/support SLA**. Date and category filtering use an in-browser sample data set. The decorative map is not navigational. Artwork and business detail previews explain proposed workflows, not implemented full modules.

Accessibility features are included and tested as documented in `QA.md`; this is not a WCAG conformance certification. A complete project would require approved content, a suitable CMS, accessibility review, migration and redirects, training, security/backup/recovery planning, and an agreed long-term support scope.

## Run locally

With a supported Node.js runtime, no dependency installation is needed:

```sh
npm start
# http://127.0.0.1:4173
npm test
```

Opening the HTML directly using `file://` will not reliably load JavaScript modules. Serve the directory over HTTP. GitHub Pages can publish the repository root with no build step.

## Files

- `index.html`: content structure and clearly visible demonstration labels
- `styles.css`: responsive design and original CSS illustrations
- `data.js`: fictional data and pure search/calendar helpers
- `app.js`: client-side controls, rendering and detail dialogs
- `assets/downtown.svg`: original concept illustration
- `tests/data.test.mjs`: search intersection and calendar edge cases
- `scripts/serve.mjs`: local-only preview server

## Source context and authorship

The feature priorities were informed by the [official RFP announcement](https://www.downtowntecumseh.com/events/RFP%20for%20Downtown%20Tecumseh%20Website%20redesign) and the September 14, 2026 RFP, especially sections 7–15 and 28. The live [official Downtown Tecumseh website](https://www.downtowntecumseh.com/) remains the source for visitor information. No official documents, private correspondence or bidder contact records are included in this repository.

Prepared for Vince Ma with AI-assisted implementation using Codex. This repository documents the actual demo scope; it does not claim an unaided development process, historical municipal experience or a client engagement.
