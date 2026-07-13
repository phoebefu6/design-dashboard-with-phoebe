#!/usr/bin/env python3
"""Build the source-backed data snapshot for the AI Adoption Signal Atlas.

The script joins Microsoft's AI diffusion rates to UN World Population
Prospects age-group estimates distributed by Our World in Data. Natural Earth
provides display regions and country label coordinates. It uses only the Python
standard library so the snapshot can be rebuilt without project dependencies.
"""

from __future__ import annotations

import argparse
import csv
import io
import json
import math
import urllib.request
from pathlib import Path


MICROSOFT_URL = (
    "https://raw.githubusercontent.com/microsoft/ai-diffusion-report/"
    "main/data/AI_Diffusion_Q12026_Update.csv"
)
OWID_URL = (
    "https://ourworldindata.org/grapher/"
    "population-by-age-group-with-projections.csv"
)
NATURAL_EARTH_URL = (
    "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/"
    "master/geojson/ne_110m_admin_0_countries.geojson"
)

ALIASES = {
    "Bosnia And Herzegovina": "Bosnia and Herzegovina",
    "Congo (DRC)": "Democratic Republic of Congo",
    "Cote D'Ivoire": "Cote d'Ivoire",
    "TŸrkiye": "Turkey",
}

DISPLAY_NAMES = {
    "TŸrkiye": "Türkiye",
    "Cote D'Ivoire": "Côte d’Ivoire",
}

COORDINATE_FALLBACKS = {
    "SGP": {"lon": 103.8198, "lat": 1.3521, "continent": "Asia"},
    "GUF": {"lon": -53.1258, "lat": 3.9339, "continent": "South America"},
}

REGION_FOR_CONTINENT = {
    "Africa": "Africa",
    "Asia": "Asia",
    "Europe": "Europe",
    "North America": "Americas",
    "South America": "Americas",
    "Oceania": "Oceania",
    "Seven seas (open ocean)": "Oceania",
}

REGION_ORDER = ["Americas", "Europe", "Africa", "Asia", "Oceania"]
REGION_COLORS = {
    "Americas": "#4CC9F0",
    "Europe": "#A78BFA",
    "Africa": "#FFB547",
    "Asia": "#FF5D8F",
    "Oceania": "#54E0B5",
    "Unallocated": "#93A4B8",
}


def download(url: str) -> bytes:
    request = urllib.request.Request(url, headers={"User-Agent": "AI-Adoption-Atlas/1.0"})
    with urllib.request.urlopen(request, timeout=90) as response:
        return response.read()


def read_bytes(local_path: str | None, url: str) -> bytes:
    return Path(local_path).read_bytes() if local_path else download(url)


def projected_value(row: dict[str, str], observed: str, projected: str) -> float:
    return float(row.get(observed) or row.get(projected) or 0)


def working_age_population(row: dict[str, str]) -> int:
    total = projected_value(row, "Total", "Total (Projected)")
    under_15 = projected_value(row, "Under-15s", "Under-15s (Projected)")
    over_64 = projected_value(row, "Ages 65+", "Ages 65+ (Projected)")
    return round(total - under_15 - over_64)


def rate(value: str) -> float:
    return float(value.strip().rstrip("%"))


