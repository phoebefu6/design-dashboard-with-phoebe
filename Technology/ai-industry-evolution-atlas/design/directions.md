# Visual Directions

status: Revised after user review — the original A/B/C directions are superseded because they did not preserve the requested flower-shaped evolutionary map. No dashboard implementation has started.

shared product name for exploration: **The Long Wave of AI**

shared subtitle: **From research field to global industry, 1950–2026 H1**

## Selected direction — Evolution Garden

user correction: The design must visibly retain the reference's flower-shaped radial charts and branching evolution-map structure.

principle: AI history grows as a branching knowledge system. Each bloom represents an era or paradigm; petal shape shows the changing intensity of public attention within that era, while spokes and outer marks identify breakthroughs, disappointments, harms, and policy responses.

layout logic:
- One large botanical evolution map dominates the canvas.
- The map grows chronologically from a 1950 root into symbolic AI, expert systems, statistical learning, deep learning, and generative AI branches.
- Era blooms vary in size according to editorial importance, never raw event count.
- A selected bloom opens inside a large circular inspection lens with readable labels and source marks.
- A concise “how to read” column sits beside the map.
- Scroll advances along the trunk; direct selection allows free exploration.

radial encoding:
- angular position: time within the era
- petal radius: normalized public-attention evidence within that era only
- black spoke: sourced turning point
- filled endpoint: breakthrough or adoption event
- hollow endpoint: disappointment, harm, backlash, or governance response
- inner segmented ring: evidence coverage and method changes
- outer dotted halo: supporting events hidden at executive zoom

primary action: Select a bloom or follow the root-to-canopy guided path.

optimizes:
- Strong visual relationship to the user's reference
- Memorable portfolio identity
- Clear sense that modern AI grew from multiple historical lineages
- Natural zoom from executive overview into sourced detail

sacrifices:
- Radial charts require a prominent reading key
- Exact cross-era value comparison is intentionally limited because the evidence methods differ
- Mobile needs a guided vertical sequence rather than a literal shrink of the desktop map

fit to success criteria: Strong, provided the first viewport includes a short executive thesis and the radial encoding remains restrained.

concept board: `./ideate/evolution-garden.svg`

mobile concept board: `./ideate/evolution-garden-mobile.svg`

mobile portrait continuation:
- Target viewport: 390 × 844 CSS px.
- Lead with the takeaway and selected flower; do not stack the explanatory legend above the main visualization.
- Show one era bloom at a time on a vertical lineage, with neighboring eras hinted above and below.
- Tap or keyboard-focus a spoke to reveal the source detail; hover is supplementary on pointer devices only.
- Provide previous/next 48px controls and a lineage stepper as alternatives to scrolling or precise mark selection.
- Opening evidence expands a bottom sheet while leaving the bloom visible in the upper viewport.
- Reduced motion renders the selected era directly and keeps every era reachable through the stepper.
- The mobile screenshot and long description must preserve the same claim, evidence status, and source caveats as desktop.

approval status:
- Desktop Evolution Garden: approved by the user on 2026-07-14 with “lets build!” after the revised flower-map review.
- Mobile Evolution Garden: approved by the user on 2026-07-14 with “ok”.

implementation recommendation: Build this selected direction. Borrow the evidence-status stamps from Era Dossiers, but do not revert to cards as the dominant composition.

## Direction A — Seismic Archive

principle: Read AI history as a sequence of pressure building, public-attention spikes, expectation gaps, and corrections.

layout logic:
- Executive thesis and three takeaways at the top.
- A single wide “seismograph” is the dominant overview: time runs left to right; peaks and valleys show separately defined attention evidence within visibly segmented measurement eras.
- Major breakthroughs sit above the baseline; winters, disappointments, harms, and backlash sit below it.
- A persistent era rail becomes the navigation for scroll chapters.
- Selecting a point opens a right-side evidence drawer with source, geography, evidence status, and related context.

primary action: `Explore the turning points` beside the top-level thesis; direct manipulation of the timeline remains the more important interaction.

components:
- Executive thesis strip
- Segmented attention waveform
- Milestone and consequence annotations
- Era navigator
- Method-change markers
- Evidence-status legend
- Source detail drawer
- 2026 H1 open-ended treatment

optimizes:
- Fast executive comprehension
- Honest display of up/down movement
- Clear comparison of optimism, disappointment, and renewed attention
- A strong default view that does not depend on filters

