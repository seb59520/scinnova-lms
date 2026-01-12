#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Generate a realistic fake Big Data sales CSV (e.g., 2M rows) without loading everything into memory.

Usage:
  python generate_sales_csv.py --rows 2000000 --out sales_2M.csv --seed 42
Optional:
  python generate_sales_csv.py --rows 2000000 --out sales_2M.csv --seed 42 --gzip
"""

import argparse
import csv
import gzip
import random
from datetime import datetime, timedelta

FIELDS = [
    "order_id",
    "order_date",
    "product",
    "category",
    "country",
    "price",
    "quantity",
    "channel",
    "payment",
]


def parse_args():
    p = argparse.ArgumentParser()
    p.add_argument("--rows", type=int, default=2_000_000, help="Number of rows to generate")
    p.add_argument("--out", type=str, default="sales_2M.csv", help="Output CSV file path")
    p.add_argument("--seed", type=int, default=42, help="Random seed for reproducibility")
    p.add_argument(
        "--start-date",
        type=str,
        default="2023-01-01",
        help="Start date (YYYY-MM-DD) for order_date randomization",
    )
    p.add_argument(
        "--days-span",
        type=int,
        default=730,
        help="Number of days from start-date to spread dates across",
    )
    p.add_argument("--gzip", action="store_true", help="Write gzipped CSV (adds .gz if missing)")
    p.add_argument("--progress-every", type=int, default=100_000, help="Print progress every N rows")
    return p.parse_args()


def weighted_choice(rng: random.Random, items_with_weights):
    # items_with_weights = [("France", 0.35), ("Germany", 0.2), ...]
    r = rng.random()
    cum = 0.0
    for item, w in items_with_weights:
        cum += w
        if r <= cum:
            return item
    return items_with_weights[-1][0]


def main():
    args = parse_args()
    rng = random.Random(args.seed)

    start_date = datetime.strptime(args.start_date, "%Y-%m-%d")

    # Realistic-ish catalog
    catalog = [
        ("Smartphone", "Électronique", (199.0, 1299.0)),
        ("Laptop", "Informatique", (499.0, 2999.0)),
        ("Casque audio", "Audio", (29.0, 499.0)),
        ("TV", "Électronique", (249.0, 3999.0)),
        ("Montre connectée", "Électronique", (79.0, 899.0)),
        ("Tablette", "Informatique", (129.0, 1499.0)),
        ("Imprimante", "Informatique", (59.0, 699.0)),
        ("Enceinte", "Audio", (19.0, 799.0)),
        ("Console", "Électronique", (199.0, 699.0)),
        ("Caméra", "Électronique", (49.0, 1499.0)),
    ]

    # Weights to mimic market distribution
    countries = [
        ("France", 0.34),
        ("Allemagne", 0.18),
        ("Espagne", 0.14),
        ("Italie", 0.14),
        ("Belgique", 0.10),
        ("Pays-Bas", 0.06),
        ("Portugal", 0.04),
    ]
    channels = [("Web", 0.55), ("Mobile", 0.35), ("Magasin", 0.10)]
    payments = [("Carte", 0.72), ("Paypal", 0.18), ("Virement", 0.07), ("Apple Pay", 0.03)]

    # Optional: gzipped output
    out_path = args.out
    if args.gzip and not out_path.endswith(".gz"):
        out_path += ".gz"

    opener = gzip.open if out_path.endswith(".gz") else open

    with opener(out_path, "wt", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=FIELDS)
        writer.writeheader()

        for i in range(args.rows):
            product, category, (pmin, pmax) = rng.choice(catalog)

            # Date spread + slight seasonality (more sales in Nov/Dec)
            day_offset = rng.randint(0, args.days_span)
            dt = start_date + timedelta(days=day_offset)

            # Small seasonal multiplier
            seasonal = 1.0
            if dt.month in (11, 12):
                seasonal = 1.12
            elif dt.month in (1, 2):
                seasonal = 0.95

            country = weighted_choice(rng, countries)
            channel = weighted_choice(rng, channels)
            payment = weighted_choice(rng, payments)

            # Price with realistic rounding (ends .99 sometimes)
            base_price = rng.uniform(pmin, pmax) * seasonal
            # push a portion to .99 pricing
            if rng.random() < 0.45:
                price = int(base_price) + 0.99
            else:
                price = round(base_price, 2)

            quantity = 1 if rng.random() < 0.72 else rng.randint(2, 5)

            row = {
                "order_id": f"ORD-{i:07d}",
                "order_date": dt.strftime("%Y-%m-%d"),
                "product": product,
                "category": category,
                "country": country,
                "price": f"{price:.2f}",
                "quantity": str(quantity),
                "channel": channel,
                "payment": payment,
            }
            writer.writerow(row)

            if args.progress_every and (i + 1) % args.progress_every == 0:
                print(f"Generated {i+1:,} / {args.rows:,} rows...")

    print(f"✅ Done: {out_path} ({args.rows:,} rows)")


if __name__ == "__main__":
    main()