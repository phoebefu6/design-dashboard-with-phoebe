const { useMemo, useState } = React;

const metricConfig = [
  { key: "appointmentSpeed", label: "Appointment speed", color: "#5fe1d2" },
  { key: "insuranceCoverage", label: "Coverage", color: "#8db7ff" },
  { key: "languageAccess", label: "Language", color: "#ffd166" },
  { key: "affordability", label: "Affordability", color: "#ff8f7f" },
  { key: "digitalReadiness", label: "Digital", color: "#b799ff" },
];

const templateRules = [
  { test: ["provider", "clinic", "site", "location"], result: "Provider access operations" },
  { test: ["wait", "appointment", "slot", "booking"], result: "Access delay and capacity" },
  { test: ["insurance", "coverage", "payer", "uninsured"], result: "Coverage equity" },
  { test: ["language", "interpreter", "translation"], result: "Language access" },
  { test: ["cost", "price", "afford", "copay"], result: "Affordability risk" },
  { test: ["no_show", "attendance", "visit"], result: "Demand reliability" },
];

function App({ payload }) {
  const [selectedId, setSelectedId] = useState(() => payload.records[0]?.id || null);
  const [region, setRegion] = useState("All regions");
  const [type, setType] = useState("All types");
  const [sort, setSort] = useState("risk");
  const [query, setQuery] = useState("");
  const [panel, setPanel] = useState("guide");
  const [fields, setFields] = useState("provider_name, region, monthly_visits, avg_wait_days, accepted_insurance_rate, interpreter_coverage, visit_cost_index, no_show_rate");

  const records = payload?.records || [];
  const regions = ["All regions", ...Array.from(new Set(records.map((row) => row.region)))];
  const types = ["All types", ...Array.from(new Set(records.map((row) => row.providerType)))];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return records
      .filter((row) => region === "All regions" || row.region === region)
      .filter((row) => type === "All types" || row.providerType === type)
      .filter((row) => !q || row.name.toLowerCase().includes(q))
      .sort((a, b) => {
        if (sort === "risk") return b.disparityRisk - a.disparityRisk;
        if (sort === "score") return b.accessScore - a.accessScore;
        if (sort === "load") return b.localDemandLoad - a.localDemandLoad;
        return b.monthlyVisits - a.monthlyVisits;
      });
  }, [records, region, type, sort, query]);

  const selected = records.find((row) => row.id === selectedId) || filtered[0] || records[0];
  const summary = useMemo(() => summarize(filtered), [filtered]);
  const fieldAdvice = useMemo(() => analyzeFields(fields), [fields]);

  return (
    <main className="shell">
      <section className="hero">
        <div>
          <h1>Care Access Signal Grid</h1>
          <p className="lede">
            A healthcare access dashboard that scans provider capacity, coverage, language access,
            affordability, and local demand pressure.
          </p>
        </div>
        <div className="heroStats" aria-label="Portfolio dashboard summary">
          <Stat label="Visible providers" value={filtered.length} />
          <Stat label="Average access" value={summary.access} suffix="/100" />
          <Stat label="High risk sites" value={summary.highRisk} />
        </div>
      </section>

      <section className="dashboard">
        <aside className="leftRail">
          <div className="module">
            <h2>Access radar</h2>
            <div className="demoTile" aria-hidden="true">
              <SignalGlyph row={selected} large />
            </div>
            <p>
              Each tile is a provider. The radar shape compares five access dimensions, while the
              center badge shows disparity risk.
            </p>
          </div>

          <div className="module compact">
            <h2>System pulse</h2>
            <Kpi label="Network score" value={summary.access} detail="Weighted access score across filtered providers" />
            <Kpi label="Demand load" value={summary.load} detail="Average local demand pressure" />
            <Kpi label="Uninsured share" value={Math.round(summary.uninsured * 100)} suffix="%" detail="Mean visible uninsured share" />
          </div>
        </aside>

        <section className="workbench">
          <div className="controls" aria-label="Dashboard controls">
            <Control label="Region">
              <select value={region} onChange={(event) => setRegion(event.target.value)}>
                {regions.map((item) => <option key={item}>{item}</option>)}
              </select>
            </Control>
            <Control label="Provider type">
              <select value={type} onChange={(event) => setType(event.target.value)}>
                {types.map((item) => <option key={item}>{item}</option>)}
              </select>
            </Control>
            <Control label="Sort">
              <select value={sort} onChange={(event) => setSort(event.target.value)}>
                <option value="risk">Highest risk</option>
                <option value="score">Highest access</option>
                <option value="load">Demand load</option>
                <option value="visits">Monthly visits</option>
              </select>
            </Control>
            <Control label="Search">
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Provider name" />
            </Control>
          </div>

          <div className="tileGrid">
            {filtered.map((row) => (
              <button
                className={`providerTile ${selected?.id === row.id ? "active" : ""}`}
                key={row.id}
                onClick={() => setSelectedId(row.id)}
              >
                <SignalGlyph row={row} />
                <span>{row.name}</span>
                <small>{row.region} / {row.providerType}</small>
              </button>
            ))}
          </div>
        </section>

        <aside className="rightRail">
          <div className="module providerDetail">
            <p className="eyebrow">Provider detail</p>
            <h2>{selected.name}</h2>
            <p>{selected.providerType} / {selected.region} / {selected.monthlyVisits.toLocaleString()} monthly visits</p>
            <div className="riskDial" style={{ "--risk": `${selected.disparityRisk * 3.6}deg` }}>
              <strong>{selected.disparityRisk}</strong>
              <span>risk</span>
            </div>
            {metricConfig.map((metric) => (
              <Meter key={metric.key} label={metric.label} value={selected[metric.key]} color={metric.color} />
            ))}
          </div>

          <div className="module">
            <div className="tabBar">
              <button className={panel === "guide" ? "active" : ""} onClick={() => setPanel("guide")}>Prep guide</button>
              <button className={panel === "input" ? "active" : ""} onClick={() => setPanel("input")}>Input layer</button>
            </div>
            {panel === "guide" ? <PrepGuide /> : <InputAdvisor fields={fields} setFields={setFields} advice={fieldAdvice} />}
          </div>
        </aside>
      </section>
    </main>
  );
}

