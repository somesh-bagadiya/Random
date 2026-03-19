#!/usr/bin/env python3
"""
24 Hour Fitness Platinum price checker.

Site strategy note:
- The public club finder at https://www.24hourfitness.com/gyms/locations is JavaScript-rendered,
  so this script uses Playwright only for ZIP -> public club page lookup.
- Once a club page URL is known, the pricing page is public HTML, so the script uses Python's
  standard library (urllib + lightweight text cleanup) to fetch and parse public Platinum pricing.

This script only uses public pages, does not log in, and does not attempt to bypass CAPTCHAs or
access controls.
"""

from __future__ import annotations

import html
import random
import re
import sys
import time
from typing import Iterable
from urllib.parse import urljoin
from urllib.request import Request, urlopen

CENTER_ZIP = "94538"
SEARCH_RADIUS_MILES = 50

# Precomputed ZIP sweep centered on 94538 (Fremont, CA) covering the surrounding
# Bay Area search ring used for the pricing check.
ZIP_CODES = sorted(
    {
        "94002", "94005", "94010", "94014", "94015", "94019", "94025", "94027", "94028", "94030",
        "94037", "94043", "94044", "94061", "94062", "94063", "94065", "94066", "94070", "94080",
        "94085", "94086", "94087", "94089", "94301", "94303", "94304", "94305", "94306", "94401",
        "94402", "94403", "94404", "94501", "94502", "94506", "94507", "94510", "94513", "94514",
        "94516", "94517", "94518", "94519", "94520", "94521", "94523", "94526", "94531", "94536",
        "94537", "94538", "94539", "94541", "94542", "94544", "94545", "94546", "94547", "94549",
        "94550", "94551", "94552", "94555", "94556", "94560", "94561", "94563", "94564", "94565",
        "94566", "94568", "94577", "94578", "94579", "94580", "94582", "94583", "94586", "94587",
        "94588", "94601", "94602", "94603", "94605", "94606", "94607", "94608", "94609", "94610",
        "94611", "94612", "94613", "94618", "94619", "94621", "94702", "94703", "94704", "94705",
        "94706", "94707", "94708", "94709", "94710", "94801", "94803", "94804", "94805", "94806",
        "94901", "94903", "94904", "94920", "94941", "94947", "95002", "95008", "95014", "95020",
        "95030", "95032", "95035", "95037", "95050", "95051", "95054", "95070", "95110", "95111",
        "95112", "95113", "95116", "95117", "95118", "95119", "95120", "95121", "95122", "95123",
        "95124", "95125", "95126", "95127", "95128", "95129", "95130", "95131", "95132", "95133",
        "95134", "95135", "95136", "95138", "95139", "95140", "95148",
    }
)

FINDER_URL = "https://www.24hourfitness.com/gyms/locations"
USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/123.0.0.0 Safari/537.36"
)
HEADERS = {
    "User-Agent": USER_AGENT,
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Cache-Control": "no-cache",
    "Pragma": "no-cache",
}


def clean_text(value: str) -> str:
    return re.sub(r"\s+", " ", value or "").strip()


def money_string(value: float | None) -> str:
    return f"${value:.2f}" if value is not None else "n/a"


def short_delay(low: float = 1.0, high: float = 2.0) -> None:
    time.sleep(random.uniform(low, high))


def fetch_html(url: str) -> str:
    request = Request(url, headers=HEADERS)
    with urlopen(request, timeout=30) as response:
        return response.read().decode("utf-8", "ignore")


def inspect_site_strategy() -> str:
    """Explain why the script chooses Playwright for the finder step."""
    html_text = fetch_html(FINDER_URL)
    if "doesn't work properly without JavaScript enabled" in html_text or "Please enable it to continue" in html_text:
        return "playwright"
    return "requests"


def find_search_input(page):
    """Pick the most likely location/ZIP search input on the club finder page."""
    inputs = page.locator("input")
    count = min(inputs.count(), 25)
    best = None

    for index in range(count):
        field = inputs.nth(index)
        try:
            if not field.is_visible() or not field.is_enabled():
                continue
        except Exception:
            continue

        input_type = (field.get_attribute("type") or "text").lower()
        meta = " ".join(
            filter(
                None,
                [
                    field.get_attribute("placeholder") or "",
                    field.get_attribute("aria-label") or "",
                    field.get_attribute("name") or "",
                    field.get_attribute("id") or "",
                ],
            )
        ).lower()

        if input_type not in {"text", "search", "tel", "number", ""}:
            continue

        if any(keyword in meta for keyword in ["zip", "location", "city", "address", "search"]):
            return field

        if best is None:
            best = field

    return best


def extract_first_club_link(page) -> str | None:
    hrefs = page.eval_on_selector_all(
        "a[href*='/gyms/']",
        """
        nodes => nodes
            .map(node => node.getAttribute('href'))
            .filter(Boolean)
        """,
    )
    for href in hrefs:
        absolute = urljoin(FINDER_URL, href)
        if "/gyms/locations" in absolute:
            continue
        if re.search(r"/gyms/[^/]+/[^/]+$", absolute):
            return absolute
    return None


