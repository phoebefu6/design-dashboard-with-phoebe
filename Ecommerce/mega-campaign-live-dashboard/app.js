const root = document.documentElement;
const themeButtons = [...document.querySelectorAll("[data-set-theme]")];
let activeMetric = "gmv";
let chartsReady = false;

function applyTheme(theme, persist = true) {
  root.dataset.theme = theme;
  themeButtons.forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.setTheme === theme));
  });
  if (persist) localStorage.setItem("ecomm-dashboard-theme", theme);
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", getComputedStyle(root).getPropertyValue("--bg").trim());
  if (chartsReady) drawMainChart(activeMetric);
}

themeButtons.forEach((button) => {
  button.addEventListener("click", () => applyTheme(button.dataset.setTheme));
});

const storedTheme = localStorage.getItem("ecomm-dashboard-theme");
applyTheme(storedTheme || root.dataset.theme || "night", false);

const systemScheme = matchMedia("(prefers-color-scheme: light)");
systemScheme.addEventListener("change", (event) => {
  if (!localStorage.getItem("ecomm-dashboard-theme")) applyTheme(event.matches ? "day" : "night", false);
});

document.querySelectorAll(".sparkline").forEach((svg) => {
  const values = svg.dataset.values.split(",").map(Number);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const points = values.map((value, index) => {
    const x = (index / (values.length - 1)) * 100;
    const y = 34 - ((value - min) / (max - min || 1)) * 28;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  svg.setAttribute("viewBox", "0 0 100 38");
  svg.innerHTML = `<path d="M${points.join(" L")}"/>`;
});

const categoryData = {
  top: [
    ["Mobile phones", 24.6, 32.1], ["Consumer electronics", 18.9, 24.7],
    ["Home appliances", 15.3, 18.4], ["Health & beauty", 12.8, 10.2],
    ["Fashion", 11.4, 8.7], ["Sports & outdoors", 9.8, 6.2],
    ["Groceries", 8.7, 5.3], ["Home & living", 7.6, 4.0],
    ["Toys & games", 6.2, 3.2], ["Automotive", 5.1, 2.4]
  ],
  bottom: [
    ["Luxury", 1.2, -22.6], ["Digital goods", 1.1, -18.3],
    ["Automotive parts", 0.8, -15.7], ["Mother & baby", 0.7, -12.4],
    ["Pet supplies", 0.6, -10.8], ["Watches", 0.6, -9.2],
    ["Office supplies", 0.5, -8.4], ["Books & media", 0.5, -7.0],
    ["Musical instruments", 0.4, -6.1], ["Flowers & gifts", 0.3, -5.2]
  ]
};

function renderCategories(scale = 1, deltaShift = 0) {
  Object.entries(categoryData).forEach(([type, rows]) => {
    const container = document.querySelector(`[data-category-list="${type}"]`);
    const adjusted = rows.map(([name, gmv, delta]) => [name, gmv * scale, delta + deltaShift]);
    const max = Math.max(...adjusted.map((row) => row[1]));
    container.innerHTML = adjusted.map(([name, gmv, delta], index) => `
      <div class="category-row">
        <span class="rank">${index + 1}</span>
        <span>${name}</span>
        <span class="bar-track"><span class="bar" style="--bar:${Math.max(9, gmv / max * 100)}%"></span></span>
        <span class="gmv">${gmv.toFixed(1)}M</span>
        <span class="delta">${delta > 0 ? "+" : ""}${delta.toFixed(1)}%</span>
      </div>
    `).join("");
  });
}

const rankButtons = [...document.querySelectorAll("[data-rank]")];
function showRank(type) {
  rankButtons.forEach((button) => button.classList.toggle("active", button.dataset.rank === type));
  document.querySelectorAll("[data-category-list]").forEach((list) => {
    list.classList.toggle("is-visible", list.dataset.categoryList === type);
  });
}
rankButtons.forEach((button) => button.addEventListener("click", () => showRank(button.dataset.rank)));
showRank("top");

const metrics = {
  gmv: {
    label: "GMV", total: "US$732.8M", unit: "US$M", color: "--orange",
    actual: [7,12,18,25,33,39,45,49,57,64,70,76,83,91,98,105,112,116,121,127,130,137,143,149,153,158,163,168,174,180,188,183,174,169,172,178,181,186,192,199,205,211,217,223,230,237,245,252,261],
    plan: [8,14,21,28,35,42,49,56,63,70,77,84,91,98,105,112,119,126,133,140,147,154,161,168,175,182,189,196,203,210,217,224,231,238,245,252,259,266,273,280,287,294,301,308,315,322,329,336,343]
  },
  cr: {
    label: "CR", total: "4.23%", unit: "%", color: "--violet",
    actual: [5.7,5.6,5.5,5.3,5.2,5.1,5.0,4.9,4.8,4.8,4.9,5.0,5.1,5.0,4.9,4.8,4.9,5.0,5.1,5.2,5.1,5.0,4.9,4.8,4.7,4.8,4.9,5.0,5.1,5.0,4.7,3.8,3.3,3.6,4.0,4.2,4.3,4.4,4.4,4.3,4.2,4.3,4.4,4.3,4.2,4.2,4.3,4.2,4.23],
    plan: Array.from({length:49}, (_, i) => 5.2 - i * .012)
  },
  dau: {
    label: "DAU", total: "78.6M", unit: "M", color: "--cyan",
    actual: [14,18,21,25,28,31,34,36,39,41,44,46,49,51,53,55,58,60,62,64,66,68,70,72,73,75,77,79,81,82,84,78,72,70,73,76,78,80,82,83,85,87,89,91,92,94,96,98,100],
    plan: Array.from({length:49}, (_, i) => 15 + i * 1.62)
  }
};

const baseMetricSeries = Object.fromEntries(
  Object.entries(metrics).map(([key, metric]) => [
    key,
    { actual: [...metric.actual], plan: [...metric.plan] }
  ])
);

const baseKpis = {
  dau: 78.6,
  cr: 4.23,
  gmv: 732.8,
  orders: 12.43,
  newUsers: 11.8,
  peakCcu: 18.4,
  dau7d: 9.6,
  pdpCart: 15.8,
  cartPay: 35.1,
  abandon: 64.9,
  gmvPace: 509,
  forecast: 1020,
  promoGmv: 61.4,
  aov: 58.95,
  itemsOrder: 2.38,
  cancelRate: 1.7
};

const countryProfiles = {
  all: { label: "All countries", volume: 1, value: 1, cr: 0, delta: 0, detail: "Full 11.11 traffic and commerce population" },
  sg: { label: "Singapore", volume: .105, value: .16, cr: .54, delta: 4.2, detail: "Higher-value market with stronger app conversion" },
  my: { label: "Malaysia", volume: .294, value: .27, cr: .18, delta: 1.7, detail: "Largest traffic market; electronics and beauty lead" },
  th: { label: "Thailand", volume: .246, value: .22, cr: -.21, delta: -1.3, detail: "High engagement, softer checkout completion" }
};

const channelProfiles = {
  all: { label: "All channels", volume: 1, value: 1, cr: 0, delta: 0 },
  app: { label: "App", volume: .82, value: .86, cr: .48, delta: 2.1 },
  web: { label: "Web", volume: .18, value: .14, cr: -.62, delta: -3.4 }
};

const campaignRows = [
  ["blue", "Mega voucher", "11.11 Mega Voucher Drop", "18%", 97, 24.3, 96.8, 22.4],
  ["cyan", "Flash sale", "Brand Mega Offer", "28%", 102, 18.1, 71.3, 19.6],
  ["violet", "Platform voucher", "Daily Stackable", "12%", 95, 13.6, 38.7, 12.3],
  ["orange", "Store voucher", "Store Follower", "10%", 96, 6.2, 19.2, 8.1]
];

const funnelBase = [
  ["Sessions", 91.3, "--cyan"],
  ["Product viewers", 63.5, "--violet"],
  ["Added to cart", 11.0, "--cyan"],
  ["Checkout started", 7.14, "--orange"],
  ["Paid buyers", 3.86, "--green"]
];

const countryFilter = document.querySelector("#country-filter");
const channelFilter = document.querySelector("#channel-filter");
const resetFilters = document.querySelector("#reset-filters");

function formatCompact(value, suffix = "M") {
  if (value >= 1000) return `${(value / 1000).toFixed(2)}B`;
  if (value >= 100) return `${value.toFixed(1)}${suffix}`;
  return `${value.toFixed(2).replace(/\.?0+$/, "")}${suffix}`;
}

function setText(selector, text) {
  const element = document.querySelector(selector);
  if (element) element.textContent = text;
}

function setDelta(selector, value, unit = "%") {
  const element = document.querySelector(selector);
  if (!element) return;
  element.textContent = `${value >= 0 ? "▲" : "▼"} ${Math.abs(value).toFixed(unit === "pp" ? 2 : 1)}${unit}`;
  element.classList.toggle("positive", value >= 0);
  element.classList.toggle("negative", value < 0);
}

function renderFunnel(volumeScale, crShift) {
  const stages = funnelBase.map(([name, value, color], index) => {
    let adjusted = value * volumeScale;
    if (index === 4) adjusted *= 1 + crShift / 4.23;
    return [name, Math.max(0.01, adjusted), color];
  });
  const maxValue = stages[0][1];
  document.querySelector("#funnel-visual").innerHTML = stages.map(([name, value, color], index) => {
    const previous = index ? stages[index - 1][1] : value;
    const drop = index ? (1 - value / previous) * 100 : 0;
    const conversion = value / maxValue * 100;
    const hot = index === 4;
    return `
      <div class="funnel-stage" style="--stage-color:var(${color});--funnel-height:${Math.max(78, 80 + conversion * 1.15)}px">
        ${index ? `<span class="funnel-drop ${hot ? "hot" : ""}">−${drop.toFixed(1)}%</span>` : ""}
        <div class="funnel-bar">
          <small>${name}</small>
          <strong>${formatCompact(value)}</strong>
        </div>
        <span class="funnel-rate"><strong>${conversion.toFixed(1)}%</strong> of sessions</span>
      </div>
    `;
  }).join("");
  const pdpDrop = (1 - stages[2][1] / stages[1][1]) * 100;
  const cartDrop = (1 - stages[3][1] / stages[2][1]) * 100;
  const checkoutDrop = (1 - stages[4][1] / stages[3][1]) * 100;
  setText('[data-dropoff="pdp"]', `−${pdpDrop.toFixed(1)}%`);
  setText('[data-dropoff="cart"]', `−${cartDrop.toFixed(1)}%`);
  setText('[data-dropoff="checkout"]', `−${checkoutDrop.toFixed(1)}%`);
}

function renderCampaigns(valueScale, deltaShift) {
  document.querySelector("#campaign-body").innerHTML = campaignRows.map(
    ([tone, promo, campaign, discount, priceIndex, burn, incremental, delta]) => `
      <tr>
        <td><i class="promo-dot ${tone}"></i>${promo}</td>
        <td>${campaign}</td>
        <td>${discount}</td>
        <td>${priceIndex}</td>
        <td>US$${(burn * valueScale).toFixed(1)}M</td>
        <td>US$${(incremental * valueScale).toFixed(1)}M</td>
        <td class="${delta + deltaShift >= 0 ? "positive" : "negative"}">${delta + deltaShift >= 0 ? "+" : ""}${(delta + deltaShift).toFixed(1)}%</td>
      </tr>
    `
  ).join("");
}

function updateDashboard({ updateUrl = true } = {}) {
  const country = countryProfiles[countryFilter.value] || countryProfiles.all;
  const channel = channelProfiles[channelFilter.value] || channelProfiles.all;
  const volumeScale = country.volume * channel.volume;
  const valueScale = country.value * channel.value;
  const crShift = country.cr + channel.cr;
  const deltaShift = country.delta + channel.delta;
  const kpis = {
    dau: baseKpis.dau * volumeScale,
    cr: Math.max(.2, baseKpis.cr + crShift),
    gmv: baseKpis.gmv * valueScale,
    orders: baseKpis.orders * volumeScale * (1 + crShift / 4.23)
  };

  setText('[data-kpi-value="dau"]', formatCompact(kpis.dau));
  setText('[data-kpi-value="cr"]', `${kpis.cr.toFixed(2)}%`);
  setText('[data-kpi-value="gmv"]', `US$${formatCompact(kpis.gmv)}`);
  setText('[data-kpi-value="orders"]', formatCompact(kpis.orders));
  setText('[data-kpi-target="dau"]', `Target ${formatCompact(69.4 * volumeScale)}`);
  setText('[data-kpi-target="cr"]', `Target ${(4.54 + crShift * .3).toFixed(2)}%`);
  setText('[data-kpi-target="gmv"]', `Target US$${formatCompact(633.2 * valueScale)}`);
  setText('[data-kpi-target="orders"]', `Target ${formatCompact(11.42 * volumeScale)}`);
  setDelta('[data-kpi-delta="dau"]', 13.2 + deltaShift);
  setDelta('[data-kpi-delta="cr"]', -.31 + crShift, "pp");
  setDelta('[data-kpi-delta="gmv"]', 15.7 + deltaShift);
  setDelta('[data-kpi-delta="orders"]', 8.9 + deltaShift * .65);

  setText('[data-kpi-detail="newUsers"]', formatCompact(baseKpis.newUsers * volumeScale));
  setText('[data-kpi-detail="peakCcu"]', formatCompact(baseKpis.peakCcu * volumeScale));
  setText('[data-kpi-detail="dau7d"]', `${9.6 + deltaShift >= 0 ? "+" : ""}${(9.6 + deltaShift).toFixed(1)}%`);
  setText('[data-kpi-detail="pdpCart"]', `${Math.max(4, baseKpis.pdpCart + crShift * 1.8).toFixed(1)}%`);
  setText('[data-kpi-detail="cartPay"]', `${Math.max(8, baseKpis.cartPay + crShift * 2.5).toFixed(1)}%`);
  setText('[data-kpi-detail="abandon"]', `${Math.min(92, baseKpis.abandon - crShift * 2.5).toFixed(1)}%`);
  setText('[data-kpi-detail="gmvPace"]', `US$${Math.round(baseKpis.gmvPace * valueScale)}K`);
  setText('[data-kpi-detail="forecast"]', `US$${formatCompact(baseKpis.forecast * valueScale)}`);
  setText('[data-kpi-detail="promoGmv"]', `${Math.max(20, baseKpis.promoGmv + deltaShift * .2).toFixed(1)}%`);
  setText('[data-kpi-detail="aov"]', `US$${(kpis.gmv / kpis.orders).toFixed(2)}`);
  setText('[data-kpi-detail="itemsOrder"]', (baseKpis.itemsOrder + country.cr * .08).toFixed(2));
  setText('[data-kpi-detail="cancelRate"]', `${Math.max(.4, baseKpis.cancelRate - crShift * .2).toFixed(1)}%`);
  setText('[data-incident-impact="gmv"]', `US$${formatCompact(18.7 * valueScale)}`);
  setText('[data-incident-impact="orders"]', `${Math.round(315 * volumeScale)}K`);
  setText('[data-incident-impact="buyers"]', `${Math.round(620 * volumeScale)}K`);
  setText("[data-funnel-impact-buyers]", `${Math.round(620 * volumeScale)}K buyers affected`);

  metrics.dau.actual = baseMetricSeries.dau.actual.map((value) => value * volumeScale);
  metrics.dau.plan = baseMetricSeries.dau.plan.map((value) => value * volumeScale);
  metrics.dau.total = formatCompact(kpis.dau);
  metrics.gmv.actual = baseMetricSeries.gmv.actual.map((value) => value * valueScale);
  metrics.gmv.plan = baseMetricSeries.gmv.plan.map((value) => value * valueScale);
  metrics.gmv.total = `US$${formatCompact(kpis.gmv)}`;
  metrics.cr.actual = baseMetricSeries.cr.actual.map((value) => Math.max(.1, value + crShift));
  metrics.cr.plan = baseMetricSeries.cr.plan.map((value) => Math.max(.1, value + crShift * .3));
  metrics.cr.total = `${kpis.cr.toFixed(2)}%`;

  renderFunnel(volumeScale, crShift);
  renderCategories(valueScale, deltaShift);
  renderCampaigns(valueScale, deltaShift);
  drawMainChart(activeMetric);

  const isDefault = countryFilter.value === "all" && channelFilter.value === "all";
  setText("#filter-summary", `${country.label} · ${channel.label}`);
  setText("#filter-detail", country.detail);
  setText("#result-context", `${formatCompact(kpis.dau)} active users · US$${formatCompact(kpis.gmv)} GMV`);
  resetFilters.disabled = isDefault;

  if (updateUrl) {
    const url = new URL(window.location.href);
    if (countryFilter.value === "all") url.searchParams.delete("country");
    else url.searchParams.set("country", countryFilter.value);
    if (channelFilter.value === "all") url.searchParams.delete("channel");
    else url.searchParams.set("channel", channelFilter.value);
    history.replaceState(null, "", url.href);
  }
}

function restoreFilters() {
  const params = new URLSearchParams(window.location.search);
  const country = params.get("country");
  const channel = params.get("channel");
  if (countryProfiles[country]) countryFilter.value = country;
  if (channelProfiles[channel]) channelFilter.value = channel;
}

countryFilter.addEventListener("change", () => updateDashboard());
channelFilter.addEventListener("change", () => updateDashboard());
resetFilters.addEventListener("click", () => {
  countryFilter.value = "all";
  channelFilter.value = "all";
  updateDashboard();
});

const metricButtons = [...document.querySelectorAll("[data-metric]")];
metricButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeMetric = button.dataset.metric;
    metricButtons.forEach((item) => item.classList.toggle("active", item === button));
    drawMainChart(activeMetric);
  });
});

