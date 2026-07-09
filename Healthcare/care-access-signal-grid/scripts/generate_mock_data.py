#!/usr/bin/env python3
"""Generate deterministic mock data for the Care Access Signal Grid dashboard."""

from __future__ import annotations

import json
import math
import random
from pathlib import Path


RNG = random.Random(4207)

REGIONS = ["North", "South", "East", "West", "Central"]
TYPES = ["Clinic", "Urgent Care", "Virtual", "Pharmacy", "Mobile Unit"]
OWNERSHIP = ["Public", "Nonprofit", "Private"]

NAMES = [
    "Cedar Health", "Avon Commons", "Marina Family", "Silverlake Med", "CareLoop Central",
    "Parkside Access", "Fern Street", "Vista Family", "Horizon Community", "PulsePoint South",
    "Bridgeview First", "WellSpring East", "First Mile Med", "Greenhouse Health", "Civic Care",
    "Cobalt Commons", "Brightline Mobile", "Kindred Walk-in", "Hopewell Family", "Arbor Family",
    "Pinecrest Clinic", "Stonebridge Care", "MetroReach", "HarborPoint", "Oakline Health",
    "Maple Walk-in", "Northstar Virtual", "Lantern Clinic", "Elm Circle", "Juniper Access",
    "Summit Care", "Beacon Family", "Riverbend Health", "Union Mobile", "MercyPoint",
    "ClearPath Pharmacy", "Sage Street", "OpenDoor West", "Nova Clinic", "CrossTown Health",
    "MeadowLink", "Eastgate Care", "Pioneer Med", "Valley Access", "Blue Ridge Health",
    "Garden Walk-in", "Sunrise Mobile", "Crescent Health", "Anchor Pharmacy", "Lakeside Care",
    "Orbit Virtual", "Keystone Clinic", "Willow Urgent", "CityBridge", "Evergreen Health",
    "Atlas Mobile", "Prairie Family", "Bayside Access", "PointCare", "Hillcrest Med",
]


def clamp(value: float, low: int = 8, high: int = 98) -> int:
    return int(max(low, min(high, round(value))))


def provider_record(index: int, name: str) -> dict:
    region = REGIONS[index % len(REGIONS)]
    provider_type = TYPES[(index * 3 + 2) % len(TYPES)]
    ownership = OWNERSHIP[(index * 5 + 1) % len(OWNERSHIP)]

    base = RNG.uniform(45, 88)
    density_penalty = {"Central": 8, "East": 2, "North": 0, "South": -3, "West": 4}[region]
    mobile_bonus = 8 if provider_type == "Mobile Unit" else 0
    virtual_bonus = 12 if provider_type == "Virtual" else 0
    pharmacy_bonus = 5 if provider_type == "Pharmacy" else 0

    appointment_speed = clamp(base - density_penalty + RNG.gauss(0, 12) + mobile_bonus)
    insurance_coverage = clamp(base + RNG.gauss(0, 11) + (7 if ownership != "Private" else -4))
    language_access = clamp(base + RNG.gauss(0, 15) + virtual_bonus)
    affordability = clamp(base + RNG.gauss(0, 13) + (8 if ownership in ("Public", "Nonprofit") else -9))
    digital_readiness = clamp(base + RNG.gauss(0, 14) + virtual_bonus + pharmacy_bonus)
    local_load = clamp(100 - base + RNG.gauss(0, 13) + density_penalty, 12, 96)

    access_score = clamp(
        appointment_speed * 0.2
        + insurance_coverage * 0.2
        + language_access * 0.2
        + affordability * 0.22
        + digital_readiness * 0.12
        + (100 - local_load) * 0.06
    )

    disparity_risk = clamp(
        100
        - access_score
        + (100 - affordability) * 0.16
        + local_load * 0.1
        + RNG.gauss(0, 6),
        3,
        97,
    )

    visits = int(RNG.uniform(4200, 39000) * (1.22 if provider_type in ("Clinic", "Urgent Care") else 0.72))
    uninsured_share = round(clamp(100 - insurance_coverage + RNG.gauss(0, 7), 4, 54) / 100, 3)
    wait_days = round(max(0.5, 18 - appointment_speed / 6 + RNG.uniform(-1.5, 3.5)), 1)
    no_show_rate = round(clamp(18 + local_load * 0.15 - digital_readiness * 0.08 + RNG.gauss(0, 3), 3, 32) / 100, 3)

    trend = []
    trend_base = access_score - RNG.uniform(8, 17)
    for week in range(12):
        trend.append(clamp(trend_base + week * RNG.uniform(0.7, 1.5) + math.sin(week / 2) * 3 + RNG.gauss(0, 2), 10, 98))

    return {
        "id": f"provider-{index + 1:03d}",
        "name": name,
        "region": region,
        "providerType": provider_type,
        "ownership": ownership,
        "monthlyVisits": visits,
        "accessScore": access_score,
        "disparityRisk": disparity_risk,
        "appointmentSpeed": appointment_speed,
        "insuranceCoverage": insurance_coverage,
        "languageAccess": language_access,
        "affordability": affordability,
        "digitalReadiness": digital_readiness,
        "localDemandLoad": local_load,
        "uninsuredShare": uninsured_share,
        "waitDays": wait_days,
        "noShowRate": no_show_rate,
        "trend": trend,
    }


def main() -> None:
    out_dir = Path(__file__).resolve().parents[1] / "data"
    out_dir.mkdir(parents=True, exist_ok=True)
    records = [provider_record(i, name) for i, name in enumerate(NAMES)]
    payload = {
        "generatedAt": "2026-07-09",
        "source": "Synthetic mock data generated for portfolio demonstration.",
        "industry": "Healthcare access operations",
        "grain": "One row per care provider location.",
        "records": records,
    }
    (out_dir / "providers.json").write_text(json.dumps(payload, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
