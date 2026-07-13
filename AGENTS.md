# Project Publishing Requirements

These requirements apply to every project in this repository.

## Client-facing live link

A dashboard project is not complete until it has a public, clickable URL that can be shared with a client and opened in a browser without installing anything.

For every new or updated project:

1. Publish the project through GitHub Pages or another approved public host.
2. Verify the live URL works.
3. Add a prominent `View live dashboard` link to the project README.
4. Add the same clickable link to the root portfolio README.
5. Include the live URL in the final project handoff.

Do not present a `localhost`, `file://`, or repository source-code URL as the client-facing deliverable.

## End-of-task review and retention

After every completed task, perform a short retention review before handoff:

1. Review the completed work, validation results, user corrections, and decisions.
2. Identify lessons or requirements that should apply to future repository work.
3. Update `AGENTS.md` when a durable workflow, constraint, quality standard, or user preference has emerged.
4. Update the root README when the portfolio structure, project list, shared usage instructions, or live links change.
5. Update the relevant project README when its features, interactions, setup, limitations, or public URL change.
6. Confirm that documentation matches the implementation and remove stale instructions.
7. Commit and push documentation updates when the task includes publishing repository changes.

Retain only reusable information. Do not clutter instruction or README files with temporary debugging details, conversational history, duplicated guidance, secrets, credentials, or machine-specific state.

In the final handoff, briefly mention any material instruction or documentation updates made during this review.

## Portfolio growth standards

This repository is intended to scale to 200 dashboard designs. New dashboards should be organized by industry, include a project README, expose a public GitHub Pages URL, and update the root catalog table.

The root README is client- and recruiter-facing. Keep it concise and let the dashboard work speak, but include a short human introduction with enough context and personality. The intro should mention the portfolio's range across industries, dashboard styles, layouts, chart types, and problem contexts without turning into a skill checklist. Because GitHub already shows the repository name above the README, avoid repeating the title with a redundant H1. Do not add a standalone live portfolio link unless there is a real designed portfolio landing page at that URL; the project table already contains live dashboard links. Avoid repetitive explanation, explicit claims about taste/skill, internal build steps, publishing commands, or agent workflow instructions. Keep those in `AGENTS.md` or project memory files instead of the public README.

When real data is unavailable, use clearly labeled synthetic or mock data. Prefer a reproducible data generator, usually Python, so the dashboard can be rebuilt and adapted later.

When a dashboard derives a headcount by combining an adoption rate with population data, label the result as an estimate, document the formula and source years, disclose any unallocated remainder, and avoid implying product- or model-level market share when the source only measures category-level use.

Prefer clean, readable dashboard palettes with light or balanced backgrounds. Avoid making future dashboards feel overly dark unless the user explicitly asks for a dark operational theme.

When a dashboard is inspired by a public reference, transform the industry, layout, mark language, palette, typography, wording, and interaction model so the result is an original portfolio work rather than a close copy.

For repeatable portfolio work, add project memory or a data-prep guide when it helps Phoebe reuse the workflow for future daily builds.

## Push-it command

When Phoebe says `push it`, treat that as permission to publish the current repository changes to GitHub.

Use:

```bash
./scripts/push-it.sh "Update dashboard portfolio"
```

If the current task has a clearer commit message, pass that message instead. The script stages all current repository changes, commits them when needed, and pushes the current branch to `origin`.

Before running it, make sure the current working directory is the repository root or a child of it. After running it, report the commit hash, push result, and the relevant GitHub Pages live URL when applicable.
