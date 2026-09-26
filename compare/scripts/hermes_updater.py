#!/usr/bin/env python3
"""
BandingHidup — Hermes Agent Data Scanner & Table Updater
Author: Hermes Agent Integration
Description: CLI script for Hermes to push normalized statistical or scraped
price benchmarks into BandingHidup (Supabase).
"""

import argparse
import json
import os
import sys
import urllib.request
import urllib.parse

DEFAULT_BASE_URL = os.environ.get("BANDINGHIDUP_API_URL", "https://compare.t-agung.id")
SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "")
ANON_KEY = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY", "")
SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

def get_city_id(city_name: str) -> str:
    """Lookup city UUID from Supabase by city name (case-insensitive)"""
    encoded_name = urllib.parse.quote(city_name)
    req_url = f"{SUPABASE_URL}/rest/v1/cities?name=ilike.{encoded_name}&select=id,name,country_id"
    req = urllib.request.Request(req_url, headers={
        "apikey": ANON_KEY,
        "Authorization": f"Bearer {ANON_KEY}"
    })

    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode())
            if not data:
                # Fallback: list all cities
                req_all = urllib.request.Request(f"{SUPABASE_URL}/rest/v1/cities?select=id,name", headers={"apikey": ANON_KEY})
                with urllib.request.urlopen(req_all) as resp_all:
                    all_cities = json.loads(resp_all.read().decode())
                    names = [c["name"] for c in all_cities]
                raise ValueError(f"City '{city_name}' not found. Available cities: {', '.join(names[:10])}...")
            return data[0]["id"]
    except Exception as e:
        print(f"❌ Failed to lookup city '{city_name}': {e}", file=sys.stderr)
        sys.exit(1)

def submit_proposal(city_id: str, category: str, price_major: float, currency: str, source_url: str, rationale: str, base_url: str):
    """Submit proposal to /api/proposals staging table"""
    multiplier = 100 if currency in ("EUR", "USD") else 1
    minor_units = int(round(price_major * multiplier))

    payload = {
        "source_code": "hermes_agent",
        "city_id": city_id,
        "category_code": category,
        "proposed_value_minor_units": minor_units,
        "currency_code": currency,
        "confidence_score": 0.88,
        "source_url": source_url,
        "rationale": rationale,
    }

    req_url = f"{base_url}/api/proposals"
    req = urllib.request.Request(
        req_url,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "x-service-role-key": SERVICE_KEY,
        },
        method="POST"
    )

    try:
        with urllib.request.urlopen(req) as resp:
            res_data = json.loads(resp.read().decode())
            print("✅ Hermes proposal submitted successfully!")
            print(json.dumps(res_data, indent=2))
    except urllib.error.HTTPError as e:
        err_msg = e.read().decode()
        print(f"❌ Proposal failed ({e.code}): {err_msg}", file=sys.stderr)
        sys.exit(1)

def submit_direct_correction(city_id: str, category: str, price_major: float, currency: str, rationale: str, base_url: str):
    """Directly update live benchmark via /api/benchmarks/correction"""
    payload = {
        "city_id": city_id,
        "category_code": category,
        "corrected_value_major": price_major,
        "currency_code": currency,
        "user_identifier": "Hermes Autonomous Agent",
        "note": rationale,
    }

    req_url = f"{base_url}/api/benchmarks/correction"
    req = urllib.request.Request(
        req_url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST"
    )

    try:
        with urllib.request.urlopen(req) as resp:
            res_data = json.loads(resp.read().decode())
            print("✅ Live benchmark updated directly by Hermes!")
            print(json.dumps(res_data, indent=2))
    except urllib.error.HTTPError as e:
        err_msg = e.read().decode()
        print(f"❌ Direct update failed ({e.code}): {err_msg}", file=sys.stderr)
        sys.exit(1)

def update_income_percentile(country: str, percentile: int, gross_monthly_major: float, currency: str, source_name: str):
    """Directly upsert income percentile into Supabase income_percentiles table"""
    multiplier = 100 if currency in ("EUR", "USD") else 1
    minor_units = int(round(gross_monthly_major * multiplier))

    payload = {
        "country_code": country.upper(),
        "percentile": percentile,
        "gross_monthly_minor_units": minor_units,
        "currency_code": currency,
        "source_name": source_name,
    }

    req_url = f"{SUPABASE_URL}/rest/v1/income_percentiles"
    req = urllib.request.Request(
        req_url,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "apikey": SERVICE_KEY,
            "Authorization": f"Bearer {SERVICE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates",
        },
        method="POST"
    )

    try:
        with urllib.request.urlopen(req) as resp:
            print(f"✅ Percentile {percentile} for {country} updated: {gross_monthly_major} {currency}!")
    except urllib.error.HTTPError as e:
        err_msg = e.read().decode()
        print(f"❌ Percentile update failed ({e.code}): {err_msg}", file=sys.stderr)
        sys.exit(1)

def main():
    parser = argparse.ArgumentParser(description="Hermes Agent Table & Percentile Updater for BandingHidup")
    parser.add_argument("--city", help="City name, e.g. 'Berlin', 'Munich', 'Tokyo', 'Jakarta'")
    parser.add_argument("--category", choices=["housing", "food", "utilities", "transport", "lifestyle", "big_mac", "street_food"], help="Expense category code")
    parser.add_argument("--price", type=float, help="Price in major units (e.g. 580 for EUR rent, 7.50 for Doner, 20000 for Mie Ayam)")
    parser.add_argument("--currency", choices=["EUR", "JPY", "IDR", "USD"], help="Currency code")
    parser.add_argument("--source", default="https://hermes-scanned-source.com", help="Source URL for provenance")
    parser.add_argument("--rationale", default="Scanned and analyzed by Hermes agent", help="Reasoning rationale")
    parser.add_argument("--direct", action="store_true", help="Directly update live benchmark table instead of staging proposal")
    parser.add_argument("--api-url", default=DEFAULT_BASE_URL, help="Base URL of BandingHidup web app")

    # Percentile Mode
    parser.add_argument("--update-percentile", action="store_true", help="Update national income percentile")
    parser.add_argument("--country", choices=["DE", "JP", "ID"], help="Country code for percentile update")
    parser.add_argument("--percentile", type=int, help="Percentile value (1-99)")

    args = parser.parse_args()

    if args.update_percentile:
        if not args.country or not args.percentile or not args.price or not args.currency:
            print("❌ Error: --update-percentile requires --country, --percentile, --price, and --currency", file=sys.stderr)
            sys.exit(1)
        print(f"🤖 [Hermes Agent] Updating income percentile {args.percentile} for {args.country}...")
        update_income_percentile(args.country, args.percentile, args.price, args.currency, args.source)
        return

    if not args.city or not args.category or args.price is None or not args.currency:
        print("❌ Error: Benchmark updates require --city, --category, --price, and --currency", file=sys.stderr)
        sys.exit(1)

    print(f"🤖 [Hermes Agent] Looking up city UUID for: '{args.city}'...")
    city_id = get_city_id(args.city)
    print(f"📍 Found city ID: {city_id}")

    if args.direct:
        print(f"⚡ Applying direct benchmark update for '{args.category}' = {args.price} {args.currency}...")
        submit_direct_correction(city_id, args.category, args.price, args.currency, args.rationale, args.api_url)
    else:
        print(f"📥 Submitting staging proposal for '{args.category}' = {args.price} {args.currency}...")
        submit_proposal(city_id, args.category, args.price, args.currency, args.source, args.rationale, args.api_url)

if __name__ == "__main__":
    main()
