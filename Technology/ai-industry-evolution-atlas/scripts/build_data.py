#!/usr/bin/env python3
"""Build the checked-in Evolution Garden data snapshot from official raw exports."""

from __future__ import annotations

import json
import math
from collections import defaultdict
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "data" / "raw"
OUTPUT = ROOT / "data" / "dashboard.json"

NGRAM_URL = (
    "https://books.google.com/ngrams/json?content=artificial%20intelligence"
    "&year_start=1950&year_end=2019&corpus=en-2019&smoothing=0&case_insensitive=true"
)
PAGEVIEWS_URL = (
    "https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/en.wikipedia.org/"
    "all-access/user/Artificial_intelligence/monthly/2015070100/2026063000"
)

SOURCES = {
    "ngram": {
        "id": "ngram",
        "name": "Google Books Ngram Viewer",
        "url": "https://books.google.com/ngrams/info",
        "dataUrl": NGRAM_URL,
        "status": "proxy",
        "coverage": "English-language books, 1950–2019",
        "method": "Case-insensitive annual frequency for ‘artificial intelligence’; values are averaged into display bins.",
        "meaning": "Published-language attention proxy, not public sentiment or adoption.",
    },
    "pageviews": {
        "id": "pageviews",
        "name": "Wikimedia Analytics API",
        "url": "https://doc.wikimedia.org/generated-data-platform/aqs/analytics-api/",
        "dataUrl": PAGEVIEWS_URL,
        "status": "direct",
        "coverage": "English Wikipedia, user pageviews, July 2015–June 2026",
        "method": "Monthly all-access user views of the Artificial intelligence article; summed by year or half-year.",
        "meaning": "Direct page-request count and a knowledge-seeking proxy; it is not population reach.",
    },
    "aiwatch": {
        "id": "aiwatch",
        "name": "European Commission Joint Research Centre — AI Watch",
        "url": "https://ai-watch.ec.europa.eu/publications/historical-evolution-artificial-intelligence_en",
        "status": "secondary",
        "coverage": "Historical synthesis published 2021",
        "method": "Editorial periodization and selected turning points.",
        "meaning": "Context source for boom–bust interpretation; not a quantitative series.",
    },
    "opinion": {
        "id": "opinion",
        "name": "Stanford HAI — 2026 AI Index, Public Opinion",
        "url": "https://hai.stanford.edu/ai-index/2026-ai-index-report/public-opinion",
        "status": "direct",
        "coverage": "Survey results collected in 2025 and published in 2026",
        "method": "Reported global survey shares; kept separate from attention proxies.",
        "meaning": "Attitudes toward AI products and services, not usage or page interest.",
    },
}

ERAS = [
    {"id": "foundations", "title": "Foundations", "years": "1950–1969", "start": 1950, "end": 1969, "source": "ngram", "color": "#3b817b", "branch": "symbolic inquiry", "thesis": "A field receives a name, a test, and a burst of confidence that machines can represent intelligence."},
    {"id": "first-winter", "title": "First winter", "years": "1970–1982", "start": 1970, "end": 1982, "source": "ngram", "color": "#987357", "branch": "limits exposed", "thesis": "Ambition runs into limited compute, brittle methods, and promises that evaluation cannot sustain."},
    {"id": "expert-systems", "title": "Expert systems", "years": "1983–1996", "start": 1983, "end": 1996, "source": "ngram", "color": "#718668", "branch": "rules at work", "thesis": "Codified expertise reaches organizations, then maintenance cost and market collapse cool the second boom."},
    {"id": "statistical-learning", "title": "Statistical learning", "years": "1997–2011", "start": 1997, "end": 2011, "source": "ngram", "color": "#517c91", "branch": "data over rules", "thesis": "Benchmarks, web-scale data, and probabilistic learning quietly rebuild the field’s credibility."},
    {"id": "deep-learning", "title": "Deep learning", "years": "2012–2016", "start": 2012, "end": 2016, "source": "ngram", "color": "#b06855", "branch": "representation learned", "thesis": "GPU-trained neural networks turn benchmark jumps into a new platform for perception and play."},
    {"id": "foundation-models", "title": "Foundation models", "years": "2017–2021", "start": 2017, "end": 2021, "source": "pageviews", "color": "#716486", "branch": "scale and reuse", "thesis": "Transformers and large pretrained models concentrate capability while fairness and governance move inward."},
    {"id": "public-encounter", "title": "Public encounter", "years": "2022–2026 H1", "start": 2022, "end": 2026, "source": "pageviews", "color": "#c49436", "branch": "mass use and response", "thesis": "Generative systems meet everyday users; adoption, anxiety, labor conflict, and law rise together."},
]

