#!/usr/bin/env python3
"""
# ************************************************************************
# *          Google Maps Lead Extractor - Production Ready             *
# *                                                                      *
# *  Extracts business data from Google Maps search results and stores   *
# *  them in a local Excel file + Google Spreadsheet.                    *
# ************************************************************************

Usage:
    python lead.py

You will be prompted for:
    1. Google Maps search URL  (e.g. the URL after searching "Gym in Lucknow")
    2. Google Spreadsheet URL  (the sheet must already exist and be shared
       with the service-account email)
"""

import logging
import os
import re
import sys
import time
from typing import Optional
from urllib.parse import urlparse

import pandas as pd
from selenium import webdriver
from selenium.common.exceptions import (
    NoSuchElementException,
    StaleElementReferenceException,
    TimeoutException,
    WebDriverException,
)
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

import config

# -----------------------------------------------------------------------
#  Logging
# -----------------------------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(message)s",
    datefmt="%H:%M:%S",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(config.LOG_FILE, encoding="utf-8"),
    ],
)
log = logging.getLogger(__name__)


# -----------------------------------------------------------------------
#  Browser Helpers
# -----------------------------------------------------------------------

def create_driver(force_visible=False) -> webdriver.Chrome:
    """Create and return a configured Chrome WebDriver instance."""
    opts = Options()
    
    # Check if we should use a remote browser (for Vercel/Serverless)
    if config.BROWSERLESS_TOKEN:
        log.info("Connecting to remote browser at Browserless.io...")
        driver = webdriver.Remote(
            command_executor=config.BROWSERLESS_URL,
            options=opts
        )
        return driver

    if config.HEADLESS_MODE and not force_visible:
        opts.add_argument("--headless=new")
    
    # Use a specific profile for WhatsApp if visible
    if force_visible:
        user_data = os.path.join(os.getcwd(), "whatsapp_profile")
        opts.add_argument(f"--user-data-dir={user_data}")
        
    opts.add_argument(f"--window-size={config.WINDOW_WIDTH},{config.WINDOW_HEIGHT}")
    opts.add_argument("--disable-blink-features=AutomationControlled")
    opts.add_argument("--disable-notifications")
    opts.add_argument("--lang=en-US")
    opts.add_experimental_option("excludeSwitches", ["enable-automation"])
    opts.add_experimental_option("useAutomationExtension", False)

    driver = webdriver.Chrome(options=opts)
    driver.implicitly_wait(5)
    return driver


def safe_load(driver: webdriver.Chrome, url: str) -> bool:
    """Load a URL with retries. Returns True on success."""
    for attempt in range(1, config.MAX_RETRIES + 1):
        try:
            log.info("Loading URL (attempt %d/%d)...", attempt, config.MAX_RETRIES)
            driver.get(url)
            WebDriverWait(driver, config.PAGE_LOAD_TIMEOUT).until(
                EC.presence_of_element_located((By.XPATH, '//div[@role="feed"]'))
            )
            log.info("Page loaded successfully.")
            return True
        except (TimeoutException, WebDriverException) as exc:
            log.warning("Load failed: %s", exc)
            if attempt < config.MAX_RETRIES:
                time.sleep(config.RETRY_DELAY_SEC)
    log.error("Could not load page after %d attempts.", config.MAX_RETRIES)
    return False


# -----------------------------------------------------------------------
#  Step 1 - Gather Business Links
# -----------------------------------------------------------------------

def get_business_links(driver: webdriver.Chrome) -> list[dict]:
    """
    Scroll the results panel and collect all visible listing links.
    Returns a list of dicts: [{"name": ..., "link": ...}, ...]
    """
    log.info("Scrolling results panel to reveal listings -")
    try:
        feed = driver.find_element(By.XPATH, '//div[@role="feed"]')
    except NoSuchElementException:
        log.error("Could not locate the results feed panel.")
        return []

    prev_count = 0
    for scroll_idx in range(1, config.SCROLL_ROUNDS + 1):
        driver.execute_script(
            "arguments[0].scrollTop = arguments[0].scrollHeight", feed
        )
        time.sleep(config.SCROLL_PAUSE_SEC)
        current = driver.find_elements(By.XPATH, '//a[contains(@href, "/maps/place")]')
        log.info(
            "  Scroll %d/%d - visible links: %d",
            scroll_idx, config.SCROLL_ROUNDS, len(current),
        )
        if len(current) >= config.MAX_RESULTS:
            log.info("  Reached MAX_RESULTS (%d), stopping scroll.", config.MAX_RESULTS)
            break
        if len(current) == prev_count:
            log.info("  No new results after scroll, stopping early.")
            break
        prev_count = len(current)

    elements = driver.find_elements(By.XPATH, '//a[contains(@href, "/maps/place")]')
    seen, results = set(), []
    for el in elements[: config.MAX_RESULTS]:
        try:
            name = el.get_attribute("aria-label") or ""
            link = el.get_attribute("href") or ""
            if name and link and link not in seen:
                seen.add(link)
                results.append({"name": name.strip(), "link": link})
        except StaleElementReferenceException:
            continue

    log.info("Collected %d unique business links.", len(results))
    return results


