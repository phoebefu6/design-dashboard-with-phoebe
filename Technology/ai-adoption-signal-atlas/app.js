const REGION_COLORS = {
  Americas: "#4CC9F0",
  Europe: "#A78BFA",
  Africa: "#FFB547",
  Asia: "#FF5D8F",
  Oceania: "#54E0B5",
  Unallocated: "#93A4B8",
};

const state = {
  data: null,
  geojson: null,
  filter: "All",
  selectedCountry: null,
  rankingMetric: "users",
  dots: [],
  mapPoints: [],
};

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function formatCompact(value, digits = 0) {
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: digits,
  }).format(value);
}

function seededRandom(seed) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function hashString(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function sizeCanvas(canvas) {
  const rect = canvas.getBoundingClientRect();
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.max(1, rect.width);
  const height = Math.max(1, rect.height);
  if (canvas.width !== Math.round(width * ratio) || canvas.height !== Math.round(height * ratio)) {
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
  }
  const context = canvas.getContext("2d");
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  return { context, width, height };
}

function buildDots() {
  const dots = [];
  state.data.countries.forEach((country) => {
    const random = seededRandom(hashString(country.code));
    for (let index = 0; index < country.dots; index += 1) {
      dots.push({
        country: country.code,
        countryName: country.name,
        region: country.region,
        a: random(),
        b: random(),
        c: random(),
        size: 0.72 + random() * 1.3,
      });
    }
  });

  const unallocated = state.data.regions.find((region) => region.name === "Unallocated");
  const random = seededRandom(90210);
  for (let index = 0; index < unallocated.dots; index += 1) {
    dots.push({
      country: null,
      countryName: "Country detail unavailable",
      region: "Unallocated",
      a: random(),
      b: random(),
      c: random(),
      size: 0.72 + random() * 1.2,
    });
  }
  state.dots = dots.sort((a, b) => a.b - b.b);
}

function traceProjectedRing(context, ring, project, close = true) {
  let previousX = null;
  ring.forEach(([lon, lat], index) => {
    const [x, y] = project(lon, lat);
    const wrapped = previousX !== null && Math.abs(x - previousX) > 240;
    if (index === 0 || wrapped) context.moveTo(x, y);
    else context.lineTo(x, y);
    previousX = x;
  });
  if (close) context.closePath();
}

function traceGeometry(context, geometry, project) {
  if (!geometry) return;
  const polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
  polygons.forEach((polygon) => {
    polygon.forEach((ring) => traceProjectedRing(context, ring, project));
  });
}

function drawEarth(context, width, height, horizon) {
  const radius = Math.max(width * 0.79, 420);
  const centerX = width / 2;
  const centerY = horizon + radius * 0.86;
  context.save();
  context.beginPath();
  context.arc(centerX, centerY, radius, 0, Math.PI * 2);
  context.clip();

  const ocean = context.createRadialGradient(
    centerX,
    horizon + radius * 0.04,
    radius * 0.03,
    centerX,
    centerY,
    radius,
  );
  ocean.addColorStop(0, "#174d72");
  ocean.addColorStop(0.28, "#0b273f");
  ocean.addColorStop(0.72, "#07121f");
  ocean.addColorStop(1, "#02050a");
  context.fillStyle = ocean;
  context.fillRect(0, horizon - 20, width, height - horizon + 20);

  const project = (lon, lat) => [
    centerX + (lon / 180) * radius * 1.3,
    horizon + radius * 0.19 - (lat / 90) * radius * 0.3,
  ];
  context.beginPath();
  state.geojson.features.forEach((feature) => traceGeometry(context, feature.geometry, project));
  context.fillStyle = "rgba(75, 115, 137, 0.38)";
  context.fill("evenodd");
  context.strokeStyle = "rgba(162, 212, 230, 0.12)";
  context.lineWidth = 0.45;
  context.stroke();

  context.strokeStyle = "rgba(93, 195, 232, 0.1)";
  context.lineWidth = 0.7;
  for (let index = 1; index < 5; index += 1) {
    context.beginPath();
    context.ellipse(centerX, horizon + index * 31, radius * (0.72 + index * 0.04), 18 + index * 4, 0, 0, Math.PI * 2);
    context.stroke();
  }
  context.restore();

  const rim = context.createLinearGradient(0, horizon - 12, 0, horizon + 24);
  rim.addColorStop(0, "rgba(86, 212, 255, 0)");
  rim.addColorStop(0.5, "rgba(86, 212, 255, 0.9)");
  rim.addColorStop(1, "rgba(86, 212, 255, 0)");
  context.strokeStyle = rim;
  context.lineWidth = 3;
  context.shadowColor = "#4CC9F0";
  context.shadowBlur = 22;
  context.beginPath();
  context.arc(centerX, centerY, radius, Math.PI * 1.13, Math.PI * 1.87);
  context.stroke();
  context.shadowBlur = 0;
}

function dotOpacity(dot) {
  if (state.selectedCountry) return dot.country === state.selectedCountry ? 1 : 0.055;
  if (state.filter !== "All") return dot.region === state.filter ? 1 : 0.055;
  return dot.region === "Unallocated" ? 0.55 : 0.84;
}

function renderSignal(progress = 1) {
  const canvas = document.querySelector("#signal-canvas");
  const { context, width, height } = sizeCanvas(canvas);
  context.clearRect(0, 0, width, height);

  const top = height * 0.105;
  const horizon = height * 0.795;
  const range = horizon - top;
  const centerX = width / 2;

  const beam = context.createLinearGradient(centerX, top, centerX, horizon);
  beam.addColorStop(0, "rgba(75, 190, 244, 0.075)");
  beam.addColorStop(0.55, "rgba(139, 92, 246, 0.035)");
  beam.addColorStop(1, "rgba(76, 201, 240, 0.18)");
  context.fillStyle = beam;
  context.beginPath();
  context.moveTo(centerX - Math.min(width * 0.38, 310), top);
  context.bezierCurveTo(centerX - width * 0.26, top + range * 0.36, centerX - 65, horizon - range * 0.08, centerX - 22, horizon);
  context.lineTo(centerX + 22, horizon);
  context.bezierCurveTo(centerX + 65, horizon - range * 0.08, centerX + width * 0.26, top + range * 0.36, centerX + Math.min(width * 0.38, 310), top);
  context.closePath();
  context.fill();

  [0.08, 0.35, 0.62].forEach((position, index) => {
    const y = top + range * position;
    const widthAtY = 50 + (1 - position) * Math.min(width * 0.34, 275);
    context.save();
    context.strokeStyle = index === 0 ? "rgba(76, 201, 240, 0.42)" : "rgba(137, 169, 205, 0.22)";
    context.lineWidth = index === 0 ? 1.2 : 0.8;
    context.shadowColor = "#4CC9F0";
    context.shadowBlur = index === 0 ? 12 : 0;
    context.beginPath();
    context.ellipse(centerX, y, widthAtY, 9 + index * 2, 0, 0, Math.PI * 2);
    context.stroke();
    context.restore();
  });

  const regionOffset = {
    Americas: -0.68,
    Europe: -0.25,
    Africa: 0.03,
    Asia: 0.38,
    Oceania: 0.74,
    Unallocated: 0,
  };
  const visibleCount = Math.floor(state.dots.length * progress);
  for (let index = 0; index < visibleCount; index += 1) {
    const dot = state.dots[index];
    const y = top + dot.b * range * 0.97;
    const vertical = (horizon - y) / range;
    const plumeWidth = 28 + vertical * Math.min(width * 0.37, 300);
    const band = regionOffset[dot.region] * plumeWidth * 0.52;
    const jitter = (dot.a - 0.5) * plumeWidth * 0.8;
    const wave = Math.sin(dot.c * Math.PI * 2 + y * 0.018) * plumeWidth * 0.065;
    const x = centerX + band + jitter + wave;
    const alpha = dotOpacity(dot);
    if (alpha < 0.06 && index % 2) continue;

    context.globalAlpha = alpha;
    context.fillStyle = REGION_COLORS[dot.region];
    context.shadowColor = REGION_COLORS[dot.region];
    context.shadowBlur = alpha > 0.5 ? dot.size * 4.5 : 0;
    context.beginPath();
    context.arc(x, y, dot.size, 0, Math.PI * 2);
    context.fill();
  }
  context.globalAlpha = 1;
  context.shadowBlur = 0;

  const originGlow = context.createRadialGradient(centerX, horizon, 0, centerX, horizon, 90);
  originGlow.addColorStop(0, "rgba(230, 249, 255, 0.95)");
  originGlow.addColorStop(0.14, "rgba(76, 201, 240, 0.48)");
  originGlow.addColorStop(1, "rgba(76, 201, 240, 0)");
  context.fillStyle = originGlow;
  context.fillRect(centerX - 100, horizon - 100, 200, 200);

  drawEarth(context, width, height, horizon + 10);
}

function animateSignal() {
  if (prefersReducedMotion) {
    renderSignal(1);
    return;
  }
  const start = performance.now();
  const duration = 900;
  const frame = (now) => {
    const raw = Math.min(1, (now - start) / duration);
    const progress = 1 - Math.pow(1 - raw, 3);
    renderSignal(progress);
    if (raw < 1) requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

function mapProject(lon, lat, width, height) {
  return [((lon + 180) / 360) * width, ((90 - lat) / 180) * height];
}

function renderMap() {
  const canvas = document.querySelector("#map-canvas");
  const { context, width, height } = sizeCanvas(canvas);
  context.clearRect(0, 0, width, height);

  const project = (lon, lat) => mapProject(lon, lat, width, height);
  context.beginPath();
  state.geojson.features.forEach((feature) => traceGeometry(context, feature.geometry, project));
  context.fillStyle = "rgba(116, 131, 151, 0.18)";
  context.fill("evenodd");
  context.strokeStyle = "rgba(175, 193, 215, 0.18)";
  context.lineWidth = 0.45;
  context.stroke();

  state.mapPoints = state.data.countries.map((country) => {
    const [x, y] = project(country.lon, country.lat);
    const radius = Math.max(2.2, Math.min(11, Math.sqrt(country.estimatedUsers / 1_000_000) * 0.86));
    const isSelected = country.code === state.selectedCountry;
    const isInFilter = state.filter === "All" || country.region === state.filter;
    context.globalAlpha = isSelected ? 1 : isInFilter ? 0.84 : 0.12;
    context.fillStyle = REGION_COLORS[country.region];
    context.shadowColor = REGION_COLORS[country.region];
    context.shadowBlur = isSelected ? 15 : 5;
    context.beginPath();
    context.arc(x, y, isSelected ? radius + 2 : radius, 0, Math.PI * 2);
    context.fill();
    if (isSelected) {
      context.strokeStyle = "#ffffff";
      context.lineWidth = 1.2;
      context.stroke();
    }
    return { country, x, y, radius };
  });
  context.globalAlpha = 1;
  context.shadowBlur = 0;
}

function renderTrendChart() {
  const chart = document.querySelector("#trend-chart");
  const points = state.data.world.series;
  const width = 380;
  const height = 190;
  const margin = { left: 36, right: 30, top: 16, bottom: 32 };
  const x = (index) => margin.left + index * ((width - margin.left - margin.right) / 2);
  const y = (value) => height - margin.bottom - ((value - 10) / 20) * (height - margin.top - margin.bottom);
  const series = [
    { key: "north", color: REGION_COLORS.Europe, label: "North" },
    { key: "world", color: REGION_COLORS.Americas, label: "World" },
    { key: "south", color: REGION_COLORS.Africa, label: "South" },
  ];
  const paths = series.map((item) => {
    const path = points.map((point, index) => `${index ? "L" : "M"} ${x(index)} ${y(point[item.key])}`).join(" ");
    const circles = points.map((point, index) => `<circle cx="${x(index)}" cy="${y(point[item.key])}" r="3" fill="${item.color}" />`).join("");
    const last = points[points.length - 1][item.key];
    return `<path d="${path}" fill="none" stroke="${item.color}" stroke-width="2" />${circles}<text x="${x(2) + 9}" y="${y(last) + 4}" fill="${item.color}" font-size="9" font-weight="700">${last}%</text>`;
  }).join("");
  const grid = [10, 20, 30].map((value) => `<g><line x1="${margin.left}" y1="${y(value)}" x2="${width - margin.right}" y2="${y(value)}" stroke="rgba(180,199,226,.12)" /><text x="3" y="${y(value) + 4}" fill="#667086" font-size="8">${value}%</text></g>`).join("");
  const labels = points.map((point, index) => `<text x="${x(index)}" y="${height - 8}" text-anchor="middle" fill="#667086" font-size="8">${point.period}</text>`).join("");
  const gap = `<line x1="${x(2)}" y1="${y(points[2].north)}" x2="${x(2)}" y2="${y(points[2].south)}" stroke="rgba(255,255,255,.32)" stroke-dasharray="2 3" /><text x="${x(2) - 6}" y="${(y(points[2].north) + y(points[2].south)) / 2}" text-anchor="end" fill="#98a3b6" font-size="8">12.1 pt gap</text>`;
  chart.innerHTML = `<svg viewBox="0 0 ${width} ${height}" aria-hidden="true">${grid}${gap}${paths}${labels}</svg>`;
}

function renderRegionFilter() {
  const container = document.querySelector("#region-filter");
  const regions = [
    { name: "All", color: "#F7F4ED" },
    ...state.data.regions.map((region) => ({
      name: region.name,
      color: region.color,
    })),
  ];
  container.innerHTML = regions.map((region) => {
    const label = region.name === "Unallocated" ? "Unmapped" : region.name;
    return `<button class="region-button${region.name === state.filter ? " is-active" : ""}" type="button" data-region="${region.name}" style="--region-color:${region.color}"><i></i>${label}</button>`;
  }).join("");
  container.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      state.filter = button.dataset.region;
      state.selectedCountry = null;
      renderRegionFilter();
      updateSelectionReadout();
      renderSignal();
      renderMap();
      updateCountryFocus(state.data.countries[0], "LEADING BY USER BASE");
    });
  });
}

