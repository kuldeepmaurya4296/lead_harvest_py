"""
FastAPI Backend for Google Maps Lead Extractor SaaS
Serves as the API layer between the Next.js frontend and Selenium scraping engine.
"""

import traceback
import json
import logging
import queue
import threading
import re
import time
import sys
import os
import uuid
import asyncio
from datetime import datetime
from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse, FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware

import config
from lead import (
    create_driver,
    safe_load,
    _extract_text,
    _extract_city,
    _find_instagram,
    save_to_excel,
    duckduckgo_scrape,
)
from selenium.webdriver.common.by import By
from selenium.common.exceptions import NoSuchElementException

# --- App Setup -------------------------------------------------------
app = FastAPI(title="Lead Extractor API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- In-Memory Job Store ---------------------------------------------
# Stores job metadata: status, results, timestamps
jobs: dict[str, dict] = {}

# --- Helpers ---------------------------------------------------------

def format_sse(event_name: str, data: dict):
    return f"event: {event_name}\ndata: {json.dumps(data)}\n\n"


# --- API Routes ------------------------------------------------------

@app.get("/api/health")
async def health():
    return {"status": "ok", "version": "2.0.0", "timestamp": datetime.now().isoformat()}

@app.get("/api/jobs")
async def list_jobs():
    """Return a list of all past extraction jobs (most recent first)."""
    sorted_jobs = sorted(jobs.values(), key=lambda j: j.get("created_at", ""), reverse=True)
    return sorted_jobs

@app.get("/api/jobs/{job_id}")
async def get_job(job_id: str):
    """Get details about a specific job."""
    if job_id not in jobs:
        return JSONResponse(status_code=404, content={"error": "Job not found"})
    return jobs[job_id]

@app.get("/api/stream")
async def stream_scrape(request: Request, url: str, model: str = "google_maps"):
    job_id = uuid.uuid4().hex[:8]
    q: queue.Queue = queue.Queue()
    
    # Register the job
    jobs[job_id] = {
        "id": job_id,
        "url": url,
        "model": model,
        "status": "running",
        "created_at": datetime.now().isoformat(),
        "total_found": 0,
        "total_extracted": 0,
        "records": [],
    }

    def scrape_thread():
        config.HEADLESS_MODE = True
        config.MAX_RESULTS = 999999
        config.SCROLL_ROUNDS = 9999
        driver = None
        try:
            q.put(format_sse("job_id", {"job_id": job_id}))
            
            if model == "duckduckgo":
                q.put(format_sse("status", {"message": f"Searching DuckDuckGo for '{url}'...", "progress": 10}))
                results = duckduckgo_scrape(url)
                
                if not results:
                    q.put(format_sse("error", {"message": "No results found on DuckDuckGo."}))
                    jobs[job_id]["status"] = "failed"
                    return

                jobs[job_id]["total_found"] = len(results)
                q.put(format_sse("status", {"message": f"Found {len(results)} results. Streaming...", "progress": 20, "total_found": len(results)}))

                for idx, record in enumerate(results, 1):
                    q.put(format_sse("record", record))
                    jobs[job_id]["records"].append(record)
                    jobs[job_id]["total_extracted"] = idx
                    q.put(format_sse("status", {
                        "message": f"Streaming {idx}/{len(results)} leads...",
                        "progress": 20 + (idx / len(results)) * 75,
                    }))
                
                q.put(format_sse("status", {"message": "Saving to Excel...", "progress": 98}))
                save_to_excel(
                    [{k: r[k] for k in ("Name", "City", "Instagram", "Phone", "Website", "Notes", "About")} for r in results],
                    "gym_leads.xlsx",
                )
            else:
                # Default: Google Maps (Selenium)
                q.put(format_sse("status", {"message": "Initializing browser...", "progress": 5}))
                try:
                    driver = create_driver()
                except Exception as e:
                    if os.getenv("VERCEL") == "1" and not config.BROWSERLESS_TOKEN:
                        q.put(format_sse("error", {"message": "Google Maps extraction requires BROWSERLESS_TOKEN environment variable in Vercel. Please configure it or use DuckDuckGo."}))
                        jobs[job_id]["status"] = "failed"
                        return
                    raise e

                q.put(format_sse("status", {"message": "Loading search URL...", "progress": 10}))
                if not safe_load(driver, url):
                    q.put(format_sse("error", {"message": "Failed to load Google Maps URL."}))
                    jobs[job_id]["status"] = "failed"
                    return

                q.put(format_sse("status", {"message": "Scrolling and gathering listings...", "progress": 20}))

                try:
                    feed = driver.find_element(By.XPATH, '//div[@role="feed"]')
                except NoSuchElementException:
                    q.put(format_sse("error", {"message": "No business listings found."}))
                    jobs[job_id]["status"] = "failed"
                    return

                prev_count = 0
                for _ in range(1, config.SCROLL_ROUNDS + 1):
                    driver.execute_script("arguments[0].scrollTop = arguments[0].scrollHeight", feed)
                    time.sleep(config.SCROLL_PAUSE_SEC)
                    current = driver.find_elements(By.XPATH, '//a[contains(@href, "/maps/place")]')
                    q.put(format_sse("status", {
                        "message": f"Scrolling... Found {len(current)} listings.",
                        "progress": 25,
                    }))
                    if len(current) >= config.MAX_RESULTS:
                        break
                    if len(current) == prev_count:
                        break
                    prev_count = len(current)

                elements = driver.find_elements(By.XPATH, '//a[contains(@href, "/maps/place")]')
                seen, links = set(), []
                for el in elements[:config.MAX_RESULTS]:
                    try:
                        name = el.get_attribute("aria-label") or ""
                        link = el.get_attribute("href") or ""
                        if name and link and link not in seen:
                            seen.add(link)
                            links.append({"name": name.strip(), "link": link})
                    except Exception:
                        continue

                if not links:
                    q.put(format_sse("error", {"message": "No business listings found."}))
                    jobs[job_id]["status"] = "failed"
                    return

                jobs[job_id]["total_found"] = len(links)
                q.put(format_sse("status", {
                    "message": f"Found {len(links)} links. Beginning data extraction...",
                    "progress": 30,
                    "total_found": len(links),
                }))

                results = []
                for idx, entry in enumerate(links, 1):
                    try:
                        q.put(format_sse("status", {
                            "message": f"Extracting {idx}/{len(links)}: {entry['name']}",
                            "progress": 30 + (idx / len(links)) * 65,
                        }))

                        driver.get(entry["link"])
                        time.sleep(config.DETAIL_LOAD_TIMEOUT)

                        name = entry["name"]

                        address = _extract_text(driver, '//button[@data-item-id="address"]//div[contains(@class,"fontBodyMedium")]')
                        if not address:
                            address = _extract_text(driver, '//button[contains(@data-item-id,"address")]')
                        city = _extract_city(address)

                        phone = _extract_text(driver, '//button[contains(@data-item-id,"phone")]//div[contains(@class,"fontBodyMedium")]')
                        if not phone:
                            phone = _extract_text(driver, '//button[contains(@data-item-id,"phone")]')
                        if phone:
                            phone_match = re.search(r"[\d\+\-\s\(\)]{7,}", phone)
                            phone = phone_match.group().strip() if phone_match else phone

                        website = ""
                        try:
                            web_el = driver.find_element(By.XPATH, '//a[@data-item-id="authority"]')
                            website = web_el.get_attribute("href") or ""
                        except NoSuchElementException:
                            pass

                        instagram = _find_instagram(driver, website)

                        about = _extract_text(driver, '//div[contains(@class,"WeS02d")]//span')
                        if not about:
                            about = _extract_text(driver, '//div[@class="PYvSYb"]')

                        whatsapp_link = ""
                        if phone:
                            clean_phone = re.sub(r"[^\d+]", "", phone)
                            if not clean_phone.startswith("+"):
                                clean_phone = clean_phone.lstrip("0")
                                whatsapp_link = f"https://wa.me/{clean_phone}"
                            else:
                                whatsapp_link = f"https://wa.me/{clean_phone.replace('+', '')}"

                        record = {
                            "Name": name,
                            "City": city,
                            "Instagram": instagram,
                            "Phone": phone,
                            "Website": website,
                            "whatsapp_link": whatsapp_link,
                            "About": about,
                            "Address": address,
                            "Notes": "",
                        }
                        results.append(record)
                        jobs[job_id]["records"].append(record)
                        jobs[job_id]["total_extracted"] = idx
                        q.put(format_sse("record", record))
                    except Exception:
                        logging.error(f"Error extracting {entry['name']}: {traceback.format_exc()}")

                q.put(format_sse("status", {"message": "Saving to Excel...", "progress": 98}))
                save_to_excel(
                    [{k: r[k] for k in ("Name", "City", "Instagram", "Phone", "Website", "Notes", "About")} for r in results],
                    "gym_leads.xlsx",
                )

            jobs[job_id]["status"] = "completed"
            jobs[job_id]["completed_at"] = datetime.now().isoformat()
            q.put(format_sse("done", {"message": "Extraction complete!", "progress": 100, "total": len(results)}))

        except Exception as e:
            logging.error(traceback.format_exc())
            q.put(format_sse("error", {"message": str(e)}))
            jobs[job_id]["status"] = "failed"
        finally:
            if driver:
                driver.quit()
            q.put(None)

    threading.Thread(target=scrape_thread, daemon=True).start()

    async def event_generator():
        while True:
            if await request.is_disconnected():
                break
            try:
                # Use a loop with non-blocking get to be more cooperative with asyncio
                msg = q.get_nowait()
                if msg is None:
                    break
                yield msg
            except queue.Empty:
                yield ": keep-alive\n\n"
                await asyncio.sleep(1)

    return StreamingResponse(
        event_generator(), 
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
    )


# --- WhatsApp Automation ---------------------------------------------
whatsapp_driver = None

def get_whatsapp_driver():
    global whatsapp_driver
    if whatsapp_driver is None:
        from lead import create_driver
        # We don't use headless mode for WhatsApp because we need the user to scan the QR code once
        whatsapp_driver = create_driver(force_visible=True)
    return whatsapp_driver

@app.post("/api/whatsapp/send-bulk")
async def send_bulk_whatsapp(request: Request):
    if os.getenv("VERCEL") == "1":
        return JSONResponse(status_code=400, content={"error": "WhatsApp automation is not supported in Vercel. Please run locally."})
        
    data = await request.json()
    leads = data.get("leads", [])
    
    if not leads:
        return JSONResponse(status_code=400, content={"error": "No leads provided"})

    def automation_thread():
        driver = get_whatsapp_driver()
        driver.get("https://web.whatsapp.com")
        
        # Wait for account to be linked (search box appears)
        logging.info("Waiting for WhatsApp Web login...")
        wait_cycles = 0
        while wait_cycles < 60: # 60 seconds timeout for login
            try:
                # Search box selector
                driver.find_element(By.XPATH, '//div[@contenteditable="true"][@data-tab="3"]')
                break
            except:
                time.sleep(2)
                wait_cycles += 1
        
        for lead in leads:
            phone = re.sub(r"[^\d]", "", lead.get("Phone", ""))
            message = lead.get("Message", "")
            
            if not phone or not message:
                continue
                
            try:
                # Format: https://web.whatsapp.com/send?phone=...&text=...
                from urllib.parse import quote
                url = f"https://web.whatsapp.com/send?phone={phone}&text={quote(message)}"
                driver.get(url)
                
                # Wait for send button to appear (it takes a few seconds to load the chat)
                time.sleep(5)
                
                # Click the big green "Send" button
                # The send button usually has the 'send' icon or is an aria-label
                send_btn = None
                for attempt in range(10):
                    try:
                        send_btn = driver.find_element(By.XPATH, '//span[@data-icon="send"]/parent::button')
                        if not send_btn:
                            send_btn = driver.find_element(By.XPATH, '//button[@aria-label="Send"]')
                        break
                    except:
                        time.sleep(1)
                
                if send_btn is not None:
                    send_btn.click()
                    logging.info(f"Message sent to {phone}")
                    time.sleep(2) # Buffer between sends
                else:
                    logging.warning(f"Could not find send button for {phone}")
                    
            except Exception as e:
                logging.error(f"Failed to send to {phone}: {str(e)}")
        
    threading.Thread(target=automation_thread, daemon=True).start()
    return {"message": "Automation started. Please ensure you are logged into WhatsApp Web in the window that opened."}

@app.post("/api/download")
async def download_excel(request: Request):
    data = await request.json()
    records = data.get("records", [])
    if not records:
        return JSONResponse(status_code=400, content={"error": "No records to export"})
    
    import pandas as pd
    from io import BytesIO
    
    # Build dataframe only with allowed columns
    safe_records = [{k: r.get(k, "") for k in config.COLUMNS} for r in records]
    df = pd.DataFrame(safe_records, columns=config.COLUMNS)
    
    output = BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False)
    output.seek(0)
    
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename=leads_export.xlsx"}
    )