# -----------------------------------------------------------------------
#  Step 2 - Extract Detail from Each Business Page
# -----------------------------------------------------------------------

def _extract_text(driver: webdriver.Chrome, xpath: str) -> str:
    """Return text of the first element matching *xpath*, or ''."""
    try:
        return driver.find_element(By.XPATH, xpath).text.strip()
    except (NoSuchElementException, StaleElementReferenceException):
        return ""


def _extract_city(address: str) -> str:
    """Attempt to pull a city name from a Maps address string."""
    if not address:
        return ""
    # Typical address: "123 Road, Area, City, State PIN"
    parts = [p.strip() for p in address.split(",")]
    if len(parts) >= 3:
        # The second-to-last part is usually the State; the one before it is the City
        candidate = parts[-2].strip()
        # Remove pin-code if accidentally included
        candidate = re.sub(r"\d{6}", "", candidate).strip()
        return candidate
    return parts[-1] if parts else ""


def _find_instagram(driver: webdriver.Chrome, website: str) -> str:
    """Check for an Instagram link on the business page or from its website field."""
    # 1) Check if Google Maps itself lists an Instagram link
    try:
        ig_el = driver.find_element(
            By.XPATH, '//a[contains(@href, "instagram.com")]'
        )
        return ig_el.get_attribute("href") or ""
    except NoSuchElementException:
        pass

    # 2) Infer from Website field (sometimes the website IS Instagram)
    if website and "instagram.com" in website.lower():
        return website

    return ""


def extract_business_details(
    driver: webdriver.Chrome,
    entries: list[dict],
) -> list[dict]:
    """
    Visit each business link and scrape detailed info.
    Returns a list of dicts matching config.COLUMNS.
    """
    results: list[dict] = []

    for idx, entry in enumerate(entries, 1):
        log.info(
            "[%d/%d] Extracting: %s", idx, len(entries), entry["name"]
        )
        try:
            driver.get(entry["link"])
            time.sleep(config.DETAIL_LOAD_TIMEOUT)

            # --- Name ---
            name = entry["name"]

            # --- Address / City ---
            address = _extract_text(
                driver,
                '//button[@data-item-id="address"]//div[contains(@class,"fontBodyMedium")]',
            )
            if not address:
                address = _extract_text(
                    driver,
                    '//button[contains(@data-item-id,"address")]',
                )
            city = _extract_city(address)

            # --- Phone ---
            phone = _extract_text(
                driver,
                '//button[contains(@data-item-id,"phone")]//div[contains(@class,"fontBodyMedium")]',
            )
            if not phone:
                phone = _extract_text(
                    driver,
                    '//button[contains(@data-item-id,"phone")]',
                )
            # Clean phone to keep only digits and +
            if phone:
                phone_match = re.search(r"[\d\+\-\s\(\)]{7,}", phone)
                phone = phone_match.group().strip() if phone_match else phone

            # --- Website ---
            website = ""
            try:
                web_el = driver.find_element(
                    By.XPATH,
                    '//a[@data-item-id="authority"]',
                )
                website = web_el.get_attribute("href") or ""
            except NoSuchElementException:
                pass

            # --- Instagram ---
            instagram = _find_instagram(driver, website)

            # --- About / Description ---
            about = _extract_text(
                driver,
                '//div[contains(@class,"WeS02d")]//span',
            )
            if not about:
                about = _extract_text(
                    driver,
                    '//div[@class="PYvSYb"]',
                )

            results.append(
                {
                    "Name": name,
                    "City": city,
                    "Instagram": instagram,
                    "Phone": phone,
                    "Website": website,
                    "Notes": "",
                    "About": about,
                }
            )
            log.info("    - City=%s | Phone=%s | Website=%s", city, phone[:30] if phone else "-", website[:40] if website else "-")

        except Exception as exc:
            log.warning("    - Failed to extract %s: %s", entry["name"], exc)
            results.append(
                {
                    "Name": entry["name"],
                    "City": "",
                    "Instagram": "",
                    "Phone": "",
                    "Website": "",
                    "Notes": f"Error: {exc}",
                    "About": "",
                }
            )

    return results