function updateSelectionReadout() {
  const readout = document.querySelector("#selection-readout");
  if (state.selectedCountry) {
    const country = state.data.countries.find((item) => item.code === state.selectedCountry);
    readout.innerHTML = `<span class="selection-kicker">${country.name}</span><strong>${country.dots} ${country.dots === 1 ? "dot" : "dots"}</strong><span>≈ ${formatCompact(country.estimatedUsers, 1)} estimated users · ${country.rates.q1_2026}% adoption</span>`;
    return;
  }
  if (state.filter !== "All") {
    const region = state.data.regions.find((item) => item.name === state.filter);
    const label = region.name === "Unallocated" ? "UNMAPPED REMAINDER" : region.name.toUpperCase();
    readout.innerHTML = `<span class="selection-kicker">${label}</span><strong>${region.dots} dots</strong><span>≈ ${formatCompact(region.estimatedUsers, 1)} estimated users${region.weightedRate ? ` · ${region.weightedRate}% weighted adoption` : ""}</span>`;
    return;
  }
  readout.innerHTML = `<span class="selection-kicker">ALL REGIONS</span><strong>${state.data.world.dots} dots</strong><span>≈ ${formatCompact(state.data.world.estimatedUsers, 0)} estimated users</span>`;
}

function updateCountryFocus(country, kicker = "COUNTRY SIGNAL") {
  const focus = document.querySelector("#country-focus");
  const change = country.rates.q1_2026 - country.rates.h1_2025;
  focus.innerHTML = `
    <div><span class="focus-kicker">${kicker}</span><strong>${country.name}</strong></div>
    <div><strong>${formatCompact(country.estimatedUsers, 1)}</strong><span>estimated users</span></div>
    <div><strong>${country.rates.q1_2026.toFixed(1)}%</strong><span>adoption share</span></div>
    <div><strong>${change >= 0 ? "+" : ""}${change.toFixed(1)}</strong><span>points since H1 ’25</span></div>
  `;
}

