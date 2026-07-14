# Technical Design

## Analytical job

Explain change over time and hierarchy/network lineage: how AI developed through related paradigms while public attention rose and fell within separately measured historical eras.

## Artifact family

Primary: bespoke SVG evolutionary map with radial area flowers, source-linked spokes, and scroll-guided documentary chapters.

Fallback: stacked era chapters with static radial flowers, event lists, and the same sources. The fallback is also the reduced-motion and print/export path.

## Surface shape

- One primary visualization instance per page.
- Desktop: complete garden at 900–1440px content width; selected bloom inspector overlays the lower-right map area.
- Mobile portrait: one recomputed bloom at a time at 320–430px; no scaled desktop viewBox.
- Tablet: simplified full garden above 720px when labels fit; otherwise mobile stepper mode.
- Documentary chapters sit below the first-screen atlas. The garden may become sticky during guided reading, but native scrolling remains in control.

## Data and interaction profile

- Seven era/paradigm records.
- Approximately 8–12 petal values per era.
- Approximately 4–8 selected events per era plus supporting-event dots.
- Static, checked-in data snapshot; no live API dependency.
- Selected era and event are the only committed interactive state.
- Desktop: hover previews, click commits, keyboard focus/Enter commits.
- Mobile: tap/focus commits; previous/next controls provide a precision-free path.
- Scroll scenes reveal/highlight eras; no continuous decorative motion.

## State and shareability

- Canonical query parameters: `?era=<id>&event=<id>`.
- Valid URL state overrides defaults.
- Invalid state falls back to the latest complete era and removes invalid parameters on the next committed change.
- `history.pushState` for committed bloom/event selection; `replaceState` for initialization.
- No local storage, accounts, personal data, or remote persistence.

## Rendering architecture

- HTML owns page structure, chapters, sources, accessible summaries, and control semantics.
- JavaScript modules own parsing, normalization, view state, geometry, and URL encoding.
- Inline SVG owns branch paths, flower petals, rings, spokes, endpoints, labels, focus outlines, and printable output.
- Native SVG is preferred over adding a D3 runtime because the data is small, geometry is deterministic, and the repository has no build step. The implementation retains D3-style separation of data, derived geometry, rendering, and state. D3 becomes the fallback if collision handling, scales, or mark volume materially grow.
- CSS owns responsive layout, design tokens, focus treatment, selected state, print, and reduced-motion behavior.

## Flower coordinate encoding

- Angular position: ordered observation or event time within the era.
- Petal radius: value normalized only within the source series and era.
- Inner ring: evidence coverage/method identity.
- Spoke: sourced turning point aligned to time order.
- Filled endpoint: breakthrough/adoption.
- Hollow endpoint: setback, harm, backlash, or governance response.
- Dotted halo: supporting events available in the evidence panel.
- Selection: outer bracket/outline and stronger connector, not another magnitude ring.

## Performance

- Expected SVG DOM: under 400 elements in the overview; under 250 in mobile selected mode.
- No continuous animation loop.
- IntersectionObserver updates one active era at chapter boundaries.
- ResizeObserver recomputes geometry only when the container crosses a responsive mode or materially changes size.
- Checked-in data is small enough to inline or fetch locally without virtualization.

## Accessibility

- Each era and event is a real button or focusable SVG group with an accessible name and large invisible hit region.
- Key insight and caveats remain visible without interaction.
- A long description and complete event/source list provide a non-visual equivalent.
- Color roles have redundant endpoint shapes and text labels.
- `prefers-reduced-motion` removes scroll transitions and renders selected/final scene states immediately.
- Print view expands chapters and removes sticky behavior.

## Maintenance

- Source data, editorial event selection, and geometry inputs are separate JSON files.
- A reproducible Python preparation script validates ids, dates, evidence status, source URLs, and partial-year labels.
- No third-party runtime library or CDN dependency.
- Geometry functions remain pure and receive dimensions, data, and selection state.

## Visualization layer mini-briefs

### Evolution garden

- Story job: prove that the modern boom grew from older lineages and cyclical attention.
- Data shape: seven-node chronological tree with era-local time series and sourced events.
- Primary specialist: D3/SVG visualization reasoning, implemented with native SVG.
- Supporting specialists: scrollytelling, accessibility, testing.
- QA: geometry/data invariant tests, desktop/mobile screenshots, keyboard selection, URL restore.
- Fresh-pass status: local specialist pass; subagents were not authorized.

### Documentary chapters

- Story job: explain what changed in each era and why attention turned.
- Data shape: ordered scenes with annotations, supporting indicators, and bibliography links.
- Primary specialist: scrollytelling.
- Supporting specialists: SVG, accessibility, testing.
- QA: enter/exit/reverse/fast-scroll/reduced-motion checks and static screenshot review.
- Fresh-pass status: local specialist pass.

### Bloom inspector

- Story job: connect every visible spoke and petal to evidence and context.
- Data shape: selected era plus selected event and source metadata.
- Primary specialist: SVG interaction and annotation.
- Supporting specialists: accessibility and testing.
- QA: hover/tap/focus equivalence, 44px hit areas, focus ring, event detail/source update.
- Fresh-pass status: local specialist pass.

## QA plan

- Unit: era/event id uniqueness, chronological order, normalization bounds, evidence-status vocabulary, 2026 partial label, URL codecs.
- DOM: sections and source links present, accessible button names, long description, no critical text below mobile floor.
- E2E: era/event selection, URL restore, back/forward, method disclosure, reduced motion.
- Visual: approved desktop and mobile proportions, no clipping/collision, 320/390/414/768/1440/1920 viewports.
- Export: static screenshot and print layout preserve title, claim, selected flower, source/caveat, and evidence status.
