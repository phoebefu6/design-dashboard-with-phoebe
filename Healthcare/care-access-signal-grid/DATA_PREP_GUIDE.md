# Data Prep Guide

This dashboard uses synthetic healthcare access data. The recommended real-data grain is:

```text
one row = one provider location for one reporting period
```

## Required Fields

| Field | Example | Purpose |
|---|---|---|
| `provider_name` | Cedar Health | Tile label and lookup |
| `region` | Central | Global filter |
| `provider_type` | Clinic | Global filter |
| `monthly_visits` | 22162 | Volume context |
| `avg_wait_days` | 7.4 | Appointment speed score |
| `accepted_insurance_rate` | 0.77 | Insurance coverage score |
| `interpreter_coverage_rate` | 0.87 | Language access score |
| `cost_index` | 0.36 | Affordability score |
| `digital_completion_rate` | 0.72 | Digital readiness score |
| `local_demand_index` | 0.95 | Demand pressure |
| `uninsured_share` | 0.18 | Equity risk context |
| `no_show_rate` | 0.11 | Reliability context |

## Score Normalization

Convert all positive access measures to a 0-100 scale where higher means better:

```text
appointment_speed = 100 - percentile_rank(avg_wait_days)
insurance_coverage = accepted_insurance_rate * 100
language_access = interpreter_coverage_rate * 100
affordability = 100 - percentile_rank(cost_index)
digital_readiness = digital_completion_rate * 100
local_demand_load = percentile_rank(local_demand_index)
```

## Risk Score

Start with a transparent weighted formula, then tune it with stakeholders:

```text
access_score =
  appointment_speed * 0.20
  + insurance_coverage * 0.20
  + language_access * 0.20
  + affordability * 0.22
  + digital_readiness * 0.12
  + (100 - local_demand_load) * 0.06

disparity_risk =
  100 - access_score
  + affordability_gap * 0.16
  + local_demand_load * 0.10
```

## Dashboard Prep Checklist

- Keep raw fields, normalized fields, and final scores in separate columns.
- Preserve reporting date for trend views or period-over-period comparisons.
- Add a `source_last_updated_at` field before publishing real data.
- Label mock, synthetic, estimated, and audited fields differently.
- Do not publish patient-level data in this portfolio project.

## Python Regeneration

From the repository root:

```bash
python3 Healthcare/care-access-signal-grid/scripts/generate_mock_data.py
```

The script writes:

```text
Healthcare/care-access-signal-grid/data/providers.json
```
