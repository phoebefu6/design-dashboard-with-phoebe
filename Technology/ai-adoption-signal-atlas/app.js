const REGION_COLORS = {
  Americas: "#2C7BE5",
  Europe: "#7C3AED",
  Africa: "#F59E0B",
  Asia: "#E11D48",
  Oceania: "#0F9D8A",
  Unallocated: "#64748B",
};

const state = {
  data: null,
  geojson: null,
  filter: "All",
  selectedCountry: null,
  rankingMetric: "users",
  dots: [],
  mapPoints: [],
  globeFeatures: [],
  signalPointer: { x: 0.5, y: 0.5, active: false },
  lastMapPaint: 0,
  lastSignalPaint: 0,
};

function regionColor(region) {
  return REGION_COLORS[region] || REGION_COLORS.Unallocated;
}

// A lightweight silhouette keeps the file:// preview useful when browsers block local JSON fetches.
const FILE_GEOJSON_FALLBACK = {
  type: "FeatureCollection",
  features: [
    [[-168, 72], [-140, 70], [-112, 58], [-82, 50], [-60, 25], [-82, 8], [-112, 15], [-130, 35], [-168, 48]],
    [[-82, 12], [-50, 10], [-36, -20], [-52, -55], [-74, -52], [-82, -20]],
    [[-12, 36], [42, 36], [52, 8], [40, -35], [9, -35], [-18, 0]],
    [[-12, 72], [42, 72], [58, 48], [26, 36], [-18, 42]],
    [[42, 62], [148, 70], [172, 48], [132, 18], [92, 8], [62, 22]],
    [[112, 2], [154, 0], [154, -42], [118, -38]],
  ].map((coordinates) => ({
    type: "Feature",
    geometry: { type: "Polygon", coordinates: [[...coordinates, coordinates[0]]] },
    properties: {},
  })),
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
  const ratio = canvas.id === "signal-canvas" ? 1 : Math.min(window.devicePixelRatio || 1, 1.5);
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
        size: 2.6 + random() * 3.4,
        color: regionColor(country.region),
        lon: (country.lon * Math.PI / 180) + (random() - 0.5) * 0.16,
        lat: (country.lat * Math.PI / 180) + (random() - 0.5) * 0.12,
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
      size: 2.6 + random() * 3.4,
      color: regionColor("Unallocated"),
      lon: (random() - 0.5) * Math.PI * 2,
      lat: (random() - 0.5) * 1.9,
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

function simplifyGeometry(geometry) {
  const simplifyRing = (ring) => {
    const step = Math.max(1, Math.ceil(ring.length / 70));
    const reduced = ring.filter((_, index) => index % step === 0);
    if (reduced.length > 2 && reduced[reduced.length - 1] !== ring[ring.length - 1]) reduced.push(ring[ring.length - 1]);
    return reduced;
  };
  if (geometry.type === "Polygon") return { ...geometry, coordinates: geometry.coordinates.map(simplifyRing) };
  return { ...geometry, coordinates: geometry.coordinates.map((polygon) => polygon.map(simplifyRing)) };
}

function traceGlobeGeometry(context, geometry, project) {
  const polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
  polygons.forEach((polygon) => polygon.forEach((ring) => {
    let drawing = false;
    let previous = null;
    ring.forEach(([lon, lat]) => {
      const point = project(lon, lat);
      const closeToPrevious = previous && Math.hypot(point.x - previous.x, point.y - previous.y) < 120;
      if (point.visible && (drawing ? closeToPrevious : true)) {
        if (!drawing) context.moveTo(point.x, point.y);
        else context.lineTo(point.x, point.y);
        drawing = true;
      } else {
        drawing = false;
      }
      previous = point;
    });
  }));
}

function globePoint(lon, lat, rotation, centerX, centerY, radius) {
  const longitude = lon + rotation;
  const cosLat = Math.cos(lat);
  const depth = cosLat * Math.cos(longitude);
  return {
    x: centerX + radius * cosLat * Math.sin(longitude),
    y: centerY - radius * Math.sin(lat),
    visible: depth > -0.05,
    depth,
  };
}

function drawEarth(context, width, height, centerY, now) {
  const radius = Math.min(width * 0.33, height * 0.235, 178);
  const centerX = width / 2;
  const rotation = now * 0.00032;

  context.save();
  context.beginPath();
  context.arc(centerX, centerY, radius, 0, Math.PI * 2);
  context.clip();

  const ocean = context.createRadialGradient(centerX - radius * 0.28, centerY - radius * 0.34, radius * 0.05, centerX, centerY, radius * 1.05);
  ocean.addColorStop(0, "#2f7edb");
  ocean.addColorStop(0.38, "#173d72");
  ocean.addColorStop(0.82, "#0c1c38");
  ocean.addColorStop(1, "#071126");
  context.fillStyle = ocean;
  context.fillRect(centerX - radius, centerY - radius, radius * 2, radius * 2);

  const project = (lon, lat) => globePoint(lon * Math.PI / 180, lat * Math.PI / 180, rotation, centerX, centerY, radius);
  context.beginPath();
  const globeFeatures = state.globeFeatures.length ? state.globeFeatures : FILE_GEOJSON_FALLBACK.features;
  globeFeatures.forEach((feature) => traceGlobeGeometry(context, feature.geometry, project));
  context.strokeStyle = "rgba(155, 239, 205, 0.55)";
  context.lineWidth = 0.8;
  context.stroke();

  context.strokeStyle = "rgba(178, 229, 255, 0.22)";
  context.lineWidth = 0.7;
  for (let index = -2; index <= 2; index += 1) {
    context.beginPath();
    context.ellipse(centerX, centerY, radius * (0.22 + Math.abs(index) * 0.18), radius, 0, 0, Math.PI * 2);
    context.stroke();
  }
  for (let index = -2; index <= 2; index += 1) {
    context.beginPath();
    context.ellipse(centerX, centerY, radius, radius * (0.22 + (2 - Math.abs(index)) * 0.18), 0, 0, Math.PI * 2);
    context.stroke();
  }
  context.restore();

  const atmosphere = context.createRadialGradient(centerX, centerY, radius * 0.84, centerX, centerY, radius * 1.18);
  atmosphere.addColorStop(0, "rgba(86, 212, 255, 0)");
  atmosphere.addColorStop(0.78, "rgba(86, 212, 255, 0.06)");
  atmosphere.addColorStop(0.96, "rgba(86, 212, 255, 0.7)");
  atmosphere.addColorStop(1, "rgba(86, 212, 255, 0)");
  context.fillStyle = atmosphere;
  context.beginPath();
  context.arc(centerX, centerY, radius * 1.18, 0, Math.PI * 2);
  context.fill();
  context.shadowColor = "#5ad5ff";
  context.shadowBlur = 22;
  context.strokeStyle = "rgba(114, 224, 255, 0.82)";
  context.lineWidth = 2.2;
  context.beginPath();
  context.arc(centerX, centerY, radius * 1.02, Math.PI * 0.08, Math.PI * 0.92);
  context.stroke();
  context.shadowBlur = 0;
  return { centerX, centerY, radius, rotation };
}

function dotOpacity(dot) {
  if (state.selectedCountry) return dot.country === state.selectedCountry ? 1 : 0.055;
  if (state.filter !== "All") return dot.region === state.filter ? 1 : 0.055;
  return dot.region === "Unallocated" ? 0.55 : 0.84;
}

function renderSignal(progress = 1, now = performance.now()) {
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

  const globe = drawEarth(context, width, height, height * 0.72, now);
  const selected = state.selectedCountry && state.data.countries.find((country) => country.code === state.selectedCountry);
  if (selected) {
    const origin = globePoint(selected.lon * Math.PI / 180, selected.lat * Math.PI / 180, globe.rotation, globe.centerX, globe.centerY, globe.radius);
    if (origin.visible) {
      context.save();
      context.globalAlpha = 0.85;
      context.strokeStyle = regionColor(selected.region);
      context.shadowColor = regionColor(selected.region);
      context.shadowBlur = 18;
      context.lineWidth = 1.5;
      context.beginPath();
      context.arc(origin.x, origin.y, 7 + Math.sin(now * 0.004) * 2, 0, Math.PI * 2);
      context.stroke();
      context.restore();
    }
  }
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
    const flight = (now * 0.00011 + dot.b) % 1;
    const source = globePoint(dot.lon, dot.lat, globe.rotation, globe.centerX, globe.centerY, globe.radius);
    const y = source.y + (top - source.y) * flight;
    const vertical = flight;
    const plumeWidth = 24 + vertical * Math.min(width * 0.37, 300);
    const band = regionOffset[dot.region] * plumeWidth * 0.52 * vertical;
    const jitter = (dot.a - 0.5) * plumeWidth * 0.72 * vertical;
    const wave = Math.sin(dot.c * Math.PI * 2 + y * 0.018 + now * 0.001) * plumeWidth * 0.065;
    const drift = Math.sin(now * 0.0012 + dot.c * 8) * Math.min(10, plumeWidth * 0.025);
    const pointerPull = state.signalPointer.active
      ? (state.signalPointer.x - 0.5) * 24 * vertical
      : 0;
    const x = source.x * (1 - vertical) + (centerX + band + jitter + wave + drift + pointerPull) * vertical;
    const alpha = dotOpacity(dot) * (source.visible ? 1 : 0.22);
    if (alpha < 0.06 && index % 2) continue;

    if (index % 3 === 0) {
      context.globalAlpha = alpha * 0.2;
      context.strokeStyle = dot.color;
      context.lineWidth = Math.max(0.5, dot.size * 0.28);
      context.beginPath();
      context.moveTo(x, y + 8 + dot.size);
      context.lineTo(x - drift * 0.35, y + 28 + dot.size * 2);
      context.stroke();
    }
    context.globalAlpha = alpha;
    context.fillStyle = dot.color;
    context.shadowColor = dot.color;
    const pulse = 1 + Math.sin(now * 0.002 + dot.a * 16) * 0.18;
    context.shadowBlur = alpha > 0.5 && index % 7 === 0 ? dot.size * 3.4 : 0;
    context.beginPath();
    context.arc(x, y, dot.size * pulse, 0, Math.PI * 2);
    context.fill();

    if (state.signalPointer.active && Math.hypot(x - width * state.signalPointer.x, y - height * state.signalPointer.y) < 74) {
      context.globalAlpha = 0.45;
      context.strokeStyle = dot.color;
      context.lineWidth = 0.8;
      context.beginPath();
      context.arc(x, y, dot.size * 2.7, 0, Math.PI * 2);
      context.stroke();
    }
  }
  context.globalAlpha = 1;
  context.shadowBlur = 0;

  const originGlow = context.createRadialGradient(globe.centerX, globe.centerY, 0, globe.centerX, globe.centerY, globe.radius * 1.8);
  originGlow.addColorStop(0, "rgba(230, 249, 255, 0.95)");
  originGlow.addColorStop(0.14, "rgba(76, 201, 240, 0.48)");
  originGlow.addColorStop(1, "rgba(76, 201, 240, 0)");
  context.fillStyle = originGlow;
  context.fillRect(globe.centerX - globe.radius * 1.8, globe.centerY - globe.radius * 1.8, globe.radius * 3.6, globe.radius * 3.6);
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
    if (raw < 1 || now - state.lastSignalPaint >= 33) {
      renderSignal(progress, now);
      state.lastSignalPaint = now;
    }
    if (now - state.lastMapPaint > 140) {
      renderMap(now);
      state.lastMapPaint = now;
    }
    if (raw < 1 || !prefersReducedMotion) requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

function mapProject(lon, lat, width, height) {
  return [((lon + 180) / 360) * width, ((90 - lat) / 180) * height];
}

function renderMap(now = performance.now()) {
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
    context.fillStyle = regionColor(country.region);
    context.shadowColor = regionColor(country.region);
    const pulse = 1 + Math.sin(now * 0.002 + country.lon) * 0.12;
    context.shadowBlur = isSelected ? 18 : 7;
    context.beginPath();
    context.arc(x, y, (isSelected ? radius + 2 : radius) * pulse, 0, Math.PI * 2);
    context.fill();
    if (isSelected) {
      context.globalAlpha = 0.42;
      context.strokeStyle = regionColor(country.region);
      context.lineWidth = 1;
      context.beginPath();
      context.arc(x, y, radius + 8 + Math.sin(now * 0.003) * 3, 0, Math.PI * 2);
      context.stroke();
    }
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
      color: regionColor(region.name),
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
  if (!readout) return;
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
      <span class="rank-track"><span class="rank-fill" style="--bar-width:${(value / max) * 100}%;--bar-color:${regionColor(country.region)}"></span></span>
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
    tooltip.innerHTML = `<strong>${country.name}</strong>`;
    tooltip.hidden = false;
    tooltip.style.left = `${Math.min(x + 12, canvas.clientWidth - 180)}px`;
    tooltip.style.top = `${Math.max(4, y - 26)}px`;
  });
  canvas.addEventListener("pointerleave", () => {
    tooltip.hidden = true;
  });
  canvas.addEventListener("click", (event) => {
    const { nearest } = locatePoint(event);
    if (nearest) selectCountry(nearest.country.code);
  });
}

