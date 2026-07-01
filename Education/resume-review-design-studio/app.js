const sampleResume = `Phoebe Candidate
Product & Data Leader | Singapore

SUMMARY
Experienced product analyst responsible for dashboards, stakeholder reporting, and campaign tracking. Helped teams understand performance and improve decisions.

EXPERIENCE
Senior Product Analyst, Commerce Platform
- Responsible for weekly business reports and dashboards for leadership.
- Helped improve campaign conversion through analysis and recommendations.
- Managed data quality issues with engineering and operations teams.
- Worked on customer funnel analysis and presented findings.

Product Analyst, Growth Team
- Created reports for acquisition, retention, and pricing initiatives.
- Supported A/B testing and analyzed results.
- Worked with marketing and product managers on performance tracking.

SKILLS
SQL, Python, Tableau, stakeholder management, communication, analytics`;

const rules = [
  {
    id: "impact",
    label: "Impact clarity",
    find: /Responsible for weekly business reports and dashboards for leadership\./i,
    why: "This describes ownership, but not business value. Strong resumes show the decision, scale, and result.",
    rewrite: "Owned weekly executive reporting across 12 commerce dashboards, reducing leadership decision latency by 35% through automated KPI narratives."
  },
  {
    id: "weakverb",
    label: "Weak verb",
    find: /Helped improve campaign conversion through analysis and recommendations\./i,
    why: "“Helped” weakens your role. Use a sharper verb and quantify the improvement where possible.",
    rewrite: "Diagnosed campaign funnel drop-offs and recommended pricing and promo changes that lifted checkout conversion by 8.4%."
  },
  {
    id: "generic",
    label: "Generic collaboration",
    find: /Worked on customer funnel analysis and presented findings\./i,
    why: "This is too broad. Make the analysis method and audience visible.",
    rewrite: "Built cohort funnel analysis for 3 customer segments and presented drop-off drivers to Product, Growth, and Engineering leadership."
  },
  {
    id: "scope",
    label: "Scope missing",
    find: /Created reports for acquisition, retention, and pricing initiatives\./i,
    why: "Reports alone sound passive. Add coverage, cadence, or how the output changed team behavior.",
    rewrite: "Created acquisition, retention, and pricing scorecards used by 4 squads to prioritize weekly growth experiments."
  },
  {
    id: "testing",
    label: "Evidence missing",
    find: /Supported A\/B testing and analyzed results\./i,
    why: "A/B testing bullets should mention experiment design, sample size, metric, or decision made.",
    rewrite: "Analyzed A/B tests for onboarding and pricing journeys, translating experiment results into launch / hold recommendations."
  },
  {
    id: "summary",
    label: "Positioning",
    find: /Experienced product analyst responsible for dashboards, stakeholder reporting, and campaign tracking\./i,
    why: "The summary should position you for the target role, not list tasks.",
    rewrite: "Product analytics leader specializing in commerce growth, executive KPI storytelling, and funnel diagnostics for high-volume digital platforms."
  }
];

const templates = [
  { id: "minimal", name: "Minimal Editorial", color: "Ink + ivory", note: "Best for consulting, analytics, business roles.", className: "template-minimal", swatch: "linear-gradient(135deg,#24201d 0 32%,#fffdf8 32% 100%)" },
  { id: "executive", name: "Executive Serif", color: "Navy + cream", note: "Polished senior profile with boardroom tone.", className: "template-executive", swatch: "linear-gradient(135deg,#17395c 0 34%,#f7efe0 34% 100%)" },
  { id: "modern", name: "Modern Product", color: "Sage + charcoal", note: "Clean product / tech resume with calm authority.", className: "template-modern", swatch: "linear-gradient(135deg,#176f4d 0 34%,#f5f8f0 34% 100%)" },
  { id: "creative", name: "Creative Accent", color: "Berry + blush", note: "Distinctive without breaking ATS readability.", className: "template-creative", swatch: "linear-gradient(135deg,#b64067 0 34%,#fff1f4 34% 100%)" },
  { id: "compact", name: "Compact ATS", color: "Mono black", note: "Dense one-page format for keyword-heavy roles.", className: "template-compact", swatch: "linear-gradient(135deg,#1c1c1c 0 34%,#ffffff 34% 100%)" }
];

