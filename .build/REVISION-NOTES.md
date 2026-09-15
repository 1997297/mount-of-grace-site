# Mount of Grace website revision

Revised through 15 September 2026, including the owner's confirmed details and final CTA adjustments.

## Content and structure

- Home, Programs, programme details, sponsorship options and footers now use the five approved programmes: Food & Financial Aid for Widows and the Elderly; Christmas Outreach for the Less Privileged; Support for the Physically Challenged; Medical Outreach; Education & Youth Development.
- Removed the old standalone shelter/housing, diaspora, community development, emergency relief and women's empowerment content. Useful support content was rewritten around the approved scope.
- The former community-dev.html, diaspora-giving.html and womens-empowerment.html URLs redirect to Programs. They no longer advertise retired programmes.
- Nigeria and the United States are both described as places where MOG works. Mission and vision remain in their existing About sections.
- Seven years of operation is used throughout. Unsupported origin anecdotes, large historical totals and named beneficiary stories were replaced. Impact examples are explicitly illustrative.
- Home retains its existing components and video, with five programme cards and the three requested involvement pathways. Existing fonts, colours, CSS, breakpoints and animations remain in place.
- Contact's original Follow our work section and Google Maps button were restored exactly as requested, including their original destinations.

## Impact figures

The final displayed figures are 1,384 people reached, 180 households supported, 240 medical outreach participants, 263 young people supported, 89 people receiving mobility support, 36 outreach activities, seven years and two countries. The visible provisional notice was removed at the owner's request. The home reach total matches Impact.

Edit `.build/impact-data.json`, then run `node .build/update-impact.js` to update marked figures across the HTML pages. These are owner-directed website figures; no independent verification of outreach records was performed. The remaining previously provisional estimates should be reconciled with official records when available. Programme categories can overlap.

## Media

- Gallery: 89 real photos, in sequence using `assets/1_result.webp` and `assets/2.webp` through `assets/89.webp`.
- Videos: 25 slots labelled `v1` through `v25`, using the actual case of the existing filenames. The missing `assets/v19.mp4` source is retained for the owner to supply. No media was renamed or fabricated.
- Photos use native lazy loading and intrinsic dimensions. Gallery MP4s are not requested at initial page load. Video previews load on interaction; playback happens in the viewer.
- From the Field contains nine photos, in this order: `6.webp`, `36.webp`, `21.webp`, `48.webp`, `3.webp`, `67.webp`, `1_result.webp`, `82.webp`, `89.webp`. The existing preview grid, cropped window and fade are preserved.
- Existing broken programme and inner-page hero paths were corrected to their available local WebP files.

## Files

Updated existing pages: `index.html`, `about.html`, `programs.html`, `impact.html`, `gallery.html`, `involved.html`, `donate.html`, `sponsorship.html`, `accounts.html`, `contact.html`, `education-youth.html`, `healthcare.html`, `privacy-policy.html`, `terms-of-us.html`, `devdrey.html`.

Added programme pages: `food-financial-aid.html`, `christmas-outreach.html`, `disability-support.html`.

Converted to redirects: `community-dev.html`, `diaspora-giving.html`, `womens-empowerment.html`.

Updated shared scripts: `script.js` for deferred gallery media, viewer recovery/accessibility and focus handling for collapsed homepage cards; `supabase-forms.js` for one timeout-message punctuation correction only.

Updated supporting files: `.build/content.js`, `.build/build-stubs.js`, `.build/shared.js`, `.build/build-pages.js`, `.build/test-forms.js`. Added `.build/impact-data.json`, `.build/update-impact.js`, `.build/verify-revisions.js`, `.build/browser-check.js` and this note. Current programme generation no longer restores outdated legal or credits content.

The existing CSS is preserved, with a scoped addition for compact, side-by-side CTA buttons and two-line CTA headings. Historical `.build/backup` files are retained for reference and are not the current content source.

## Verification

- `node .build/verify-revisions.js`: passed for all 21 HTML files, exact local filename casing, internal destinations, programme scope, gallery sequence, nine field images, corrected totals and JavaScript syntax. The only expected absent asset is `v19.mp4`.
- Chrome layout checks passed on every page at 1440, 1024, 768, 390 and 320 pixels. No document overflow or missing navigation controls was found.
- Interaction checks passed for mobile menus, programme accordions, gallery filters, keyboard lightbox navigation, focus restoration, missing-video recovery, video cleanup and donation amount/frequency navigation.
- Contact, volunteer and sponsorship success/error flows and receipt upload were tested using intercepted local responses. No test messages, database rows, payments or receipts were sent to live services. Live backend configuration was not changed or independently verified.
- Desktop and mobile screenshots of programmes, sponsorship, impact figures, field images, gallery and restored Contact content were visually reviewed.

To repeat the browser check, start `node .build/server.js 8766`, then run `node .build/browser-check.js`. It uses Chrome and writes screenshots to a temporary folder. The older `.build/test-forms.js` and `.build/test-error-path.js` utilities still target live services; they were not run during this revision.

## Confirmed corrections applied on 15 September 2026

- The visible and copied US bank account number is now `4830291760554`.
- The founder name and portrait alt text now read **Mrs. Dunni Falano**. Her card has a general paragraph about leadership, compassion and service, without invented biographical details. The other team cards remain unchanged.
- Contact and the existing footer contact columns now use **0813 209 7971**, **0806 913 5196** and **0703 118 1996**, with international-format telephone links.
- Privacy wording is general and no longer claims fixed retention schedules, formal safeguarding or other unconfirmed internal systems. Related unsupported procedural claims in Terms were removed. Existing registration details remain unchanged and are confirmed by the owner.
- The homepage Outreach in action card now uses `assets/V1.mp4`, already in the gallery.
- Paired hero and final CTA buttons now use compact sizing and remain side by side, including on phones. The nine occurrences of the ?Someone's story can change? heading use a separate, smaller second line, ?because you chose to help.?
- Social placeholders, the restored Google Maps destination and the existing gallery/video implementation remain as directed by the owner. The owner is handling the missing video file manually.

Files changed in this follow-up: `accounts.html`, `about.html`, `contact.html`, `index.html`, `privacy-policy.html`, `terms-of-us.html`, the remaining pages with shared footer phone details, `styles.css`, `.build/shared.js`, `.build/build-stubs.js` and this note.

Static comparison confirms the other team cards, registration references, social block, Google Maps link, gallery media structure and shared interaction scripts remain unchanged. The existing stylesheet is unchanged before the new CTA rules.
