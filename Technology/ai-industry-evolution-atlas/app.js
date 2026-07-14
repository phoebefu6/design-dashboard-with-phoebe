const DATA_URL = "data/dashboard.json";
const NS = "http://www.w3.org/2000/svg";

const mapLayout = {
  foundations: [120, 570, 46],
  "first-winter": [345, 618, 50],
  "expert-systems": [240, 490, 58],
  "statistical-learning": [460, 345, 65],
  "deep-learning": [690, 440, 72],
  "foundation-models": [790, 142, 61],
  "public-encounter": [950, 245, 70],
};

const state = { data: null, eraIndex: 6, eventIndex: 0, detailOpen: false };

function svgEl(name, attrs = {}, text = "") {
  const node = document.createElementNS(NS, name);
  Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
  if (text) node.textContent = text;
  return node;
}

function polar(cx, cy, radius, angle) {
  return [cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius];
}

function petalPath(points, cx, cy, inner, range) {
  const vertices = [];
  const count = points.length;
  points.forEach((point, index) => {
    const angle = -Math.PI / 2 + (index / count) * Math.PI * 2;
    const radius = inner + range * (.32 + point.normalized * .68);
    const left = polar(cx, cy, Math.max(inner + 7, radius * .72), angle - Math.PI / count);
    const tip = polar(cx, cy, radius, angle);
    const right = polar(cx, cy, Math.max(inner + 7, radius * .72), angle + Math.PI / count);
    vertices.push(left, tip, right);
  });
  return vertices.map(([x, y], index) => `${index ? "L" : "M"}${x.toFixed(2)},${y.toFixed(2)}`).join(" ") + " Z";
}

function eventAngle(event, era) {
  const year = Number(event.date.slice(0, 4));
  const month = Number(event.date.slice(5, 7)) || 7;
  const value = year + (month - 1) / 12;
  const bounded = Math.max(era.start, Math.min(era.end + .99, value));
  const ratio = (bounded - era.start) / Math.max(1, era.end + .99 - era.start);
  return -Math.PI / 2 + ratio * Math.PI * 2;
}

function endpoint(group, x, y, event, radius = 3.6) {
  group.append(svgEl("circle", {
    cx: x, cy: y, r: radius,
    class: "endpoint",
    fill: event.endpoint === "filled" ? "#262823" : "#f1edda",
  }));
}

function drawMapBloom(svg, era, selected) {
  const [cx, cy, radius] = mapLayout[era.id];
  const group = svgEl("g", {
    class: `era-hit${selected ? " selected" : ""}`,
    tabindex: "0",
    role: "button",
    "aria-label": `${era.title}, ${era.years}. ${era.thesis}`,
    "data-era": era.id,
  });
  group.append(svgEl("circle", { cx, cy, r: radius + 17, class: "selection-ring" }));
  [radius * .43, radius * .73, radius].forEach(r => group.append(svgEl("circle", { cx, cy, r, class: "ring" })));
  group.append(svgEl("path", { d: petalPath(era.attention, cx, cy, radius * .23, radius * .74), fill: era.color, class: "petal" }));
  group.append(svgEl("circle", { cx, cy, r: radius * .2, class: "core" }));
  era.events.forEach(event => {
    const angle = eventAngle(event, era);
    const start = polar(cx, cy, radius * .22, angle);
    const end = polar(cx, cy, radius + 9, angle);
    group.append(svgEl("line", { x1: start[0], y1: start[1], x2: end[0], y2: end[1], class: "spoke" }));
    endpoint(group, end[0], end[1], event, 3);
  });
  const labelAbove = cy > 525;
  group.append(svgEl("text", { x: cx, y: labelAbove ? cy - radius - 25 : cy + radius + 24, "text-anchor": "middle", class: "era-label" }, era.title));
  group.append(svgEl("text", { x: cx, y: labelAbove ? cy + radius + 23 : cy + radius + 40, "text-anchor": "middle", class: "era-year" }, era.years));
  group.addEventListener("click", () => selectEra(era.id, true));
  group.addEventListener("keydown", event => {
    if (event.key === "Enter" || event.key === " ") { event.preventDefault(); selectEra(era.id, true); }
  });
  svg.append(group);
}