def resolve_club_url_for_zip(page, zip_code: str) -> str:
    """Use the public JS club finder to get the first matching public gym page for a ZIP code."""
    page.goto(FINDER_URL, wait_until="domcontentloaded", timeout=60_000)
    page.wait_for_timeout(1200)

    search_input = find_search_input(page)
    if search_input is None:
        raise RuntimeError("Could not find a visible location search input on the club finder page.")

    search_input.click(timeout=10_000)
    search_input.fill(zip_code, timeout=10_000)
    search_input.press("Enter")
    page.wait_for_timeout(2500)

    club_link = None
    deadline = time.time() + 20
    while time.time() < deadline and not club_link:
        club_link = extract_first_club_link(page)
        if not club_link:
            page.wait_for_timeout(1000)

    if not club_link:
        raise RuntimeError(f"No public club page link was found for ZIP {zip_code}.")

    return club_link


def html_to_text_blocks(page_html: str) -> list[str]:
    normalized = re.sub(r"<(br|/p|/div|/li|/section|/article|/h1|/h2|/h3|/h4|/tr)\b[^>]*>", "\n", page_html, flags=re.I)
    normalized = re.sub(r"<script\b.*?</script>", " ", normalized, flags=re.I | re.S)
    normalized = re.sub(r"<style\b.*?</style>", " ", normalized, flags=re.I | re.S)
    text = re.sub(r"<[^>]+>", " ", normalized)
    text = html.unescape(text)
    return [clean_text(line) for line in text.splitlines() if clean_text(line)]


def extract_club_name(page_html: str, blocks: list[str]) -> str:
    title_match = re.search(r"<title>(.*?)</title>", page_html, flags=re.I | re.S)
    if title_match:
        title_text = clean_text(html.unescape(title_match.group(1)))
        title_text = title_text.replace("| 24 Hour Fitness", "").replace("|24 Hour Fitness", "")
        if title_text:
            return title_text

    og_match = re.search(r'<meta[^>]+property=["\']og:title["\'][^>]+content=["\'](.*?)["\']', page_html, flags=re.I | re.S)
    if og_match:
        og_text = clean_text(html.unescape(og_match.group(1)))
        og_text = og_text.replace("| 24 Hour Fitness", "").replace("|24 Hour Fitness", "")
        if og_text:
            return og_text

    for block in blocks[:20]:
        if "24 hour fitness" not in block.lower():
            return block

    return "Unknown club"


def collect_candidate_windows(blocks: list[str]) -> list[str]:
    windows: list[str] = []
    seen = set()
    for index in range(len(blocks)):
        for size in range(1, 6):
            chunk = clean_text(" ".join(blocks[index : index + size]))
            if not chunk:
                continue
            lower = chunk.lower()
            if "platinum" not in lower:
                continue
            if "per month" not in lower and "/month" not in lower:
                continue
            if chunk in seen:
                continue
            seen.add(chunk)
            windows.append(chunk)
    return windows


def extract_annual_fee(page_text: str) -> float | None:
    platinum_specific = re.search(
        r"Platinum[^.\n]{0,120}?\$\s?(\d+(?:\.\d{2})?)\s+Annual Fee",
        page_text,
        flags=re.I,
    )
    if platinum_specific:
        return float(platinum_specific.group(1))

    generic = re.search(r"\$\s?(\d+(?:\.\d{2})?)\s+Annual Fee", page_text, flags=re.I)
    if generic:
        return float(generic.group(1))

    return None


def parse_platinum_text(plan_text: str, zip_code: str, club_name: str, source_url: str, page_text: str) -> dict | None:
    compact = clean_text(plan_text)
    if not re.search(r"\bPlatinum\b", compact, re.I):
        return None

    monthly_match = re.search(r"\$?\s*(\d+(?:\.\d{2})?)\s*(?:per month|/month)", compact, re.I)
    monthly_price = float(monthly_match.group(1)) if monthly_match else None

    initiation_fee = None
    explicit_init = re.search(r"(?:Pay\s*)?\$\s?(\d+(?:\.\d{2})?)\s+initiation fee", compact, re.I)
    if explicit_init:
        initiation_fee = float(explicit_init.group(1))
    else:
        down_match = re.search(r"\$\s?(\d+(?:\.\d{2})?)\s+DOWN", compact, re.I)
        if down_match:
            initiation_fee = float(down_match.group(1))

    promo_text = None
    promo_match = re.search(r"^(.*?)\bPlatinum\b", compact, re.I)
    if promo_match:
        candidate = clean_text(promo_match.group(1))
        promo_text = candidate or None

    annual_fee = extract_annual_fee(page_text)

    return {
        "zip_code": zip_code,
        "club_name": club_name,
        "membership_type": "Platinum",
        "monthly_price": monthly_price,
        "initiation_fee": initiation_fee,
        "annual_fee": annual_fee,
        "promo_text": promo_text,
        "source_url": source_url,
    }