EVENTS = [
    ("turing", "foundations", "1950-10-01", "Computing machinery and intelligence", "breakthrough", "Turing reframes machine intelligence as an observable imitation game.", "Oxford Academic", "https://academic.oup.com/mind/article/LIX/236/433/986238"),
    ("dartmouth", "foundations", "1955-08-31", "The field is named", "breakthrough", "The Dartmouth proposal uses ‘artificial intelligence’ for a 1956 research project.", "Stanford archive", "https://www-formal.stanford.edu/jmc/history/dartmouth/dartmouth.html"),
    ("perceptron", "foundations", "1958-11-01", "The perceptron learns", "breakthrough", "Rosenblatt describes a probabilistic model for information storage and organization.", "APA PsycNet", "https://psycnet.apa.org/record/1959-09865-001"),
    ("eliza", "foundations", "1966-01-01", "ELIZA mirrors conversation", "adoption", "Weizenbaum demonstrates how simple language patterns can produce an illusion of understanding.", "ACM", "https://dl.acm.org/doi/10.1145/365153.365168"),

    ("perceptrons-limits", "first-winter", "1969-01-01", "Neural limits become explicit", "setback", "A formal critique helps narrow enthusiasm for early perceptrons.", "MIT Press", "https://mitpress.mit.edu/9780262631112/perceptrons/"),
    ("lighthill", "first-winter", "1973-01-01", "Public funding confidence falls", "setback", "The Lighthill review becomes a landmark in the first AI winter narrative.", "European Commission AI Watch", "https://ai-watch.ec.europa.eu/publications/historical-evolution-artificial-intelligence_en"),
    ("xcon", "first-winter", "1980-01-01", "XCON finds commercial value", "adoption", "A rule-based system configures computer orders and signals a practical revival.", "AAAI", "https://ojs.aaai.org/aimagazine/index.php/aimagazine/article/view/507"),
    ("fifth-generation", "first-winter", "1982-01-01", "Japan backs fifth-generation computing", "adoption", "A national program renews competition around knowledge processing.", "Computer History Museum", "https://www.computerhistory.org/collections/catalog/102653262"),

    ("backprop", "expert-systems", "1986-10-09", "Backpropagation returns", "breakthrough", "Multi-layer networks learn internal representations through error propagation.", "Nature", "https://www.nature.com/articles/323533a0"),
    ("lisp-collapse", "expert-systems", "1987-01-01", "The expert-systems market contracts", "setback", "Specialized hardware and costly rule maintenance fail to sustain the boom.", "European Commission AI Watch", "https://ai-watch.ec.europa.eu/publications/historical-evolution-artificial-intelligence_en"),
    ("second-winter", "expert-systems", "1990-01-01", "A second winter settles in", "setback", "Investment and attention retreat while learning research continues under quieter labels.", "European Commission AI Watch", "https://ai-watch.ec.europa.eu/publications/historical-evolution-artificial-intelligence_en"),
    ("svm", "expert-systems", "1995-09-01", "Support-vector networks", "breakthrough", "A statistical learning method delivers strong generalization from high-dimensional data.", "Springer", "https://link.springer.com/article/10.1007/BF00994018"),

    ("deep-blue", "statistical-learning", "1997-05-11", "Deep Blue wins the rematch", "adoption", "IBM’s chess system defeats world champion Garry Kasparov in a six-game match.", "IBM", "https://www.ibm.com/history/deep-blue"),
    ("deep-belief", "statistical-learning", "2006-07-01", "Deep networks learn layer by layer", "breakthrough", "Pretraining offers a practical route to optimizing deeper neural networks.", "Neural Computation", "https://direct.mit.edu/neco/article/18/7/1527/6954/A-Fast-Learning-Algorithm-for-Deep-Belief-Nets"),
    ("imagenet", "statistical-learning", "2009-09-01", "ImageNet scales visual evidence", "breakthrough", "A large labeled image database makes comparable, data-hungry vision research possible.", "CVPR", "https://ieeexplore.ieee.org/document/5206848"),
    ("watson", "statistical-learning", "2011-02-16", "Watson wins Jeopardy!", "adoption", "Question answering becomes a televised demonstration of statistical AI at scale.", "IBM", "https://www.ibm.com/history/watson-jeopardy"),

    ("alexnet", "deep-learning", "2012-12-03", "AlexNet resets image recognition", "breakthrough", "A GPU-trained convolutional network wins ImageNet by a large margin.", "NeurIPS", "https://proceedings.neurips.cc/paper/2012/hash/c399862d3b9d6b76c8436e924a68c45b-Abstract.html"),
    ("gan", "deep-learning", "2014-06-10", "Generative adversarial networks", "breakthrough", "Two networks learn through competition, opening a productive route to generation.", "arXiv", "https://arxiv.org/abs/1406.2661"),
    ("alphago", "deep-learning", "2016-01-27", "AlphaGo masters Go", "adoption", "Deep neural networks and tree search defeat a professional player in a landmark result.", "Nature", "https://www.nature.com/articles/nature16961"),
    ("tay", "deep-learning", "2016-03-25", "Tay exposes deployment risk", "harm", "A public chatbot is taken offline after users induce abusive outputs.", "Microsoft", "https://blogs.microsoft.com/blog/2016/03/25/learning-tays-introduction/"),

    ("transformer", "foundation-models", "2017-06-12", "The transformer", "breakthrough", "Attention replaces recurrence and makes sequence models more parallelizable.", "arXiv", "https://arxiv.org/abs/1706.03762"),
    ("gender-shades", "foundation-models", "2018-02-01", "Gender Shades audits disparity", "harm", "An intersectional audit finds large accuracy disparities in commercial gender classification.", "PMLR", "https://proceedings.mlr.press/v81/buolamwini18a.html"),
    ("gpt3", "foundation-models", "2020-05-28", "Language models become few-shot learners", "breakthrough", "GPT-3 shows broad task adaptation through prompting at unprecedented model scale.", "arXiv", "https://arxiv.org/abs/2005.14165"),
    ("unesco", "foundation-models", "2021-11-23", "A global ethics recommendation", "governance", "UNESCO member states adopt a shared normative framework for AI ethics.", "UNESCO", "https://www.unesco.org/en/legal-affairs/recommendation-ethics-artificial-intelligence"),

    ("chatgpt", "public-encounter", "2022-11-30", "ChatGPT opens a public research preview", "adoption", "Conversational generative AI reaches a mass public interface.", "OpenAI", "https://openai.com/index/chatgpt/"),
    ("wga", "public-encounter", "2023-09-25", "Writers negotiate AI protections", "backlash", "A labor contract sets terms for AI use in covered writing work.", "Writers Guild of America", "https://www.wgacontract2023.org/the-campaign/summary-of-the-2023-wga-mba"),
    ("executive-order", "public-encounter", "2023-10-30", "United States issues an AI executive order", "governance", "Federal policy links safety testing, rights, competition, and public-sector use.", "The White House archive", "https://bidenwhitehouse.archives.gov/briefing-room/presidential-actions/2023/10/30/executive-order-on-the-safe-secure-and-trustworthy-development-and-use-of-artificial-intelligence/"),
    ("eu-ai-act", "public-encounter", "2024-07-12", "The EU AI Act becomes law", "governance", "The European Union publishes a risk-based legal framework including general-purpose AI rules.", "EUR-Lex", "https://eur-lex.europa.eu/eli/reg/2024/1689/oj/eng"),
    ("opinion-2025", "public-encounter", "2025-12-31", "Optimism and anxiety rise together", "backlash", "In 2025, 59% report more benefits than drawbacks while 52% say AI products make them nervous.", "Stanford HAI", "https://hai.stanford.edu/ai-index/2026-ai-index-report/public-opinion"),
    ("h1-2026", "public-encounter", "2026-06-30", "The partial-year frontier", "governance", "The atlas stops at June 2026; the final attention observation is explicitly partial-year.", "Wikimedia Analytics API", "https://doc.wikimedia.org/generated-data-platform/aqs/analytics-api/"),
]


