# Project Memory

## Portfolio Goal

Build a public dashboard design portfolio that can eventually hold 200 dashboard concepts across industries. Each project should show Phoebe as a data product designer, strategist, builder, and visual systems thinker.

## Daily Workflow

1. Pick a new industry or business problem.
2. Define the audience and operational question.
3. Generate or prepare a compact mock dataset with Python.
4. Build the dashboard as a static, GitHub Pages-friendly React experience.
5. Include a data-prep guide so the audience can replicate the concept with their own data.
6. Publish to GitHub Pages and update the root catalog.

## Design Rules Learned From This Iteration

- Do not closely mimic the source Tableau layout, marks, palette, wording, or brand cues.
- Transform references into a new visual system with different shape language and interaction grammar.
- Avoid old-school chart collections. Build dashboard products with strong information architecture.
- Keep the default view useful before interaction, then add detail through filters and selection.
- Text must wrap cleanly on desktop and mobile. Avoid truncation except for bounded metadata.
- Include a visible mock-data or synthetic-data label when real data is unavailable.

## Current Project

`Healthcare/care-access-signal-grid` is a healthcare access operations dashboard. It uses:

- Python for deterministic mock data generation.
- React for the interactive dashboard.
- CSS/SVG for custom signal-tile visualization.
- A data-prep guide and input-field advisor for audience reuse.