def largest_remainder(values: list[float], target: int) -> list[int]:
    floors = [math.floor(value) for value in values]
    remaining = target - sum(floors)
    ranked = sorted(
        range(len(values)),
        key=lambda index: values[index] - floors[index],
        reverse=True,
    )
    for index in ranked[:remaining]:
        floors[index] += 1
    return floors


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--microsoft", help="Local Microsoft CSV snapshot")
    parser.add_argument("--owid", help="Local OWID age-group CSV snapshot")
    parser.add_argument("--natural-earth", help="Local Natural Earth GeoJSON")
    parser.add_argument(
        "--output",
        default=str(Path(__file__).parents[1] / "data" / "adoption.json"),
    )
    parser.add_argument(
        "--map-output",
        default=str(Path(__file__).parents[1] / "data" / "world-110m.geojson"),
    )
    args = parser.parse_args()

    microsoft_bytes = read_bytes(args.microsoft, MICROSOFT_URL)
    owid_bytes = read_bytes(args.owid, OWID_URL)
    natural_earth_bytes = read_bytes(args.natural_earth, NATURAL_EARTH_URL)

    # Microsoft's published CSV contains one Windows-1254 character in Türkiye.
    microsoft_rows = list(
        csv.DictReader(io.StringIO(microsoft_bytes.decode("cp1254")))
    )
    owid_rows = list(csv.DictReader(io.StringIO(owid_bytes.decode("utf-8"))))
    population_2024 = {
        row["Entity"]: row for row in owid_rows if row["Year"] == "2024"
    }

    geojson = json.loads(natural_earth_bytes)
    geo_by_code: dict[str, dict] = {}
    for feature in geojson["features"]:
        props = feature["properties"]
        for code_key in ("ISO_A3", "ADM0_A3"):
            code = props.get(code_key)
            if code and code != "-99":
                geo_by_code[code] = props

    countries = []
    missing = []
    for row in microsoft_rows:
        source_name = row["Economy"]
        population_name = ALIASES.get(source_name, source_name)
        population_row = population_2024.get(population_name)
        if not population_row:
            missing.append(source_name)
            continue

        code = population_row["Code"]
        geo = geo_by_code.get(code)
        fallback = COORDINATE_FALLBACKS.get(code)
        if not geo and not fallback:
            missing.append(source_name)
            continue

        continent = geo.get("CONTINENT") if geo else fallback["continent"]
        region = REGION_FOR_CONTINENT.get(continent, "Oceania")
        lon = float(geo.get("LABEL_X")) if geo else fallback["lon"]
        lat = float(geo.get("LABEL_Y")) if geo else fallback["lat"]
        working_age = working_age_population(population_row)
        h1 = rate(row["H1 2025 AI Diffusion"])
        h2 = rate(row["H2 2025 AI Diffusion"])
        q1 = rate(row["Q1 2026 AI Diffusion"])
        estimated_users = round(working_age * q1 / 100)

        countries.append(
            {
                "name": DISPLAY_NAMES.get(source_name, source_name),
                "code": code,
                "region": region,
                "lon": round(lon, 4),
                "lat": round(lat, 4),
                "workingAgePopulation": working_age,
                "rates": {"h1_2025": h1, "h2_2025": h2, "q1_2026": q1},
                "estimatedUsers": estimated_users,
            }
        )

    if missing:
        raise SystemExit(f"Unmatched economies: {', '.join(missing)}")

    world_population = working_age_population(population_2024["World"])
    world_users = round(world_population * 17.8 / 100)
    accounted_users = sum(country["estimatedUsers"] for country in countries)
    accounted_dots = round(accounted_users / 1_000_000)
    dot_allocations = largest_remainder(
        [country["estimatedUsers"] / 1_000_000 for country in countries],
        accounted_dots,
    )
    for country, dots in zip(countries, dot_allocations):
        country["dots"] = dots

    regions = []
    for region_name in REGION_ORDER:
        members = [country for country in countries if country["region"] == region_name]
        population = sum(country["workingAgePopulation"] for country in members)
        users = sum(country["estimatedUsers"] for country in members)
        regions.append(
            {
                "name": region_name,
                "color": REGION_COLORS[region_name],
                "countries": len(members),
                "estimatedUsers": users,
                "dots": sum(country["dots"] for country in members),
                "weightedRate": round(users / population * 100, 1) if population else 0,
            }
        )

    world_dots = round(world_users / 1_000_000)
    unallocated_dots = max(0, world_dots - accounted_dots)
    regions.append(
        {
            "name": "Unallocated",
            "color": REGION_COLORS["Unallocated"],
            "countries": 0,
            "estimatedUsers": max(0, world_users - accounted_users),
            "dots": unallocated_dots,
            "weightedRate": None,
        }
    )

    countries.sort(key=lambda country: country["estimatedUsers"], reverse=True)
    payload = {
        "meta": {
            "snapshot": "Q1 2026",
            "populationYear": 2024,
            "dotUnit": 1_000_000,
            "countryCount": len(countries),
            "method": (
                "Estimated users = Microsoft AI diffusion share × UN/OWID "
                "population aged 15–64. Country dots use largest-remainder rounding."
            ),
        },
        "world": {
            "workingAgePopulation": world_population,
            "estimatedUsers": world_users,
            "accountedCountryUsers": accounted_users,
            "dots": world_dots,
            "unallocatedDots": unallocated_dots,
            "series": [
                {"period": "H1 2025", "world": 15.1, "north": 22.9, "south": 13.1},
                {"period": "H2 2025", "world": 16.3, "north": 24.7, "south": 14.1},
                {"period": "Q1 2026", "world": 17.8, "north": 27.5, "south": 15.4},
            ],
        },
        "regions": regions,
        "countries": countries,
        "sources": {
            "microsoftDataset": MICROSOFT_URL,
            "microsoftReport": "https://aka.ms/DiffusionReport2026Q1",
            "technicalPaper": "https://doi.org/10.48550/arXiv.2511.02781",
            "population": "https://ourworldindata.org/grapher/population-by-age-group-with-projections",
            "geometry": "https://www.naturalearthdata.com/",
        },
    }

    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(payload, indent=2) + "\n")

    map_output = Path(args.map_output)
    map_output.parent.mkdir(parents=True, exist_ok=True)
    map_output.write_text(json.dumps(geojson, separators=(",", ":")))

    print(
        f"Built {len(countries)} economies, {world_dots} dots "
        f"({unallocated_dots} unallocated)."
    )


if __name__ == "__main__":
    main()