function renderGarden() {
  const svg = document.querySelector("#garden");
  svg.replaceChildren();
  svg.append(svgEl("title", { id: "garden-svg-title" }, "The branching evolution garden of artificial intelligence"));
  svg.append(svgEl("desc", { id: "garden-svg-desc" }, "Seven radial flowers sit on branching paths. Each flower represents an era; its petals show within-era attention and its spokes link to sourced turning points."));

  const branches = [
    ["M35 690 C125 625 140 535 240 490 C335 445 360 385 460 345 C560 300 575 430 690 440", "#3b817b", 7, "branch"],
    ["M240 490 C295 520 300 585 345 618 C390 652 420 637 470 630", "#b06855", 5, "branch branch-secondary"],
    ["M460 345 C535 245 650 198 790 142", "#52756f", 7, "branch"],
    ["M625 255 C700 275 730 335 820 300 C870 281 905 248 950 245", "#c49436", 5, "branch branch-secondary"],
    ["M690 440 C795 430 870 315 950 245 C1004 198 1030 272 1034 350", "#716486", 7, "branch"],
    ["M950 245 C1008 310 986 410 926 476", "#716486", 2, "branch method-seam"],
  ];
  branches.forEach(([d, stroke, width, cls]) => svg.append(svgEl("path", { d, stroke, "stroke-width": width, class: cls })));
  svg.append(svgEl("text", { x: 8, y: 705, class: "era-label" }, "1950 / root"));
  svg.append(svgEl("text", { x: 675, y: 236, class: "era-label" }, "measurement seam →"));
  state.data.eras.forEach((era, index) => drawMapBloom(svg, era, index === state.eraIndex));
}

function wrapLabel(title, max = 22) {
  if (title.length <= max) return [title];
  const words = title.split(" ");
  const lines = [""];
  words.forEach(word => {
    const line = lines.at(-1);
    if ((line + " " + word).trim().length > max && line) lines.push(word);
    else lines[lines.length - 1] = (line + " " + word).trim();
  });
  return lines.slice(0, 2);
}

const conciseLabels = {
  turing: "Turing test", dartmouth: "AI named", perceptron: "perceptron", eliza: "ELIZA",
  "perceptrons-limits": "neural limits", lighthill: "funding falls", xcon: "XCON", "fifth-generation": "fifth generation",
  backprop: "backpropagation", "lisp-collapse": "market contracts", "second-winter": "second winter", svm: "support vectors",
  "deep-blue": "Deep Blue", "deep-belief": "deep belief nets", imagenet: "ImageNet", watson: "Watson",
  alexnet: "AlexNet", gan: "GANs", alphago: "AlphaGo", tay: "deployment risk",
  transformer: "transformer", "gender-shades": "Gender Shades", gpt3: "GPT-3", unesco: "global ethics",
  chatgpt: "ChatGPT", wga: "labor protections", "executive-order": "U.S. AI order", "eu-ai-act": "EU AI Act",
  "opinion-2025": "optimism + anxiety", "h1-2026": "2026 H1 partial",
};

