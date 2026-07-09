# Design Dashboard with Phoebe

A public portfolio of industry-focused dashboard concepts by Phoebe Fu.

This repository is designed to grow into a catalog of 200 dashboard designs that combine data strategy, product thinking, information design, frontend craft, and practical data-prep guidance.

## Featured Dashboards

| # | Industry | Dashboard | Focus | Live |
|---:|---|---|---|---|
| 001 | Ecommerce | [Mega Campaign Live Dashboard](./Ecommerce/mega-campaign-live-dashboard/) | Campaign command center, GMV, funnel, category and incident monitoring | [Open](https://phoebefu6.github.io/design-dashboard-with-phoebe/Ecommerce/mega-campaign-live-dashboard/) |
| 002 | Aquaculture | [AquaPrime Delivery Control](./Aquaculture/aquaprime-delivery-control/) | Hatchery-to-client delivery control, production readiness, logistics risk | [Open](https://phoebefu6.github.io/design-dashboard-with-phoebe/Aquaculture/aquaprime-delivery-control/) |
| 003 | HR | [PeopleLens HR Intelligence Platform](./HR/people-analysis-intelligent-platform/) | Workforce intelligence, hiring, retention, learning, inclusion and tenure | [Open](https://phoebefu6.github.io/design-dashboard-with-phoebe/HR/people-analysis-intelligent-platform/) |
| 004 | Finance | [FX Motion Real-time Converter](./Finance/real-time-fx-converter/) | Motion-led FX conversion with dated source status and audit links | [Open](https://phoebefu6.github.io/design-dashboard-with-phoebe/Finance/real-time-fx-converter/) |
| 005 | Education | [CodeNest Python Learning Studio](./Education/coding-learning-platform/) | Guided Python learning, coding lab, notebook practice and AI tutor feedback | [Open](https://phoebefu6.github.io/design-dashboard-with-phoebe/Education/coding-learning-platform/) |
| 006 | Education | [Resume Atelier AI Review Studio](./Education/resume-review-design-studio/) | Resume review, rewrite, design, suggestions and PDF-ready formats | [Open](https://phoebefu6.github.io/design-dashboard-with-phoebe/Education/resume-review-design-studio/) |
| 007 | Healthcare | [Care Access Signal Grid](./Healthcare/care-access-signal-grid/) | Provider access operations, disparity risk, field-advisor and data prep | [Open](https://phoebefu6.github.io/design-dashboard-with-phoebe/Healthcare/care-access-signal-grid/) |

## Industry Index

- [Aquaculture](./Aquaculture/)
- [Ecommerce](./Ecommerce/)
- [Education](./Education/)
- [Finance](./Finance/)
- [Healthcare](./Healthcare/)
- [HR](./HR/)

## Portfolio System

Every dashboard should include:

- A public GitHub Pages URL.
- A concise project README.
- A clear dashboard audience and operational question.
- A data source note, including mock/synthetic labels when applicable.
- A data-prep guide when the design can teach others how to prepare their own data.
- Desktop and mobile responsive behavior.
- Interactions that help readers explore, compare, filter, or diagnose.

## Daily Build Loop

Use this loop to add a new dashboard every day:

1. Pick an industry, role, and decision moment.
2. Sketch the metric model and dashboard reading path.
3. Prepare or generate data with Python.
4. Build a GitHub Pages-friendly dashboard with HTML, CSS, JavaScript, React, SVG, Canvas, or another suitable web stack.
5. Add a data-prep guide so viewers can reproduce the concept with their own data.
6. Update this catalog and the relevant industry README.
7. Publish and verify the live URL.

## Push It

After a dashboard is ready, publish current changes with:

```bash
./scripts/push-it.sh "Add dashboard 008"
```

The script stages the repo, creates a commit when there are local changes, and pushes the current branch to GitHub. If there are no local changes, it still runs `git push` so the remote state is confirmed.

## Design Principles

- Treat dashboards as products, not chart dumps.
- Make the default view useful before interaction.
- Keep source, grain, metric definitions, and caveats visible where they matter.
- Use custom visual systems when the problem benefits from a new encoding.
- Preserve accessibility, readable typography, responsive layout, and reduced-motion support.
- Transform visual references so the output has its own industry, shape language, layout, palette, and interaction model.

## Run Locally

Each project is static and can be served from the repository root:

```bash
python3 -m http.server 8080
```

Then open the dashboard path, for example:

```text
http://localhost:8080/Healthcare/care-access-signal-grid/
```

All displayed values are illustrative unless a project README states otherwise.