function renderRanking() {
  const metric = state.rankingMetric;
  const countries = [...state.data.countries].sort((a, b) => {
    if (metric === "users") return b.estimatedUsers - a.estimatedUsers;
    return b.rates.q1_2026 - a.rates.q1_2026;
  }).slice(0, 8);
  const max = metric === "users" ? countries[0].estimatedUsers : countries[0].rates.q1_2026;
  const bars = document.querySelector("#ranking-bars");
  bars.innerHTML = countries.map((country) => {
    const value = metric === "users" ? country.estimatedUsers : country.rates.q1_2026;
    const label = metric === "users" ? formatCompact(value, 1) : `${value.toFixed(1)}%`;
    return `<div class="rank-row" tabindex="0" data-code="${country.code}" aria-label="${country.name}: ${label}">
      <span class="rank-label">${country.name}</span>
      <span class="rank-track"><span class="rank-fill" style="--bar-width:${(value / max) * 100}%;--bar-color:${REGION_COLORS[country.region]}"></span></span>
      <span class="rank-value">${label}</span>
    </div>`;
  }).join("");
  bars.querySelectorAll(".rank-row").forEach((row) => {
    const focusCountry = () => selectCountry(row.dataset.code);
    row.addEventListener("click", focusCountry);
    row.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") focusCountry();
    });
  });
  document.querySelector("#ranking-note").textContent = metric === "users"
    ? "Large populations put India and China first by estimated users—even though smaller digital economies lead by adoption rate."
    : "The UAE and Singapore lead on saturation: more than six in ten working-age people are estimated to use generative AI.";
}