const state = {
  suggestions: [],
  decisions: {},
  selectedTemplate: templates[0]
};

const resumeInput = document.querySelector("#resumeInput");
const targetRole = document.querySelector("#targetRole");
const annotatedResume = document.querySelector("#annotatedResume");
const suggestionList = document.querySelector("#suggestionList");
const issueCount = document.querySelector("#issueCount");
const acceptedCount = document.querySelector("#acceptedCount");
const rejectedCount = document.querySelector("#rejectedCount");
const scoreValue = document.querySelector("#scoreValue");
const approvedContent = document.querySelector("#approvedContent");
const resumePaper = document.querySelector("#resumePaper");
const templateBadge = document.querySelector("#templateBadge");
const templateGrid = document.querySelector("#templateGrid");
const fileStatus = document.querySelector("#fileStatus");

function getLines() {
  return resumeInput.value
    .split("\n")
    .map(line => line.trim())
    .filter(Boolean);
}

function runReview() {
  const text = resumeInput.value || sampleResume;
  state.suggestions = rules
    .filter(rule => rule.find.test(text))
    .map((rule, index) => ({
      ...rule,
      index,
      original: text.match(rule.find)?.[0] || ""
    }));

  if (state.suggestions.length === 0 && text.trim()) {
    state.suggestions = [{
      id: "general",
      label: "Content precision",
      original: getLines()[0] || "Resume content",
      why: "The resume can be strengthened by adding measurable outcomes, stronger verbs, and target-role keywords.",
      rewrite: `Reframe experience toward ${targetRole.value}: combine scope, action, measurable impact, and tools used.`
    }];
  }

  state.decisions = {};
  renderAll();
}

function highlightLine(line) {
  const suggestion = state.suggestions.find(item => item.original && line.toLowerCase().includes(item.original.toLowerCase()));
  if (!suggestion) return { html: escapeHtml(line), className: "" };

  const decision = state.decisions[suggestion.id];
  const className = decision ? decision : "has-issue";
  const html = escapeHtml(line).replace(escapeHtml(suggestion.original), `<span class="highlight-mark">${escapeHtml(suggestion.original)}</span>`);
  return { html, className };
}

function renderResume() {
  const lines = getLines();
  const name = lines[0] || "Resume Candidate";
  const title = lines[1] || targetRole.value;
  document.querySelector("#resumeName").textContent = name;
  document.querySelector("#resumeTitle").textContent = title;

  annotatedResume.innerHTML = lines.slice(2).map(line => {
    const highlighted = highlightLine(line);
    return `<div class="resume-line ${highlighted.className}">${highlighted.html}</div>`;
  }).join("");
}

function renderSuggestions() {
  suggestionList.innerHTML = state.suggestions.length ? state.suggestions.map(item => {
    const decision = state.decisions[item.id] || "";
    return `
      <article class="suggestion-card ${decision}">
        <div class="suggestion-meta"><span>${item.label}</span><span>${decision || "pending"}</span></div>
        <strong>${escapeHtml(item.original || "General resume guidance")}</strong>
        <p>${escapeHtml(item.why)}</p>
        <div class="rewrite">${escapeHtml(item.rewrite)}</div>
        <div class="suggestion-actions">
          <button class="accept-btn" data-decision="accepted" data-id="${item.id}">Accept</button>
          <button class="reject-btn" data-decision="rejected" data-id="${item.id}">Reject</button>
        </div>
      </article>
    `;
  }).join("") : `<div class="suggestion-card"><strong>No review yet</strong><p>Upload or type resume content, then run AI review.</p></div>`;

  suggestionList.querySelectorAll("button").forEach(button => {
    button.addEventListener("click", () => {
      state.decisions[button.dataset.id] = button.dataset.decision;
      renderAll();
    });
  });
}