def fetch_platinum_deals_for_zip(page, zip_code: str) -> tuple[list[dict], str | None]:
    try:
        club_url = resolve_club_url_for_zip(page, zip_code)
        short_delay()
        page_html = fetch_html(club_url)
    except Exception as exc:
        return [], f"{zip_code}: {exc}"

    blocks = html_to_text_blocks(page_html)
    page_text = clean_text(" ".join(blocks))
    club_name = extract_club_name(page_html, blocks)
    candidate_texts = collect_candidate_windows(blocks)

    deals: list[dict] = []
    dedupe_keys = set()
    for text in candidate_texts:
        deal = parse_platinum_text(text, zip_code, club_name, club_url, page_text)
        if not deal:
            continue
        key = (
            deal["zip_code"],
            deal["club_name"],
            deal["monthly_price"],
            deal["initiation_fee"],
            deal["annual_fee"],
            deal["promo_text"],
        )
        if key in dedupe_keys:
            continue
        dedupe_keys.add(key)
        deals.append(deal)

    if not deals:
        return [], f"{zip_code}: no Platinum pricing blocks were detected on {club_url}"

    return deals, None


def print_deal_line(deal: dict) -> None:
    extras = [
        f"initiation {money_string(deal['initiation_fee'])}" if deal["initiation_fee"] is not None else "initiation n/a",
        f"annual {money_string(deal['annual_fee'])}" if deal["annual_fee"] is not None else "annual n/a",
    ]
    if deal["promo_text"]:
        extras.append(f"promo {deal['promo_text']}")

    print(
        f"- ZIP {deal['zip_code']} | {deal['club_name']} | Platinum | "
        f"monthly {money_string(deal['monthly_price']):>8} | "
        + " | ".join(extras)
    )
    print(f"  Source: {deal['source_url']}")


def cheapest(deals: Iterable[dict]) -> dict | None:
    priced = [deal for deal in deals if deal["monthly_price"] is not None]
    return min(priced, key=lambda deal: deal["monthly_price"]) if priced else None


def main() -> int:
    try:
        strategy = inspect_site_strategy()
    except Exception as exc:
        print(f"Could not inspect the 24 Hour Fitness site strategy before scraping: {exc}", file=sys.stderr)
        return 1

    try:
        from playwright.sync_api import sync_playwright
    except Exception:
        print(
            "This script needs Playwright for the public club-finder lookup. Install it with:\n"
            "  pip install playwright\n"
            "  python -m playwright install chromium",
            file=sys.stderr,
        )
        return 1

    print("24 Hour Fitness Platinum pricing check")
    print("=" * 44)
    print(f"Center ZIP: {CENTER_ZIP}")
    print(f"Radius: {SEARCH_RADIUS_MILES} miles")
    print(f"ZIP count: {len(ZIP_CODES)}")
    if strategy == "playwright":
        print("Strategy: Playwright for ZIP -> club lookup, then urllib for public club page parsing.")
    else:
        print("Strategy: urllib only.")
    print()

    all_deals: list[dict] = []
    errors: list[str] = []

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        page = browser.new_page(user_agent=USER_AGENT, viewport={"width": 1440, "height": 1200})

        for zip_code in ZIP_CODES:
            print(f"Checking ZIP {zip_code}...")
            deals, error = fetch_platinum_deals_for_zip(page, zip_code)
            if error:
                errors.append(error)
                print(f"  Warning: {error}")
            else:
                all_deals.extend(deals)
                print(f"  Found {len(deals)} Platinum option(s).")
            short_delay(1.2, 2.5)

        browser.close()

    print("\nAll Platinum results")
    print("-" * 44)
    if all_deals:
        for deal in sorted(all_deals, key=lambda item: (item["monthly_price"] is None, item["monthly_price"] or 10**9, item["zip_code"])):
            print_deal_line(deal)
    else:
        print("No Platinum pricing results found.")

    cheapest_platinum = cheapest(all_deals)

    print("\nCheapest Platinum option")
    print("-" * 44)
    if cheapest_platinum:
        print_deal_line(cheapest_platinum)
    else:
        print("No priced Platinum options found.")

    if errors:
        print("\nWarnings")
        print("-" * 44)
        for message in errors:
            print(f"- {message}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())

# Example search center and ZIP sweep:
#   Center ZIP: 94538
#   Radius: 50 miles
#   Sample ZIPs: 94538, 94539, 94555, 95035, 95134, 94087, 94610
#
# Example output:
#   24 Hour Fitness Platinum pricing check
#   ============================================
#   Center ZIP: 94538
#   Radius: 50 miles
#   ZIP count: 157
#   Strategy: Playwright for ZIP -> club lookup, then urllib for public club page parsing.
#
#   Checking ZIP 94538...
#     Found 1 Platinum option(s).
#
#   All Platinum results
#   --------------------------------------------
#   - ZIP 94538 | Fremont Super-Sport Gym in Fremont, CA | Platinum | monthly   $49.99 |
#     initiation $1.00 | annual $59.99 | promo $1 DOWN
#     Source: https://www.24hourfitness.com/gyms/fremont-ca/fremont-super-sport
#
#   Cheapest Platinum option
#   --------------------------------------------
#   - ZIP 94538 | Fremont Super-Sport Gym in Fremont, CA | Platinum | monthly   $49.99 |
#     initiation $1.00 | annual $59.99 | promo $1 DOWN