function drawSelectedBloom() {
  const era = state.data.eras[state.eraIndex];
  const svg = document.querySelector("#selected-bloom");
  svg.replaceChildren();
  svg.append(svgEl("title", { id: "selected-svg-title" }, `${era.title} attention flower`));
  svg.append(svgEl("desc", { id: "selected-svg-desc" }, `${era.years}. Petal radius shows normalized ${state.data.sources.find(source => source.id === era.source).meaning.toLowerCase()} Select a spoke for its source and context.`));
  const cx = 210, cy = 228, radius = 116;
  const svgRect = svg.getBoundingClientRect();
  const headingRect = document.querySelector(".inspector-heading").getBoundingClientRect();
  const svgScale = svgRect.height ? svgRect.height / 420 : 1;
  const safeLabelTop = window.matchMedia("(min-width: 761px)").matches
    ? Math.max(150, (headingRect.bottom - svgRect.top + 16) / svgScale)
    : 150;
  [radius * .5, radius * .78, radius].forEach(r => svg.append(svgEl("circle", { cx, cy, r, class: "ring" })));
  svg.append(svgEl("path", { d: petalPath(era.attention, cx, cy, 42, 92), fill: era.color, class: "petal" }));
  svg.append(svgEl("circle", { cx, cy, r: 39, class: "core" }));

  era.events.forEach((event, index) => {
    // Offset the evenly ordered spokes by half a step so no label sits on the
    // vertical title/count axis. This preserves chronology while reserving
    // explicit text-safe zones at the top and bottom of the inspector.
    const angle = -Math.PI / 2 + ((index + .5) / era.events.length) * Math.PI * 2;
    const group = svgEl("g", {
      class: `event-hit${index === state.eventIndex ? " selected" : ""}`,
      tabindex: "0", role: "button", "data-event": event.id,
      "aria-label": `${event.date.slice(0,4)}: ${event.title}. ${event.type}.`,
    });
    const start = polar(cx, cy, 40, angle);
    const end = polar(cx, cy, radius + 26, angle);
    const hitEnd = polar(cx, cy, radius + 40, angle);
    group.append(svgEl("line", { x1: start[0], y1: start[1], x2: end[0], y2: end[1], class: "spoke" }));
    group.append(svgEl("line", { x1: start[0], y1: start[1], x2: hitEnd[0], y2: hitEnd[1], stroke: "transparent", "stroke-width": 30 }));
    endpoint(group, end[0], end[1], event, index === state.eventIndex ? 6 : 4.5);
    const labelRadius = radius + 43;
    const [, radialY] = polar(cx, cy, labelRadius, angle);
    const horizontal = Math.cos(angle);
    const anchor = horizontal > .22 ? "end" : horizontal < -.22 ? "start" : "middle";
    const labelY = Math.max(safeLabelTop, Math.min(326, radialY));
    const circleHalfWidth = Math.sqrt(Math.max(0, 185 ** 2 - (labelY - cy) ** 2));
    const safeLabelLeft = cx - circleHalfWidth + 8;
    const safeLabelRight = cx + circleHalfWidth - 8;
    const labelX = horizontal > .22 ? safeLabelRight : horizontal < -.22 ? safeLabelLeft : cx;
    wrapLabel(conciseLabels[event.id] || event.title, 17).forEach((line, lineIndex) => {
      group.append(svgEl("text", { x: labelX, y: labelY + lineIndex * 15, "text-anchor": anchor, class: "event-label" }, line));
    });
    group.addEventListener("click", () => selectEvent(event.id, true));
    group.addEventListener("keydown", keyboardEvent => {
      if (keyboardEvent.key === "Enter" || keyboardEvent.key === " ") { keyboardEvent.preventDefault(); selectEvent(event.id, true); }
      if (keyboardEvent.key === "ArrowRight" || keyboardEvent.key === "ArrowDown") { keyboardEvent.preventDefault(); selectEvent(era.events[(index + 1) % era.events.length].id, true, true); }
      if (keyboardEvent.key === "ArrowLeft" || keyboardEvent.key === "ArrowUp") { keyboardEvent.preventDefault(); selectEvent(era.events[(index - 1 + era.events.length) % era.events.length].id, true, true); }
    });
    svg.append(group);
  });
  [[.1, 1.28], [.32, 1.31], [.54, 1.33], [2.15, 1.32], [2.35, 1.34]].forEach(([angle, scale]) => {
    const [x,y] = polar(cx, cy, radius * scale, angle);
    svg.append(svgEl("circle", { cx: x, cy: y, r: 3, class: "halo-dot" }));
  });
}