function selectCountry(code) {
  const country = state.data.countries.find((item) => item.code === code);
  if (!country) return;
  state.selectedCountry = code;
  state.filter = "All";
  renderRegionFilter();
  updateCountryFocus(country);
  updateSelectionReadout();
  renderSignal();
  renderMap();
}

function setupMapInteraction() {
  const canvas = document.querySelector("#map-canvas");
  const tooltip = document.querySelector("#map-tooltip");
  const locatePoint = (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    let nearest = null;
    let nearestDistance = Infinity;
    state.mapPoints.forEach((point) => {
      const distance = Math.hypot(point.x - x, point.y - y);
      if (distance < Math.max(point.radius + 6, 9) && distance < nearestDistance) {
        nearest = point;
        nearestDistance = distance;
      }
    });
    return { nearest, x, y };
  };
  canvas.addEventListener("pointermove", (event) => {
    const { nearest, x, y } = locatePoint(event);
    if (!nearest) {
      tooltip.hidden = true;
      return;
    }
    const country = nearest.country;
    tooltip.innerHTML = `<strong>${country.name}</strong><span>${formatCompact(country.estimatedUsers, 1)} estimated users · ${country.rates.q1_2026}% adoption</span>`;
    tooltip.hidden = false;
    tooltip.style.left = `${Math.min(x + 12, canvas.clientWidth - 180)}px`;
    tooltip.style.top = `${Math.max(4, y - 44)}px`;
  });
  canvas.addEventListener("pointerleave", () => {
    tooltip.hidden = true;
  });
  canvas.addEventListener("click", (event) => {
    const { nearest } = locatePoint(event);
    if (nearest) selectCountry(nearest.country.code);
  });
}