function setupSignalInteraction() {
  const canvas = document.querySelector("#signal-canvas");
  const wrap = document.querySelector(".signal-canvas-wrap");
  wrap.addEventListener("pointermove", (event) => {
    const rect = canvas.getBoundingClientRect();
    state.signalPointer = {
      x: Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)),
      y: Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height)),
      active: true,
    };
    wrap.style.setProperty("--lens-x", `${event.clientX - rect.left}px`);
    wrap.style.setProperty("--lens-y", `${event.clientY - rect.top}px`);
  });
  wrap.addEventListener("pointerleave", () => {
    state.signalPointer.active = false;
  });
}

function setupCursorAura() {
  const aura = document.querySelector(".cursor-aura");
  if (!aura) return;
  window.addEventListener("pointermove", (event) => {
    aura.style.setProperty("--cursor-x", `${event.clientX}px`);
    aura.style.setProperty("--cursor-y", `${event.clientY}px`);
    aura.classList.add("is-visible");
  }, { passive: true });
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
    const filePreview = window.location.protocol === "file:";
    const dataPayload = window.__AI_ATLAS_DATA__
      ? Promise.resolve(window.__AI_ATLAS_DATA__)
      : fetch("./data/adoption.json").then((response) => {
        if (!response.ok) throw new Error("Adoption data unavailable");
        return response.json();
      });
    const mapPayload = window.__AI_ATLAS_GEOJSON__
      ? Promise.resolve(window.__AI_ATLAS_GEOJSON__)
      : filePreview
        ? Promise.resolve(FILE_GEOJSON_FALLBACK)
      : fetch("./data/world-110m.geojson").then((response) => {
        if (!response.ok) throw new Error("Map geometry unavailable");
        return response.json();
      });
    [state.data, state.geojson] = await Promise.all([dataPayload, mapPayload]);
    state.globeFeatures = state.geojson.features.map((feature) => ({
      ...feature,
      geometry: simplifyGeometry(feature.geometry),
    }));
    buildDots();
    document.querySelector("#world-users").textContent = formatCompact(state.data.world.estimatedUsers, 0);
    renderTrendChart();
    renderRegionFilter();
    renderRanking();
    updateSelectionReadout();
    updateCountryFocus(state.data.countries[0], "LEADING BY USER BASE");
    setupControls();
    setupSignalInteraction();
    setupCursorAura();
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
