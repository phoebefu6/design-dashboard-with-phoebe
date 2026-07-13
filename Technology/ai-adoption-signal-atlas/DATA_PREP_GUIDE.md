# Data preparation guide

The dashboard stores a processed snapshot in `data/adoption.json` and a local Natural Earth geometry file in `data/world-110m.geojson` so the published dashboard has no runtime API dependency.

## Rebuild from public sources

From the repository root:

```bash
python3 Technology/ai-adoption-signal-atlas/scripts/build_data.py
```

The script downloads and joins:

1. Microsoft AI Diffusion rates for H1 2025, H2 2025, and Q1 2026.
2. UN World Population Prospects 2024 age groups distributed by Our World in Data.
3. Natural Earth 1:110m country geometry and label coordinates.

It calculates the 15–64 population as total population minus the under-15 and 65+ groups, multiplies that population by each AI diffusion rate, and allocates whole-million dots with the largest-remainder method.

## Rebuild from local downloads

For a reproducible offline run after downloading source files:

```bash
python3 Technology/ai-adoption-signal-atlas/scripts/build_data.py \
  --microsoft /path/to/AI_Diffusion_Q12026_Update.csv \
  --owid /path/to/population-by-age-group-with-projections.csv \
  --natural-earth /path/to/ne_110m_admin_0_countries.geojson
```

The script fails if any economy cannot be joined. Review source changes before adding aliases; do not silently drop records.
