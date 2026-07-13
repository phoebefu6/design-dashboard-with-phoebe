# AI Adoption Signal Atlas

[**View live dashboard**](https://phoebefu6.github.io/design-dashboard-with-phoebe/Technology/ai-adoption-signal-atlas/)

An interactive global view of generative AI diffusion in Q1 2026. The central signal field contains 946 dots, with each dot representing approximately one million estimated working-age users. Region filters, a country bubble map, and two ranking modes distinguish absolute user scale from adoption saturation.

## What the dashboard shows

- Estimated generative AI users across 147 published economies
- Q1 2026 global adoption of 17.8% among people aged 15–64
- Global North, Global South, and worldwide adoption from H1 2025 to Q1 2026
- Region-colored user dots above an Earth horizon
- Country focus through the map and ranking rows
- Separate leaderboards for estimated users and adoption share
- A visible methodology dialog and source links

## Data and calculation

The country adoption rates come from Microsoft’s [Q1 2026 Global AI Diffusion dataset](https://raw.githubusercontent.com/microsoft/ai-diffusion-report/main/data/AI_Diffusion_Q12026_Update.csv) and [report](https://aka.ms/DiffusionReport2026Q1). Microsoft defines AI diffusion as the share of people aged 15–64 who used a generative AI product during the reporting period, based on aggregated and anonymized telemetry adjusted for device share, internet access, and population. The methodology is documented in the [technical paper](https://doi.org/10.48550/arXiv.2511.02781).

Estimated users are calculated as:

```text
AI diffusion share × population aged 15–64 = estimated users
```

Population comes from the UN World Population Prospects 2024 series distributed by [Our World in Data](https://ourworldindata.org/grapher/population-by-age-group-with-projections). Country geometry and display coordinates come from [Natural Earth](https://www.naturalearthdata.com/).

The worldwide calculation produces about 945.6 million users, rounded to 946 dots. Published country records account for about 934.3 million. The 12-dot difference is shown in neutral gray as an unallocated worldwide remainder rather than assigned to countries without supporting data.

## Interpretation and limitations

- This is an estimated population-scale adoption signal, not an exact unique-user count.
- It measures use across generative AI products; it does not estimate market share for ChatGPT, Claude, Gemini, Copilot, or another specific model.
- Country totals combine adoption rates and 2024 population estimates, so they should be read directionally.
- Country dot allocations use largest-remainder rounding to keep the complete field at 946 dots.
- World boundaries are shown for visualization and do not imply a position on territorial status.

## Run locally

From the repository root:

```bash
python3 -m http.server 4173
```

Open `http://localhost:4173/Technology/ai-adoption-signal-atlas/`.

To rebuild the processed data snapshot, see [DATA_PREP_GUIDE.md](./DATA_PREP_GUIDE.md).