def load_json(path: Path):
    with path.open(encoding="utf-8") as handle:
        return json.load(handle)


def normalize(points):
    values = [point["value"] for point in points]
    lo, hi = min(values), max(values)
    span = hi - lo
    for point in points:
        point["normalized"] = round((point["value"] - lo) / span, 4) if span else 0.5
    return points


def ngram_points(series, start, end, bins=9):
    annual = [(year, series[year - 1950]) for year in range(start, end + 1)]
    size = max(1, math.ceil(len(annual) / bins))
    points = []
    for index in range(0, len(annual), size):
        chunk = annual[index:index + size]
        first, last = chunk[0][0], chunk[-1][0]
        points.append({
            "label": str(first) if first == last else f"{first}–{last}",
            "date": f"{round((first + last) / 2)}-07-01",
            "value": sum(value for _, value in chunk) / len(chunk),
            "unit": "share of corpus",
            "coverage": [first, last],
        })
    return normalize(points)


def pageview_points(items, start, end, half_year=False):
    grouped = defaultdict(int)
    for item in items:
        stamp = item["timestamp"]
        year, month = int(stamp[:4]), int(stamp[4:6])
        if start <= year <= end:
            key = (year, 1 if month <= 6 else 2) if half_year else (year, 0)
            grouped[key] += item["views"]
    points = []
    for (year, half), value in sorted(grouped.items()):
        label = f"{year} H{half}" if half_year else str(year)
        month = 3 if half == 1 else 9 if half == 2 else 7
        points.append({"label": label, "date": f"{year}-{month:02d}-01", "value": value, "unit": "user pageviews"})
    return normalize(points)


