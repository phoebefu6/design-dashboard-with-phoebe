# Mega Campaign Live Dashboard

An interactive operational dashboard for an ecommerce Double Day mega campaign.

## What it monitors

- Daily active users and peak concurrency
- Conversion rate and supporting funnel metrics
- GMV, pacing, forecast, orders, and average order value
- Intraday performance against plan
- Customer journey from sessions to paid buyers
- Priority funnel drop-offs and checkout leakage
- Top and bottom performing categories
- Campaign, voucher, discount, and pricing performance
- Checkout, payment, search, inventory, and advertising health

## Interactions

- Filter the dashboard by country and channel.
- Switch between GMV, conversion rate, and DAU trends.
- Compare the top and bottom ten categories.
- Toggle between persistent day and night themes.
- Reload or share a filtered URL without losing filter state.

## Run locally

Open [`index.html`](./index.html) directly, or from the repository root run:

```bash
python3 -m http.server 8080
```

Then visit:

```text
http://localhost:8080/Ecommerce/mega-campaign-live-dashboard/
```

## Technology

Vanilla HTML, CSS, SVG, and JavaScript with no build step or external runtime dependencies.

All displayed values are illustrative and unaudited.