function renderCounts() {
  const accepted = Object.values(state.decisions).filter(value => value === "accepted").length;
  const rejected = Object.values(state.decisions).filter(value => value === "rejected").length;
  issueCount.textContent = state.suggestions.length;
  acceptedCount.textContent = accepted;
  rejectedCount.textContent = rejected;
  scoreValue.textContent = Math.min(96, 68 + accepted * 5 - rejected * 2);
}

function generateApprovedContent() {
  const text = resumeInput.value;
  let generated = text;
  state.suggestions.forEach(item => {
    if (state.decisions[item.id] === "accepted" && item.original) {
      generated = generated.replace(item.original, item.rewrite);
    }
  });

  const accepted = Object.values(state.decisions).filter(value => value === "accepted").length;
  approvedContent.textContent = accepted
    ? generated
    : "No approved suggestions yet. Accept at least one recommendation to generate refined content.";
}

function renderTemplates() {
  templateGrid.innerHTML = templates.map(template => `
    <button class="template-card ${state.selectedTemplate.id === template.id ? "active" : ""}" data-template="${template.id}">
      <span class="template-preview" style="background:${template.swatch}"></span>
      <strong>${template.name}</strong>
      <span>${template.color}</span>
      <span>${template.note}</span>
    </button>
  `).join("");

  templateGrid.querySelectorAll(".template-card").forEach(card => {
    card.addEventListener("click", () => {
      state.selectedTemplate = templates.find(template => template.id === card.dataset.template);
      applyTemplate();
      renderTemplates();
    });
  });
}

function applyTemplate() {
  resumePaper.className = `resume-paper ${state.selectedTemplate.className}`;
  templateBadge.textContent = state.selectedTemplate.name;
}

function renderAll() {
  renderResume();
  renderSuggestions();
  renderCounts();
}

function exportPdf() {
  generateApprovedContent();
  const acceptedText = approvedContent.textContent;
  if (acceptedText && !acceptedText.startsWith("No approved")) {
    resumeInput.value = acceptedText;
    renderResume();
  }
  document.body.classList.add("printing");
  window.print();
  window.setTimeout(() => document.body.classList.remove("printing"), 500);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

document.querySelector("#sampleBtn").addEventListener("click", () => {
  resumeInput.value = sampleResume;
  runReview();
});

document.querySelector("#reviewBtn").addEventListener("click", runReview);
document.querySelector("#generateBtn").addEventListener("click", generateApprovedContent);
document.querySelector("#exportBtn").addEventListener("click", exportPdf);
document.querySelector("#clearBtn").addEventListener("click", () => {
  resumeInput.value = "";
  state.suggestions = [];
  state.decisions = {};
  approvedContent.textContent = "Approve suggestions, then generate the refined resume content.";
  renderAll();
});

document.querySelector("#pasteModeBtn").addEventListener("click", () => resumeInput.focus());

document.querySelector("#resumeFile").addEventListener("change", event => {
  const file = event.target.files?.[0];
  if (!file) return;
  fileStatus.textContent = file.name;
  if (/text|markdown/.test(file.type) || /\.(txt|md)$/i.test(file.name)) {
    const reader = new FileReader();
    reader.onload = () => {
      resumeInput.value = reader.result;
      runReview();
    };
    reader.readAsText(file);
  } else {
    resumeInput.value = `${file.name}
${targetRole.value}

Uploaded file received. This static prototype can read TXT/MD directly. For DOC, DOCX, and PDF production intake, connect a parser service, then run the AI review on extracted text.`;
    runReview();
  }
});

resumeInput.value = sampleResume;
renderTemplates();
applyTemplate();
runReview();
