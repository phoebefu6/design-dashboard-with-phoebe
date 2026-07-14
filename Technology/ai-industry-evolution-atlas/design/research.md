# Design Research

research date: 2026-07-14

flow: Executive overview of AI's evolution, followed by guided and self-directed exploration of eras, public-interest evidence, turning points, and source detail.

## Convention scan

Patterns supported by the reviewed work:

- Start with an overview, then reveal detail progressively. Timeline Storyteller distinguishes narrative presentation from exploratory analysis and supports sequential scenes, annotations, filtering, and multiple representations of time. This supports the agreed hybrid structure rather than forcing either a static poster or a raw explorer.
- Keep time orientation persistent. Long historical interfaces become difficult to navigate when viewers lose their place; era labels and a persistent temporal locator should survive transitions between overview and detail.
- Make filtering categorical and legible. Existing AI timelines commonly distinguish event types such as research, breakthroughs, applications, hardware, safety, regulation, and products.
- Put methodology close to the chart. Google Trends, Google Books Ngram, Epoch AI, OECD.AI, and Our World in Data all expose definitions, downloads, source notes, or caveats alongside their visualizations.
- Encode uncertainty visibly. Epoch AI marks estimated technical values and documents confidence ranges instead of presenting every model record as equally precise.
- Preserve access to the underlying records. The European Commission AI Watch timeline links to an open milestone dataset; Epoch AI and Our World in Data expose downloads and source documentation.

## Comparable experiences

### European Commission — AI History Timeline

Pattern to adopt:
- Easy-to-grasp selection of AI breakthroughs from 1950 onward.
- Downloadable milestone dataset and classification by AI domain.

Gap to exploit:
- It is primarily a selected breakthrough chronology. It does not explain changes in public attention, repeated disappointments, or the transition from research field to industry as a layered evidence story.

Source: https://ai-watch.ec.europa.eu/tools/ai-history-timeline_en

### Our World in Data — Artificial Intelligence

Pattern to adopt:
- Clear chart-level sourcing, reuse notes, downloadable data, and explanatory writing.
- Broad coverage spanning publications, conference attendance, funding, jobs, adoption, systems, and public views.

Gap to exploit:
- The topic is distributed across many charts and essays. It is excellent for individual questions but does not provide one memorable historical composition for a 30-second executive scan.

Source: https://ourworldindata.org/artificial-intelligence

### Epoch AI — AI Models Explorer

Pattern to adopt:
- Powerful graph/table switch, filters, downloads, source documentation, estimated-value disclosure, and visible confidence treatment.
- A defensible notable-model dataset can support secondary milestone context from 1950 onward.

Gap to exploit:
- The explorer is optimized for technical model trends. It does not represent public attention or the broader social and policy journey, and its controls are too specialist to serve as the primary executive overview.

Source: https://epoch.ai/data/ai-models

### OECD.AI — Trends & Data

Pattern to adopt:
- Global and policy-relevant evidence across search, news, research, jobs, investment, software, compute, models, patents, and incidents.
- Explicit acknowledgement that defining and measuring AI consistently is difficult.

Gap to exploit:
- Evidence is organized as a suite of separate tools. The opportunity is to link selected measures into one historical story without collapsing their definitions.

Source: https://oecd.ai/en/trends-and-data

### The AI History — Interactive Timeline

Pattern to adopt:
- Guided tour plus direct dragging, search, event selection, and categorical filters.

Gap to exploit:
- A dense chronological event interface answers “what happened when” but gives less support to “what was the public feeling, why did it turn, and what accumulated underneath?”

Source: https://theaihistory.com/

## Pain signals

- Long timelines easily become wordy catalogues. A public discussion of an extensive AI timeline explicitly described it as “quite wordy” even while valuing its breadth. Treat this as anecdotal evidence of the breadth-versus-comprehension tension, not as a population-level finding.
- Pure linear lists make the modern era visually dominate because event frequency and documentation rise sharply. Earlier decades then look empty rather than structurally foundational.
- Collections of unrelated charts make viewers assemble the narrative themselves.
- A single smoothed “AI interest” curve across 75 years would hide changes in source coverage and measurement.
- Dense specialist controls create friction for general viewers; executive scanning needs a strong default view and progressive disclosure.

Anecdotal sources:
- https://www.reddit.com/r/ArtificialInteligence/comments/1idb9xg/
- https://www.reddit.com/r/ClaudeAI/comments/1unrklx/

## Opportunities

1. Create a single visual thesis, then let users inspect the evidence behind each era.
2. Use visual discontinuities when the measurement method changes. The discontinuity is part of the story, not a flaw to conceal.
3. Separate three layers:
   - attention evidence;
   - historical interpretation and turning points;
   - contextual indicators such as models, funding, policy, adoption, and incidents.
4. Give downturns equal structural weight to breakthroughs: winter, disappointment, anxiety, harm, and backlash should alter the composition rather than appear as footnotes.
5. Use density management: an editorially selected default set, with optional expansion to supporting events.
6. Add a visible source-status grammar: direct measure, proxy, estimate, editorial classification, and partial year.
7. Provide two reading speeds: a 30-second executive route and a 5–10 minute documentary route.

## Evidence architecture

