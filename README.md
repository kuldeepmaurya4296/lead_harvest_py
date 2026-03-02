# LeadHarvest — Google Maps Lead Extractor

A full-stack SaaS-ready web application that extracts high-quality business leads from Google Maps search results.

## 🚀 Features

- **Unlimited Extraction** — No cap on number of results. Scrapes every available listing.
- **Real-time Streaming** — Watch leads populate your dashboard instantly via Server-Sent Events.
- **Rich Data Extraction** — Name, City, Address, Phone, Website, Instagram, WhatsApp, About text.
- **Quick Actions** — One-click WhatsApp message, phone call, website visit, Instagram profile.
- **Smart Filtering** — Search/filter across all fields in real-time.
- **Column Sorting** — Click any column header to sort ascending/descending.
- **Export Options** — Download as Excel (.xlsx) or CSV directly from the UI.
- **Live Stats Dashboard** — See extraction progress, city coverage, contact data percentages.
- **Stop Anytime** — Cancel an in-progress extraction with a single click.
- **Keep-Alive Connection** — Background threading ensures the connection never drops during long extractions.

## 🏗️ Architecture

```
┌─────────────────────┐     SSE / REST     ┌──────────────────────┐
│   Next.js Frontend  │ ◄────────────────► │   FastAPI Backend    │
│   (Port 3000)       │                    │   (Port 8000)        │
│                     │                    │                      │
│  • Dashboard UI     │                    │  • /api/stream (SSE) │
│  • Stats Cards      │                    │  • /api/download     │
│  • Data Table       │                    │  • /api/jobs         │
│  • Export (CSV/XLS) │                    │  • /api/health       │
└─────────────────────┘                    └──────┬───────────────┘
                                                  │
                                                  │  Selenium (Headless)
                                                  ▼
                                           ┌──────────────┐
                                           │ Google Maps   │
                                           │ (Chrome)      │
                                           └──────────────┘
```

## 💻 How to Run

### Prerequisites
- **Python 3.10+** installed
- **Node.js 18+** installed
- **Google Chrome** browser installed

### Step 1: Install Python dependencies
```bash
cd E:\abc\aise-hi
pip install -r requirements.txt
```

### Step 2: Install Frontend dependencies
```bash
cd E:\abc\aise-hi\frontend
npm install
```

### Step 3: Run the application
**Option A — One-click launch:**
Double-click `start.bat` in the project root. It launches both servers and opens the browser.

**Option B — Manual launch (two terminals):**

Terminal 1 — Backend:
```bash
cd E:\abc\aise-hi
python -m uvicorn app:app --host 127.0.0.1 --port 8000 --reload
```

Terminal 2 — Frontend:
```bash
cd E:\abc\aise-hi\frontend
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

### Step 4: Extract leads
1. Go to [Google Maps](https://maps.google.com) in your browser
2. Search for something like **"Gyms in Lucknow"**
3. Copy the full URL from your browser address bar
4. Paste the URL into the LeadHarvest dashboard
5. Click **Extract Leads** and watch the data stream in!

## 📁 Project Structure

```
E:\abc\aise-hi\
├── app.py              # FastAPI backend (API + SSE streaming)
├── lead.py             # Core scraping engine (Selenium)
├── config.py           # Configuration settings
├── gui.py              # Desktop GUI version (Tkinter)
├── requirements.txt    # Python dependencies
├── start.bat           # One-click launcher
├── gym_leads.xlsx      # Output Excel file
├── lead_extractor.log  # Runtime logs
└── frontend/           # Next.js web application
    ├── src/
    │   ├── app/
    │   │   ├── globals.css    # Design system & styling
    │   │   ├── layout.tsx     # Root layout + SEO
    │   │   └── page.tsx       # Main dashboard page
    │   └── components/
    │       ├── Header.tsx       # Branding header
    │       ├── SearchForm.tsx   # URL input + Start/Stop
    │       ├── ProgressPanel.tsx # Live progress bar
    │       ├── StatsBar.tsx     # Extraction statistics
    │       ├── ExportBar.tsx    # Filter + Export buttons
    │       └── DataTable.tsx    # Sortable data table
    └── package.json
```

## 🔧 Configuration

Edit `config.py` to tune scraping behavior:

| Setting | Default | Description |
|---------|---------|-------------|
| `MAX_RESULTS` | 999999 | Max listings to extract (effectively unlimited) |
| `SCROLL_PAUSE_SEC` | 2.5 | Delay between scroll actions |
| `SCROLL_ROUNDS` | 9999 | Max scroll iterations |
| `PAGE_LOAD_TIMEOUT` | 15 | Page load wait (seconds) |
| `DETAIL_LOAD_TIMEOUT` | 5 | Per-business detail page wait |
| `HEADLESS_MODE` | True | Run Chrome invisibly |
"# lead_harvest_py" 