function cssColor(variable) {
  return getComputedStyle(root).getPropertyValue(variable).trim();
}

function linePath(values, min, max, left, top, width, height) {
  return values.map((value, index) => {
    const x = left + index / (values.length - 1) * width;
    const y = top + height - (value - min) / (max - min || 1) * height;
    return `${index ? "L" : "M"}${x.toFixed(2)} ${y.toFixed(2)}`;
  }).join(" ");
}

function drawMainChart(metricKey) {
  const svg = document.querySelector("#main-chart");
  if (!svg) return;
  const metric = metrics[metricKey];
  const all = [...metric.actual, ...metric.plan];
  const min = Math.min(...all) * .88;
  const max = Math.max(...all) * 1.06;
  const left = 64, top = 48, width = 790, height = 226;
  const actualPath = linePath(metric.actual, min, max, left, top, width, height);
  const planPath = linePath(metric.plan, min, max, left, top, width, height);
  const areaPath = `${actualPath} L${left + width} ${top + height} L${left} ${top + height} Z`;
  const incidentStart = left + (15.1 / 24) * width;
  const incidentWidth = (0.67 / 24) * width;
  const events = [
    [0, "11.11 kickoff"], [2, "Flash sale 1"], [8, "Brand mega offer"],
    [12, "Mega voucher"], [18, "Flash sale 2"], [21, "Closing rush"]
  ];
  const grid = Array.from({length: 5}, (_, i) => {
    const y = top + i * height / 4;
    const value = max - i * (max - min) / 4;
    return `<line x1="${left}" y1="${y}" x2="${left + width}" y2="${y}" class="grid-line"/>
      <text x="${left - 12}" y="${y + 4}" text-anchor="end" class="axis-label">${formatAxis(value, metricKey)}</text>`;
  }).join("");
  const xTicks = Array.from({length: 7}, (_, i) => {
    const hour = i * 4;
    const x = left + hour / 24 * width;
    return `<text x="${x}" y="${top + height + 28}" text-anchor="middle" class="axis-label">${String(hour).padStart(2,"0")}:00</text>`;
  }).join("");
  const eventMarkup = events.map(([hour, label], index) => {
    const x = left + hour / 24 * width;
    return `<line x1="${x}" y1="38" x2="${x}" y2="${top + height}" class="event-line event-${index % 3}"/>
      <circle cx="${x}" cy="${top + height - ((metric.actual[hour * 2] - min) / (max - min || 1) * height)}" r="4" class="event-dot event-${index % 3}"/>
      <text x="${Math.min(x + 6, 795)}" y="${index % 2 ? 31 : 19}" class="event-label">${label}</text>`;
  }).join("");
  const pointX = left + width;
  const pointY = top + height - (metric.actual.at(-1) - min) / (max - min || 1) * height;

  svg.innerHTML = `
    <style>
      .grid-line{stroke:${cssColor("--grid")};stroke-width:1}
      .axis-label,.event-label{fill:${cssColor("--muted")};font:10px Inter,system-ui,sans-serif}
      .event-label{font-size:9px;font-weight:650}
      .plan-line{fill:none;stroke:${cssColor("--subtle")};stroke-width:2;stroke-dasharray:7 6}
      .actual-line{fill:none;stroke:${cssColor(metric.color)};stroke-width:3;stroke-linecap:round;stroke-linejoin:round}
      .area{fill:${cssColor("--chart-fill")}}
      .event-line{stroke:${cssColor("--violet")};stroke-width:1;stroke-dasharray:3 4;opacity:.72}
      .event-1{stroke:${cssColor("--cyan")};fill:${cssColor("--cyan")}}
      .event-2{stroke:${cssColor("--orange")};fill:${cssColor("--orange")}}
      .event-dot{fill:${cssColor("--violet")};stroke:${cssColor("--surface")};stroke-width:2}
      .incident-zone{fill:${cssColor("--red")};opacity:.13}
      .incident-edge{stroke:${cssColor("--red")};stroke-width:1}
      .incident-label{fill:${cssColor("--red")};font:700 10px Inter,system-ui,sans-serif}
      .last-point{fill:${cssColor(metric.color)};stroke:${cssColor("--surface")};stroke-width:3}
      .unit{fill:${cssColor(metric.color)};font:800 11px Inter,system-ui,sans-serif}
    </style>
    ${grid}
    <text x="${left}" y="${top - 18}" class="unit">${metric.label} (${metric.unit})</text>
    <path d="${areaPath}" class="area"/>
    <path d="${planPath}" class="plan-line"/>
    ${eventMarkup}
    <rect x="${incidentStart}" y="12" width="${Math.max(incidentWidth, 22)}" height="${top + height - 12}" class="incident-zone"/>
    <line x1="${incidentStart}" y1="12" x2="${incidentStart}" y2="${top + height}" class="incident-edge"/>
    <line x1="${incidentStart + Math.max(incidentWidth, 22)}" y1="12" x2="${incidentStart + Math.max(incidentWidth, 22)}" y2="${top + height}" class="incident-edge"/>
    <text x="${incidentStart - 8}" y="10" class="incident-label">15:06–15:46 incident</text>
    <path d="${actualPath}" class="actual-line"/>
    <circle cx="${pointX}" cy="${pointY}" r="5" class="last-point"/>
    ${xTicks}
  `;
  document.querySelector(".legend.actual").style.background = cssColor(metric.color);
  document.querySelector(".chart-total").innerHTML = `${metric.label} <strong>${metric.total}</strong>`;
}

function formatAxis(value, key) {
  if (key === "cr") return `${value.toFixed(1)}%`;
  if (key === "dau") return `${Math.round(value)}M`;
  return value >= 1000 ? `${(value / 1000).toFixed(1)}B` : `${Math.round(value)}M`;
}

chartsReady = true;
restoreFilters();
updateDashboard({ updateUrl: false });

window.addEventListener("storage", (event) => {
  if (event.key === "ecomm-dashboard-theme" && event.newValue) applyTheme(event.newValue, false);
});