sacrifices:
- Geography is contextual rather than the dominant overview
- A horizontal long-wave metaphor is less visually surprising than a spatial atlas
- Care is required to prevent the waveform from looking like one comparable metric

fit to success criteria: **Strongest.** It communicates the full arc most quickly while making evidence transitions visually explicit.

concept board: `./ideate/seismic-archive.svg`

## Direction B — Era Dossiers

principle: Treat each historical period as a documentary case file with its own evidence vocabulary, turning points, and global cast.

layout logic:
- A six-panel dossier grid is the overview rather than one continuous chart.
- Each era card has a compact attention trace, defining tension, three selected events, dominant geographies, and evidence status.
- Clicking an era expands it into an immersive chapter while the other dossiers collapse into a persistent index.
- Cross-era comparisons happen through an optional comparison tray, not by forcing all measures onto one axis.

primary action: `Open an era` on each dossier; `Compare eras` is secondary.

components:
- Six era dossier cards
- Compact evidence traces
- Era thesis and selected event list
- Geography chips
- Expandable documentary chapter
- Comparison tray
- Methodology stamps

optimizes:
- Maximum methodological honesty
- General-audience learning
- Clear treatment of uneven historical evidence
- Strong global and editorial storytelling

sacrifices:
- The overall “long wave” is less immediate
- Executives need one extra step to understand the complete rise-and-fall pattern
- Comparing adjacent eras is easier than comparing the first and last eras

fit to success criteria: **Strong.** Best for comprehension and evidence clarity, slightly weaker for the 30-second visual thesis.

concept board: `./ideate/era-dossiers.svg`

## Direction C — Braided Current

principle: Show the present boom as the confluence of several historical currents: research, compute, capital, public attention, and governance.

layout logic:
- A branching flow travels diagonally through time.
- The public-attention current is emphasized; supporting currents widen, narrow, split, or temporarily disappear based on defensible contextual evidence.
- Confluences become major turning points. Dry channels and reversals represent winters, funding contractions, or public backlash.
- Scroll moves the viewport along the current; a minimap permits direct era jumps.
- Selecting a confluence opens a bottom evidence sheet.

primary action: `Follow the current`; the minimap supports direct exploration.

components:
- Braided historical flow
- Confluence nodes
- Current legend
- Era minimap
- Evidence sheet
- Global place annotations
- Source-status glyphs

optimizes:
- Memorable, original portfolio presence
- Communicates that current AI is cumulative and multi-causal
- Handles positive and negative forces without a single health score

sacrifices:
- Highest learning curve
- Stream width could be misread quantitatively unless tightly controlled
- Harder to make accessible and responsive than the other directions
- More complex to validate against exact source semantics

fit to success criteria: **Medium–strong.** Most distinctive, but less reliable for a 30-second C-level read and highest risk of metaphor overpowering evidence.

concept board: `./ideate/braided-current.svg`

## Recommendation

Choose **Direction A — Seismic Archive** as the structural foundation.

Why:
- The user's core question is explicitly about the up-and-down journey.
- The 75-year arc remains visible at once.
- Breakthroughs and downturns can receive equal visual weight.
- Measurement changes can be encoded as visible seams instead of hidden joins.
- It supports both reading speeds: executive overview first, documentary exploration second.

Recommended refinement if selected:
- Borrow the evidence “stamps” and era-level clarity from Direction B.
- Do not combine Direction C's stream widths with the main attention waveform; that would introduce unnecessary semantic ambiguity.

## Shared visual language

tone: Archival documentary, contemporary rather than nostalgic.

palette:
- parchment mist `#F3F0E6`
- carbon ink `#202522`
- evidence teal `#2D7773`
- caution vermilion `#B95D4B`
- archival ochre `#C49B45`
- method violet `#70658B`

type direction:
- Display: editorial serif with restrained contrast
- Interface and data: neutral grotesk sans
- Sources and method labels: compact mono

material:
- Subtle paper grain only at large surfaces
- Fine rules, registration marks, evidence stamps, and archival numbering
- Avoid skeuomorphic book pages, circular flower charts, pastel purple petals, and the supplied reference's open-spread composition

motion:
- Calm documentary pacing
- Scroll reveals evidence and annotations rather than continuously morphing the chart
- Direct interaction uses precise focus transitions
- Full reduced-motion mode with no loss of content

## Decision gate

Select A, B, or C—or specify a deliberate hybrid—before implementation begins.