function renderInspector() {
  const era = state.data.eras[state.eraIndex];
  const event = era.events[state.eventIndex];
  document.querySelector("#bloom-inspector").classList.toggle("detail-open", state.detailOpen);
  document.querySelector("#inspector-kicker").textContent = `${String(state.eraIndex + 1).padStart(2,"0")} / ${era.years} · selected bloom`;
  document.querySelector("#inspector-title").textContent = era.title;
  document.querySelector("#inspector-thesis").textContent = era.thesis;
  document.querySelector("#inspector-counts").innerHTML = `<span>${era.attention.length} petals</span><span>${era.events.length} sources</span><span>${era.source === "ngram" ? "proxy" : "direct"}</span>`;
  document.querySelector("#event-type").textContent = `${event.date.slice(0,4)} · ${event.type}`;
  document.querySelector("#event-title").textContent = event.title;
  document.querySelector("#event-summary").textContent = event.summary;
  const source = document.querySelector("#event-source");
  source.href = event.sourceUrl;
  source.setAttribute("aria-label", `Open ${event.sourceName} source for ${event.title}`);
  source.firstChild.textContent = `${event.sourceName} source `;
  drawSelectedBloom();
}

function renderStepper() {
  const stepper = document.querySelector("#era-stepper");
  stepper.replaceChildren();
  state.data.eras.forEach((era, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "era-step";
    button.style.setProperty("--era-color", era.color);
    button.setAttribute("aria-label", `Select ${era.title}, ${era.years}`);
    if (index === state.eraIndex) button.setAttribute("aria-current", "true");
    button.innerHTML = `<span>${era.title}</span>`;
    button.addEventListener("click", () => selectEra(era.id, true));
    stepper.append(button);
  });
  document.querySelector("#previous-era").disabled = state.eraIndex === 0;
  document.querySelector("#next-era").disabled = state.eraIndex === state.data.eras.length - 1;
  document.querySelector("#evidence-action").href = `#chapter-${state.data.eras[state.eraIndex].id}`;
}

function miniChart(era) {
  const width = 560, height = 160, left = 8, right = 8, top = 16, bottom = 28;
  const points = era.attention.map((point, index) => {
    const x = left + index / Math.max(1, era.attention.length - 1) * (width - left - right);
    const y = top + (1 - point.normalized) * (height - top - bottom);
    return {...point, x, y};
  });
  const line = points.map((point,index) => `${index ? "L" : "M"}${point.x},${point.y}`).join(" ");
  const area = `${line} L${points.at(-1).x},${height-bottom} L${points[0].x},${height-bottom} Z`;
  const labels = points.map((point,index) => index === 0 || index === points.length-1 || index === Math.floor(points.length/2)
    ? `<text x="${point.x}" y="${height-7}" text-anchor="${index === 0 ? "start" : index === points.length-1 ? "end" : "middle"}">${point.label}</text>` : "").join("");
  return `<svg class="mini-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="Within-era attention contour for ${era.title}; values are normalized only inside this era."><path class="area" fill="${era.color}" d="${area}"/><path class="line" stroke="${era.color}" d="${line}"/>${points.map(point => `<circle cx="${point.x}" cy="${point.y}" r="3" fill="${era.color}"><title>${point.label}: ${formatValue(point.value, point.unit)}</title></circle>`).join("")}<line x1="${left}" y1="${height-bottom}" x2="${width-right}" y2="${height-bottom}" stroke="rgba(38,40,35,.18)"/>${labels}</svg>`;
}

function formatValue(value, unit) {
  if (unit === "user pageviews") return `${Math.round(value).toLocaleString()} user pageviews`;
  return `${value.toExponential(3)} share of corpus`;
}

function renderChapters() {
  const list = document.querySelector("#chapter-list");
  list.innerHTML = state.data.eras.map((era, index) => {
    const source = state.data.sources.find(item => item.id === era.source);
    const events = era.events.map(event => `<a class="event-row" href="${event.sourceUrl}" target="_blank" rel="noreferrer"><span class="event-date">${event.date.slice(0,4)}</span><span class="event-marker ${event.endpoint}"></span><span><span class="event-row-title">${event.title}</span><span class="event-row-type">${event.type} · ${event.sourceName} ↗</span></span></a>`).join("");
    return `<article class="chapter" id="chapter-${era.id}" data-era="${era.id}"><p class="chapter-index">${String(index+1).padStart(2,"0")} / ${era.years}</p><div class="chapter-copy"><p class="kicker">${era.branch}</p><h3>${era.title}</h3><p class="chapter-thesis">${era.thesis}</p>${miniChart(era)}<p class="chapter-source-note"><strong>${source.name}.</strong> ${source.meaning} ${source.method} <a href="${source.url}" target="_blank" rel="noreferrer">Method ↗</a></p></div><div class="event-list" aria-label="Selected events in ${era.title}">${events}</div></article>`;
  }).join("");
}