function SignalGlyph({ row, large = false }) {
  const size = large ? 190 : 104;
  const center = size / 2;
  const radius = large ? 74 : 40;
  const axes = metricConfig.map((metric, index) => {
    const value = row[metric.key];
    const angle = (-90 + index * 72) * Math.PI / 180;
    const endX = center + Math.cos(angle) * radius;
    const endY = center + Math.sin(angle) * radius;
    const pointRadius = radius * (value / 100);
    const x = center + Math.cos(angle) * pointRadius;
    const y = center + Math.sin(angle) * pointRadius;
    return { ...metric, angle, endX, endY, x, y, value };
  });
  const radarPoints = axes.map((axis) => `${axis.x},${axis.y}`).join(" ");
  const rings = [0.25, 0.5, 0.75, 1].map((scale) =>
    axes.map((axis) => {
      const x = center + Math.cos(axis.angle) * radius * scale;
      const y = center + Math.sin(axis.angle) * radius * scale;
      return `${x},${y}`;
    }).join(" ")
  );

  return (
    <svg className="signalGlyph radarChart" viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${row.name} access radar chart`}>
      <defs>
        <filter id={`glow-${row.id}`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {rings.map((points, index) => (
        <polygon key={index} points={points} className="radarRing" />
      ))}
      {axes.map((axis) => (
        <line
          key={axis.key}
          x1={center}
          y1={center}
          x2={axis.endX}
          y2={axis.endY}
          className="radarAxis"
        />
      ))}
      <polygon points={radarPoints} className="radarArea" />
      <polyline points={`${radarPoints} ${axes[0].x},${axes[0].y}`} className="radarStroke" />
      {axes.map((axis) => (
        <circle key={axis.key} cx={axis.x} cy={axis.y} r={large ? 4 : 2.8} fill={axis.color} className="radarPoint" />
      ))}
      <circle cx={center} cy={center} r={large ? 28 : 18} className="riskCore" filter={`url(#glow-${row.id})`} />
      <text x={center} y={center + (large ? 8 : 5)} textAnchor="middle" className="coreText">{row.disparityRisk}</text>
    </svg>
  );
}

function Meter({ label, value, color }) {
  return (
    <div className="meter">
      <div><span>{label}</span><strong>{value}/100</strong></div>
      <i style={{ "--value": `${value}%`, "--color": color }} />
    </div>
  );
}

function Kpi({ label, value, suffix = "", detail }) {
  return (
    <div className="kpi">
      <span>{label}</span>
      <strong>{value}{suffix}</strong>
      <small>{detail}</small>
    </div>
  );
}

function Stat({ label, value, suffix = "" }) {
  return (
    <div className="stat">
      <span>{label}</span>
      <strong>{value}{suffix}</strong>
    </div>
  );
}

function Control({ label, children }) {
  return <label className="control"><span>{label}</span>{children}</label>;
}

function PrepGuide() {
  return (
    <div className="guide">
      <h3>Daily data-prep recipe</h3>
      <ol>
        <li>Start with one row per provider location and one reporting date.</li>
        <li>Normalize access measures to 0-100, where higher means better access.</li>
        <li>Keep pressure measures separate, such as demand load, no-show rate, and uninsured share.</li>
        <li>Create a risk score from low access, high demand, and vulnerable-population indicators.</li>
        <li>Publish the dashboard with a dated source note and a mock-data label when the data is synthetic.</li>
      </ol>
      <a href="./DATA_PREP_GUIDE.md">Open full guide</a>
    </div>
  );
}

function InputAdvisor({ fields, setFields, advice }) {
  return (
    <div className="inputAdvisor">
      <h3>What data do you have?</h3>
      <textarea value={fields} onChange={(event) => setFields(event.target.value)} />
      <div className="advice">
        <strong>{advice.template}</strong>
        <span>{advice.coverage}% field coverage</span>
      </div>
      <ul>
        {advice.matches.map((match) => <li key={match}>{match}</li>)}
      </ul>
      <p>{advice.nextStep}</p>
    </div>
  );
}

function summarize(rows) {
  if (!rows.length) return { access: 0, load: 0, highRisk: 0, uninsured: 0 };
  const avg = (key) => Math.round(rows.reduce((sum, row) => sum + row[key], 0) / rows.length);
  return {
    access: avg("accessScore"),
    load: avg("localDemandLoad"),
    highRisk: rows.filter((row) => row.disparityRisk >= 70).length,
    uninsured: rows.reduce((sum, row) => sum + row.uninsuredShare, 0) / rows.length,
  };
}

function analyzeFields(raw) {
  const normalized = raw.toLowerCase();
  const matches = [];
  templateRules.forEach((rule) => {
    if (rule.test.some((needle) => normalized.includes(needle))) matches.push(rule.result);
  });
  const unique = Array.from(new Set(matches));
  const coverage = Math.min(100, 28 + unique.length * 12 + raw.split(",").filter(Boolean).length * 4);
  const template = unique.includes("Provider access operations")
    ? "Recommended dashboard: Care Access Signal Grid"
    : "Recommended dashboard: Access readiness explorer";
  return {
    template,
    coverage,
    matches: unique.length ? unique : ["No strong fields detected yet"],
    nextStep: coverage > 70
      ? "You have enough columns for a first dashboard pass. Add weekly history for movement views."
      : "Add provider identity, geography, access measures, pressure measures, and one outcome field.",
  };
}

const root = ReactDOM.createRoot(document.getElementById("root"));

async function bootDashboard() {
  try {
    const response = await fetch("./data/providers.json");
    if (!response.ok) throw new Error(`Data request failed: ${response.status}`);
    const payload = await response.json();
    root.render(<App payload={payload} />);
  } catch (error) {
    root.render(
      <main className="loading error">
        Unable to load provider signals. Check the data file and try again.
      </main>
    );
  }
}

bootDashboard();