No single source should be presented as “public interest” across the complete period. Use separate evidence bands with their own definitions and scales.

### 1950–2019: Published-language attention proxy

Candidate: Google Books Ngram Viewer, using language-specific corpora for terms equivalent to “artificial intelligence,” with normalization by the corpus for each year.

Use:
- Show cultural/published-language attention, not population opinion.
- Keep languages separate or use small multiples; do not average them into a fake global score.
- Document OCR, corpus-composition, phrase-translation, and publication-lag limitations.

Official documentation: https://books.google.com/ngrams/info

### 1979 onward: Global news-attention context

Candidate: GDELT, subject to a technical validation pass on stable query coverage and normalization across dataset generations.

Use:
- Represent share or volume of monitored news coverage mentioning defined AI concepts.
- Do not interpret more coverage as more positive sentiment.
- Clearly mark changes in archive coverage, translation, and GDELT versions.

Official sources:
- https://www.gdeltproject.org/
- https://api.gdeltproject.org/api/v2/summary/summary

### 2004 onward: Search-interest evidence

Candidate: Google Trends worldwide topic data for Artificial Intelligence and carefully defined comparison terms.

Use:
- Treat values as normalized relative search interest from 0–100 within the selected time and geography, not absolute search volume or polling.
- Record query/topic, geography, date range, retrieval date, sampling method, and export.
- Avoid comparing separately downloaded Trends windows without a documented stitching method.

Official documentation:
- https://support.google.com/trends/answer/4365533
- https://support.google.com/trends/answer/4365538

### 2015 onward: Knowledge-seeking proxy

Candidate: Wikimedia Analytics API pageviews for AI-related articles across selected language editions.

Use:
- Show pageviews as knowledge-seeking behavior, not approval or sentiment.
- Keep language editions identifiable and account for redirects, bots/automated agents, missing values, and article-title differences.

Official documentation:
- https://doc.wikimedia.org/generated-data-platform/aqs/analytics-api/
- https://doc.wikimedia.org/generated-data-platform/aqs/analytics-api/concepts/page-views.html

### 2022 onward: Measured public attitudes

Candidate: Stanford HAI AI Index public-opinion chapters and their underlying multinational survey sources.

Use:
- Separate optimism, nervousness, expected impact, trust, job concerns, and regulation preferences rather than treating them as one sentiment score.
- Preserve country coverage, sample, fieldwork year, and question wording.

Official sources:
- https://hai.stanford.edu/ai-index/2025-ai-index-report/public-opinion
- https://hai.stanford.edu/ai-index/2026-ai-index-report/public-opinion

### Supporting context, not the primary attention line

- Selected historical milestones: European Commission AI Watch open timeline as a discovery seed, then verify important events against original papers, institutional archives, legislation, or first-party releases.
- Model development: Epoch AI notable-model data, including its notability and uncertainty fields.
- Research, jobs, investment, patents, search, news, and policy: OECD.AI and the original partner datasets named in its methods.
- Broader contextual charts and derived datasets: Our World in Data, always checking the underlying source and reuse terms.
- Incidents and harms: OECD AI Incidents Monitor and Stanford AI Index responsible-AI reporting, with clear warnings that reported incidents are not the universe of incidents.

## 2026 treatment

- Historical comparable series end at the latest complete year, normally 2025.
- Where data is available through 30 June 2026, display it as “2026 H1” in a visually incomplete segment.
- Never annualize 2026 H1 unless the methodology explicitly calls it a projection; projections are out of v1 scope.
- Attach a dashboard-wide “data through” date and per-source retrieval dates.

## Source hierarchy

1. Original dataset, paper, law, institutional archive, or first-party product/model release.
2. Intergovernmental or academic synthesis with transparent methodology.
3. Reputable secondary synthesis only as a discovery aid or for contextual narrative.
4. Never use unsourced timeline aggregators as final evidence for a substantive claim.

## Design criteria handed to ideation

- The 75-year arc must be legible in 30 seconds.
- Changes of measure must be visible rather than smoothed away.
- Downturns and social costs need equal compositional status with breakthroughs.
- Evidence status and source access must be available without overwhelming the overview.
- The default view must be usable without filters; filters deepen rather than rescue it.
- The result must be structurally distinct from the supplied radial editorial spread.

## Research sources

- https://www.microsoft.com/en-us/research/wp-content/uploads/2018/12/TSCJ2019.pdf
- https://ai-watch.ec.europa.eu/tools/ai-history-timeline_en
- https://ourworldindata.org/artificial-intelligence
- https://epoch.ai/data/ai-models
- https://oecd.ai/en/trends-and-data
- https://theaihistory.com/
- https://books.google.com/ngrams/info
- https://www.gdeltproject.org/
- https://api.gdeltproject.org/api/v2/summary/summary
- https://support.google.com/trends/answer/4365533
- https://support.google.com/trends/answer/4365538
- https://doc.wikimedia.org/generated-data-platform/aqs/analytics-api/
- https://doc.wikimedia.org/generated-data-platform/aqs/analytics-api/concepts/page-views.html
- https://hai.stanford.edu/ai-index/2025-ai-index-report/public-opinion
- https://hai.stanford.edu/ai-index/2026-ai-index-report/public-opinion
- https://oecd.ai/en/site/incidents