def build():
    ngram_raw = load_json(RAW / "google-books-ngram-ai-1950-2019.json")
    pageview_raw = load_json(RAW / "wikimedia-ai-pageviews-2015-07-2026-06.json")
    series = next(item["timeseries"] for item in ngram_raw if item["ngram"] == "artificial intelligence (All)")
    pageviews = pageview_raw["items"]

    event_records = [
        {"id": eid, "era": era, "date": date, "title": title, "type": etype, "summary": summary,
         "sourceName": source_name, "sourceUrl": source_url,
         "endpoint": "filled" if etype in {"breakthrough", "adoption"} else "hollow"}
        for eid, era, date, title, etype, summary, source_name, source_url in EVENTS
    ]
    by_era = defaultdict(list)
    for event in event_records:
        by_era[event["era"]].append(event)

    era_records = []
    for era in ERAS:
        if era["id"] == "foundation-models":
            attention = pageview_points(pageviews, 2017, 2021)
        elif era["id"] == "public-encounter":
            attention = pageview_points(pageviews, 2022, 2026, half_year=True)
        else:
            attention = ngram_points(series, era["start"], era["end"])
        era_records.append({**era, "attention": attention, "events": sorted(by_era[era["id"]], key=lambda event: event["date"])})

    output = {
        "meta": {
            "title": "The AI Evolution Garden",
            "cutoff": "2026 H1",
            "built": "2026-07-14",
            "claim": "AI did not rise in a straight line. Each bloom records a cycle of attention, breakthrough, disappointment, adoption, and response.",
            "normalization": "Petal radius is min–max normalized within each era only. Compare shape within a bloom; do not compare petal size across blooms.",
        },
        "opinion": [
            {"year": 2024, "metric": "more benefits than drawbacks", "value": 55, "unit": "%", "source": "opinion"},
            {"year": 2025, "metric": "more benefits than drawbacks", "value": 59, "unit": "%", "source": "opinion"},
            {"year": 2025, "metric": "AI products make me nervous", "value": 52, "unit": "%", "source": "opinion"},
        ],
        "sources": list(SOURCES.values()),
        "eras": era_records,
    }
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT.open("w", encoding="utf-8") as handle:
        json.dump(output, handle, indent=2, ensure_ascii=False)
        handle.write("\n")
    return output


def validate(data):
    era_ids = [era["id"] for era in data["eras"]]
    event_ids = [event["id"] for era in data["eras"] for event in era["events"]]
    assert len(era_ids) == len(set(era_ids)) == 7
    assert len(event_ids) == len(set(event_ids))
    assert all(0 <= point["normalized"] <= 1 for era in data["eras"] for point in era["attention"])
    assert all(event["sourceUrl"].startswith("https://") for era in data["eras"] for event in era["events"])
    assert data["eras"][-1]["years"].endswith("H1")
    assert all(era["events"] == sorted(era["events"], key=lambda event: event["date"]) for era in data["eras"])


if __name__ == "__main__":
    result = build()
    validate(result)
    print(f"Built {OUTPUT.relative_to(ROOT)} with {len(result['eras'])} eras and {sum(len(e['events']) for e in result['eras'])} events.")