function renderSources() {
  document.querySelector("#source-list").innerHTML = state.data.sources.map(source => `<article class="source-card"><h3>${source.name}</h3><p>${source.coverage}</p><p>${source.method}</p><a href="${source.url}" target="_blank" rel="noreferrer">Open documentation ↗</a>${source.dataUrl ? ` · <a href="${source.dataUrl}" target="_blank" rel="noreferrer">Open data endpoint ↗</a>` : ""}</article>`).join("");
  document.querySelector("#long-description").innerHTML = `<p>The main visualization is a botanical timeline with seven flowers connected by curving branches. The sequence moves from Foundations at the lower left through two winter-related branches, statistical learning, deep learning, foundation models, and the Public encounter at the upper right. Each flower is a radial area shape. Moving clockwise follows time within that era; longer petals mean higher attention relative only to the other observations in the same flower. Lines extending from a flower are selected historical events. Filled endpoint circles mark technical breakthroughs or adoption. Hollow circles mark setbacks, documented harms, public backlash, or governance responses. A dashed branch near the latest flowers marks the switch from Google Books frequency to Wikipedia pageviews.</p><p>The currently selected flower is enlarged. Selecting an event spoke reveals its year, type, summary, and source. On small screens, only one flower is shown at a time and previous and next controls traverse the lineage without requiring precise pointing.</p>`;
}

function setUrl(push = true) {
  const era = state.data.eras[state.eraIndex];
  const event = era.events[state.eventIndex];
  const url = new URL(window.location.href);
  url.searchParams.set("era", era.id);
  url.searchParams.set("event", event.id);
  history[push ? "pushState" : "replaceState"]({}, "", url);
}

function renderInteractive() {
  renderGarden();
  renderInspector();
  renderStepper();
}

function selectEra(id, push = true) {
  const index = state.data.eras.findIndex(era => era.id === id);
  if (index < 0) return;
  state.eraIndex = index;
  state.eventIndex = 0;
  state.detailOpen = false;
  renderInteractive();
  setUrl(push);
}

function selectEvent(id, push = true, refocus = false) {
  const era = state.data.eras[state.eraIndex];
  const index = era.events.findIndex(event => event.id === id);
  if (index < 0) return;
  state.eventIndex = index;
  state.detailOpen = true;
  renderInspector();
  setUrl(push);
  if (refocus) document.querySelector(`[data-event="${id}"]`)?.focus();
}

function restoreFromUrl(replace = false) {
  const params = new URLSearchParams(location.search);
  const eraIndex = state.data.eras.findIndex(era => era.id === params.get("era"));
  state.eraIndex = eraIndex >= 0 ? eraIndex : state.data.eras.length - 1;
  const events = state.data.eras[state.eraIndex].events;
  const eventIndex = events.findIndex(event => event.id === params.get("event"));
  state.eventIndex = eventIndex >= 0 ? eventIndex : 0;
  state.detailOpen = eventIndex >= 0;
  renderInteractive();
  if (replace) setUrl(false);
}

async function init() {
  const response = await fetch(DATA_URL);
  if (!response.ok) throw new Error(`Data request failed: ${response.status}`);
  state.data = await response.json();
  renderChapters();
  renderSources();
  restoreFromUrl(true);
  document.querySelector("#previous-era").addEventListener("click", () => selectEra(state.data.eras[state.eraIndex - 1]?.id, true));
  document.querySelector("#next-era").addEventListener("click", () => selectEra(state.data.eras[state.eraIndex + 1]?.id, true));
  window.addEventListener("popstate", () => restoreFromUrl(false));
}

init().catch(error => {
  console.error(error);
  document.querySelector("#atlas").insertAdjacentHTML("afterbegin", `<p role="alert">The data snapshot could not be loaded. Please refresh the page.</p>`);
});