function setupControls() {
  const dialog = document.querySelector("#method-dialog");
  document.querySelector("#open-method").addEventListener("click", () => dialog.showModal());
  document.querySelector("#close-method").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
  document.querySelector("#reset-focus").addEventListener("click", () => {
    state.filter = "All";
    state.selectedCountry = null;
    renderRegionFilter();
    updateSelectionReadout();
    updateCountryFocus(state.data.countries[0], "LEADING BY USER BASE");
    renderSignal();
    renderMap();
  });
  document.querySelectorAll(".metric-toggle button").forEach((button) => {
    button.addEventListener("click", () => {
      state.rankingMetric = button.dataset.metric;
      document.querySelectorAll(".metric-toggle button").forEach((item) => item.classList.toggle("is-active", item === button));
      renderRanking();
    });
  });
}

function debounce(callback, delay = 100) {
  let timer;
  return (...args) => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => callback(...args), delay);
  };
}

async function init() {
  try {
    const [dataResponse, mapResponse] = await Promise.all([
      fetch("./data/adoption.json"),
      fetch("./data/world-110m.geojson"),
    ]);
    if (!dataResponse.ok || !mapResponse.ok) throw new Error("Source files were not available");
    state.data = await dataResponse.json();
    state.geojson = await mapResponse.json();
    buildDots();
    document.querySelector("#world-users").textContent = formatCompact(state.data.world.estimatedUsers, 0);
    renderTrendChart();
    renderRegionFilter();
    renderRanking();
    updateSelectionReadout();
    updateCountryFocus(state.data.countries[0], "LEADING BY USER BASE");
    setupControls();
    setupMapInteraction();
    renderMap();
    animateSignal();

    window.addEventListener("resize", debounce(() => {
      renderMap();
      renderSignal();
    }, 120));
  } catch (error) {
    console.error(error);
    document.querySelector("#load-error").hidden = false;
  }
}

init();