# -----------------------------------------------------------------------
#  Step 3 - Save to Excel
# -----------------------------------------------------------------------

def save_to_excel(data: list[dict], filepath: str | None = None) -> str:
    """
    Save extracted data to an Excel file.
    Merges with existing data to avoid duplicates.
    Returns the path of the saved file.
    """
    filepath = filepath or config.EXCEL_OUTPUT_FILE
    df_new = pd.DataFrame(data, columns=config.COLUMNS)

    if os.path.exists(filepath):
        log.info("Existing Excel file found - merging & deduplicating -")
        df_old = pd.read_excel(filepath)
        df_combined = pd.concat([df_old, df_new], ignore_index=True)
        df_combined.drop_duplicates(subset=["Name", "Phone"], keep="last", inplace=True)
    else:
        df_combined = df_new

    df_combined.to_excel(filepath, index=False)
    log.info("Excel saved - %s  (%d rows)", filepath, len(df_combined))
    return filepath


# -----------------------------------------------------------------------
#  Step 4 - Update Google Spreadsheet
# -----------------------------------------------------------------------

def _extract_sheet_id(url: str) -> Optional[str]:
    """Pull the spreadsheet ID from a Google Sheets URL."""
    match = re.search(r"/spreadsheets/d/([a-zA-Z0-9_-]+)", url)
    return match.group(1) if match else None


def update_google_sheet(data: list[dict], sheet_url: str) -> bool:
    """
    Append rows to a Google Sheet, skipping duplicates.
    Requires `service_account.json` in the project folder.
    Returns True on success.
    """
    try:
        from google.oauth2 import service_account
        from googleapiclient.discovery import build
    except ImportError:
        log.error(
            "Google API libraries not installed. "
            "Run:  pip install google-api-python-client google-auth"
        )
        return False

    sheet_id = _extract_sheet_id(sheet_url)
    if not sheet_id:
        log.error("Could not parse Spreadsheet ID from URL: %s", sheet_url)
        return False

    if not os.path.exists(config.SERVICE_ACCOUNT_FILE):
        log.error(
            "Service account key not found at '%s'. "
            "Download it from Google Cloud Console and place it in the project folder.",
            config.SERVICE_ACCOUNT_FILE,
        )
        return False

    try:
        creds = service_account.Credentials.from_service_account_file(
            config.SERVICE_ACCOUNT_FILE, scopes=config.SCOPES
        )
        service = build("sheets", "v4", credentials=creds)
        sheets_api = service.spreadsheets()

        # --- Read existing data to detect duplicates ---
        result = sheets_api.values().get(
            spreadsheetId=sheet_id, range="Sheet1"
        ).execute()
        existing_rows = result.get("values", [])

        # Build a set of (Name, Phone) already in the sheet for dedup
        existing_keys: set[tuple] = set()
        if len(existing_rows) > 1:  # skip header
            for row in existing_rows[1:]:
                name = row[0] if len(row) > 0 else ""
                phone = row[3] if len(row) > 3 else ""
                existing_keys.add((name, phone))

        # Add header if sheet is empty
        if not existing_rows:
            sheets_api.values().update(
                spreadsheetId=sheet_id,
                range="Sheet1!A1",
                valueInputOption="RAW",
                body={"values": [config.COLUMNS]},
            ).execute()
            log.info("Wrote header row to Google Sheet.")

        # --- Build rows to append (skip duplicates) ---
        new_rows = []
        for record in data:
            key = (record.get("Name", ""), record.get("Phone", ""))
            if key not in existing_keys:
                new_rows.append([record.get(col, "") for col in config.COLUMNS])

        if new_rows:
            sheets_api.values().append(
                spreadsheetId=sheet_id,
                range="Sheet1!A1",
                valueInputOption="RAW",
                insertDataOption="INSERT_ROWS",
                body={"values": new_rows},
            ).execute()
            log.info("Appended %d new rows to Google Sheet.", len(new_rows))
        else:
            log.info("No new rows to append (all duplicates).")

        return True

    except Exception as exc:
        log.error("Google Sheets update failed: %s", exc)
        return False


