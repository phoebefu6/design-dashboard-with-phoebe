const modules = [
  { id: "01", title: "Python setup & mental model", detail: "What code is, how scripts run, print(), comments", status: "done" },
  { id: "02", title: "Variables and simple math", detail: "Numbers, strings, naming, business calculations", status: "active" },
  { id: "03", title: "Functions as reusable recipes", detail: "Inputs, return values, small test cases", status: "active" },
  { id: "04", title: "If / else decisions", detail: "Pricing tiers, validation, risk flags", status: "locked" },
  { id: "05", title: "Lists and loops", detail: "Process many orders without copy-paste", status: "locked" },
  { id: "06", title: "Dictionaries and records", detail: "Model customers, products, scores", status: "locked" },
  { id: "07", title: "Files and data cleanup", detail: "Read CSV, clean messy text, export results", status: "locked" },
  { id: "08", title: "Mini capstone", detail: "Build a small sales insight notebook", status: "locked" }
];

const starterCode = `price = 18
quantity = 3

def total(price, quantity):
    return price * quantity

print("Total:", total(price, quantity))`;

const moduleList = document.querySelector("#moduleList");
const moduleFilter = document.querySelector("#moduleFilter");
const codeEditor = document.querySelector("#codeEditor");
const outputBox = document.querySelector("#outputBox");
const returnCheck = document.querySelector("#returnCheck");
const scoreValue = document.querySelector("#scoreValue");

function renderModules(filter = "all") {
  const visible = modules.filter(module => filter === "all" || module.status === filter);
  moduleList.innerHTML = visible.map(module => `
    <article class="module-card" data-status="${module.status}">
      <span class="module-icon">${module.id}</span>
      <div>
        <strong>${module.title}</strong>
        <small>${module.detail}</small>
      </div>
      <span class="status">${module.status}</span>
    </article>
  `).join("");
}

function simulatePythonRun() {
  const code = codeEditor.value;
  const hasFunction = /def\s+\w+\s*\(/.test(code);
  const hasReturn = /return\s+/.test(code);
  const hasPrint = /print\s*\(/.test(code);
  const priceMatch = code.match(/price\s*=\s*(\d+(?:\.\d+)?)/);
  const quantityMatch = code.match(/quantity\s*=\s*(\d+(?:\.\d+)?)/);
  const price = priceMatch ? Number(priceMatch[1]) : 18;
  const quantity = quantityMatch ? Number(quantityMatch[1]) : 3;
  const total = price * quantity;
  const score = Math.min(100, 38 + (hasFunction ? 22 : 0) + (hasReturn ? 20 : 0) + (hasPrint ? 12 : 0) + (priceMatch && quantityMatch ? 8 : 0));

  scoreValue.textContent = score;
  returnCheck.className = `check-item ${hasReturn ? "pass" : "fail"}`;
  returnCheck.textContent = hasReturn ? "Returns a reusable value" : "Missing return statement";

  const feedback = [
    "▶ Running price_calculator.py",
    "",
    hasPrint ? `Total: ${Number.isInteger(total) ? total : total.toFixed(2)}` : "(No print output detected)",
    "",
    `Auto-check score: ${score}/100`,
    hasFunction ? "✓ Function found — reusable logic unlocked." : "• Add a function with def total(...):",
    hasReturn ? "✓ return statement found — good habit." : "• Try returning the answer instead of only printing.",
    priceMatch && quantityMatch ? "✓ Variables found — easy to change inputs." : "• Define price and quantity variables."
  ];

  outputBox.textContent = feedback.join("\n");
}

function formatCode() {
  codeEditor.value = codeEditor.value
    .replace(/\t/g, "    ")
    .replace(/[ ]+\n/g, "\n")
    .trimEnd();
}

function setActiveNav() {
  const sections = [...document.querySelectorAll("#path, #ide, #notebook, #coach, #progress")];
  let active = "path";
  sections.forEach(section => {
    const rect = section.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.45) active = section.id;
  });
  document.querySelectorAll(".nav-link").forEach(link => {
    link.classList.toggle("active", link.dataset.section === active);
  });
}

document.querySelectorAll(".mode-tab").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".mode-tab").forEach(tab => tab.classList.remove("active"));
    button.classList.add("active");
    const target = button.dataset.mode === "notebook" ? "#notebook" : "#ide";
    document.querySelector(target).scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

document.querySelectorAll(".cell-run").forEach(button => {
  button.addEventListener("click", () => {
    const output = button.parentElement.querySelector(".cell-output");
    output.textContent = `Out: ${button.dataset.result}\n✓ Cell completed`;
  });
});

document.querySelector("#runNotebookBtn").addEventListener("click", () => {
  document.querySelectorAll(".cell-run").forEach(button => button.click());
});

document.querySelector("#runMainBtn").addEventListener("click", simulatePythonRun);
document.querySelector("#formatBtn").addEventListener("click", formatCode);
document.querySelector("#clearOutputBtn").addEventListener("click", () => outputBox.textContent = "Output cleared. Run code when ready.");
document.querySelector("#resetBtn").addEventListener("click", () => {
  codeEditor.value = starterCode;
  outputBox.textContent = "Lesson reset. Click “Run code” to test the starter script.";
  returnCheck.className = "check-item warn";
  returnCheck.textContent = "Run to check output";
  scoreValue.textContent = "72";
});

moduleFilter.addEventListener("change", event => renderModules(event.target.value));
window.addEventListener("scroll", setActiveNav, { passive: true });

renderModules();
setActiveNav();