# =======================================================================
#  DuckDuckGo Extraction
# =======================================================================

def duckduckgo_scrape(query: str, max_results: int = 50) -> list[dict]:
    """Extract leads using DuckDuckGo search (via ddgs)."""
    try:
        from ddgs import DDGS
    except ImportError:
        # Fallback for old installations
        from duckduckgo_search import DDGS
    
    log.info("Searching for: %s", query)
    
    results = []
    try:
        with DDGS() as ddgs:
            # New ddgs version 9+ uses 'query' instead of 'keywords'
            # Older versions might still use 'keywords' or positional.
            try:
                # Try new positional query first for ddgs 9+
                ddgs_gen = ddgs.text(query, region="in-en", max_results=max_results)
            except TypeError:
                # Fallback to duckduckgo-search older API
                ddgs_gen = ddgs.text(keywords=query, max_results=max_results)

            for r in ddgs_gen:
                body = r.get('body', '')
                # Simple phone number extraction from snippet
                phone = ""
                phone_match = re.search(r"(\+?\d[\d\-\s\(\)]{8,}\d)", body)
                if phone_match:
                    phone = phone_match.group().strip()
                
                # Check for Instagram in URL or body
                instagram = ""
                if "instagram.com" in r.get('href', '').lower():
                    instagram = r.get('href', '')
                elif "instagram.com" in body.lower():
                    ig_match = re.search(r"instagram\.com/[a-zA-Z0-9_\.]+", body)
                    if ig_match:
                        instagram = "https://" + ig_match.group()

                whatsapp_link = ""
                if phone:
                    clean_phone = re.sub(r"[^\d]", "", phone)
                    if clean_phone:
                        whatsapp_link = f"https://wa.me/{clean_phone}"

                results.append({
                    "Name": r.get('title', ''),
                    "City": "",
                    "Instagram": instagram,
                    "Phone": phone,
                    "Website": r.get('href', ''),
                    "Notes": "",
                    "About": body,
                    "Address": "",
                    "whatsapp_link": whatsapp_link
                })
    except Exception as e:
        log.error("DuckDuckGo search failed: %s", e)
    
    log.info("DuckDuckGo returned %d results.", len(results))
    return results


# =======================================================================
#  Main Entry Point
# =======================================================================

def main():
    print()
    print("----------------------------------------------------------------")
    print("-         Google Maps Lead Extractor  v1.0                    -")
    print("----------------------------------------------------------------")
    print()

    # --- Inputs ---
    maps_url = input("[-]  Paste Google Maps search URL: ").strip()
    if not maps_url:
        log.error("No URL provided. Exiting.")
        return

    sheet_url = input("[-]  Paste Google Spreadsheet URL (or press Enter to skip): ").strip()
    print()

    # --- Launch browser ---
    driver = create_driver()

    try:
        # Load search results page
        if not safe_load(driver, maps_url):
            log.error("Failed to load Google Maps. Aborting.")
            return

        # Step 1: Collect listing links
        links = get_business_links(driver)
        if not links:
            log.warning("No business listings found. Check your search URL.")
            return

        # Step 2: Extract details from each business page
        details = extract_business_details(driver, links)
        log.info("Extraction complete - %d businesses processed.", len(details))

        # Step 3: Save to Excel
        save_to_excel(details)

        # Step 4: Update Google Sheet (if URL provided)
        if sheet_url:
            update_google_sheet(details, sheet_url)
        else:
            log.info("Google Sheet URL not provided - skipping sheet update.")

    finally:
        driver.quit()
        log.info("Browser closed. Done -")

    print()
    print("-" * 60)
    print(f"  [SUCCESS]  Results saved to  {config.EXCEL_OUTPUT_FILE}")
    if sheet_url:
        print(f"  [SUCCESS]  Google Sheet updated")
    print("-" * 60)
    print()


if __name__ == "__main__":
    main()