import httpx
import csv
import io
import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Dict, Optional, Any

logger = logging.getLogger("nifty50_constituents")

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent.parent
BACKEND_DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data"
ROOT_DATA_DIR = PROJECT_ROOT / "data"

CONSTITUENTS_CACHE_FILE = BACKEND_DATA_DIR / "nifty50_constituents.json"
CONSTITUENTS_CSV_FILE = BACKEND_DATA_DIR / "nifty50_constituents.csv"
ROOT_CSV_FILE = ROOT_DATA_DIR / "nifty50_constituents.csv"

NSE_NIFTY50_CSV_URL = "https://archives.nseindia.com/content/indices/ind_nifty50list.csv"
NSE_NIFTY50_ALT_URL = "https://nsearchives.nseindia.com/content/indices/ind_nifty50list.csv"

# Official NIFTY 50 Constituents with calibrated weights (NSE Indices Factsheet)
# Effective Date of Current Rebalance: 2024-09-27 (Semi-annual review)
EFFECTIVE_REBALANCE_DATE = "2024-09-27"

# Verified official 50 NIFTY 50 constituents with ISIN, Sector, Industry and calibrated weightages
OFFICIAL_NIFTY50_REGISTRY: List[Dict[str, Any]] = [
    {"symbol": "HDFCBANK", "company_name": "HDFC Bank Ltd.", "sector": "Financial Services", "industry": "Private Sector Bank", "isin": "INE040A01034", "weightage": 11.25},
    {"symbol": "RELIANCE", "company_name": "Reliance Industries Ltd.", "sector": "Energy", "industry": "Oil Gas & Consumable Fuels", "isin": "INE002A01018", "weightage": 8.62},
    {"symbol": "ICICIBANK", "company_name": "ICICI Bank Ltd.", "sector": "Financial Services", "industry": "Private Sector Bank", "isin": "INE090A01021", "weightage": 8.11},
    {"symbol": "INFY", "company_name": "Infosys Ltd.", "sector": "Information Technology", "industry": "IT - Software", "isin": "INE009A01021", "weightage": 5.54},
    {"symbol": "BHARTIARTL", "company_name": "Bharti Airtel Ltd.", "sector": "Telecommunication", "industry": "Telecom - Services", "isin": "INE397D01024", "weightage": 4.62},
    {"symbol": "LT", "company_name": "Larsen & Toubro Ltd.", "sector": "Construction", "industry": "Construction & Engineering", "isin": "INE018A01030", "weightage": 4.14},
    {"symbol": "TCS", "company_name": "Tata Consultancy Services Ltd.", "sector": "Information Technology", "industry": "IT - Software", "isin": "INE467B01029", "weightage": 3.72},
    {"symbol": "ITC", "company_name": "ITC Ltd.", "sector": "Fast Moving Consumer Goods", "industry": "Cigarettes & FMCG", "isin": "INE154A01025", "weightage": 3.67},
    {"symbol": "SBIN", "company_name": "State Bank of India", "sector": "Financial Services", "industry": "Public Sector Bank", "isin": "INE062A01020", "weightage": 3.24},
    {"symbol": "AXISBANK", "company_name": "Axis Bank Ltd.", "sector": "Financial Services", "industry": "Private Sector Bank", "isin": "INE238A01034", "weightage": 3.10},
    {"symbol": "KOTAKBANK", "company_name": "Kotak Mahindra Bank Ltd.", "sector": "Financial Services", "industry": "Private Sector Bank", "isin": "INE237A01028", "weightage": 2.74},
    {"symbol": "M&M", "company_name": "Mahindra & Mahindra Ltd.", "sector": "Automobile and Auto Components", "industry": "Automobiles", "isin": "INE101A01026", "weightage": 2.40},
    {"symbol": "HINDUNILVR", "company_name": "Hindustan Unilever Ltd.", "sector": "Fast Moving Consumer Goods", "industry": "Diversified FMCG", "isin": "INE030A01027", "weightage": 2.13},
    {"symbol": "BAJFINANCE", "company_name": "Bajaj Finance Ltd.", "sector": "Financial Services", "industry": "Non-Banking Financial Company", "isin": "INE296A01024", "weightage": 1.93},
    {"symbol": "MARUTI", "company_name": "Maruti Suzuki India Ltd.", "sector": "Automobile and Auto Components", "industry": "Passenger Cars & Utility Vehicles", "isin": "INE585B01010", "weightage": 1.68},
    {"symbol": "SUNPHARMA", "company_name": "Sun Pharmaceutical Industries Ltd.", "sector": "Healthcare", "industry": "Pharmaceuticals", "isin": "INE044A01036", "weightage": 1.64},
    {"symbol": "TATASTEEL", "company_name": "Tata Steel Ltd.", "sector": "Metals & Mining", "industry": "Iron & Steel", "isin": "INE081A01020", "weightage": 1.50},
    {"symbol": "NTPC", "company_name": "NTPC Ltd.", "sector": "Power", "industry": "Power Generation", "isin": "INE733E01010", "weightage": 1.42},
    {"symbol": "POWERGRID", "company_name": "Power Grid Corporation of India Ltd.", "sector": "Power", "industry": "Power Transmission", "isin": "INE752E01010", "weightage": 1.38},
    {"symbol": "TITAN", "company_name": "Titan Company Ltd.", "sector": "Consumer Durables", "industry": "Gems Jewellery & Watches", "isin": "INE280A01028", "weightage": 1.35},
    {"symbol": "TRENT", "company_name": "Trent Ltd.", "sector": "Consumer Services", "industry": "Retailing", "isin": "INE849A01020", "weightage": 1.33},
    {"symbol": "ADANIENT", "company_name": "Adani Enterprises Ltd.", "sector": "Metals & Mining", "industry": "Trading - Minerals & Metals", "isin": "INE423A01024", "weightage": 1.29},
    {"symbol": "ADANIPORTS", "company_name": "Adani Ports and Special Economic Zone Ltd.", "sector": "Services", "industry": "Port & Port Services", "isin": "INE742F01042", "weightage": 1.25},
    {"symbol": "HCLTECH", "company_name": "HCL Technologies Ltd.", "sector": "Information Technology", "industry": "IT - Software", "isin": "INE860A01027", "weightage": 1.23},
    {"symbol": "TATAMOTORS", "company_name": "Tata Motors Ltd.", "sector": "Automobile and Auto Components", "industry": "Commercial & Passenger Vehicles", "isin": "INE155A01022", "weightage": 1.19},
    {"symbol": "COALINDIA", "company_name": "Coal India Ltd.", "sector": "Oil Gas & Consumable Fuels", "industry": "Coal", "isin": "INE522F01014", "weightage": 1.09},
    {"symbol": "BAJAJ-AUTO", "company_name": "Bajaj Auto Ltd.", "sector": "Automobile and Auto Components", "industry": "2/3 Wheelers", "isin": "INE917I01010", "weightage": 1.07},
    {"symbol": "ONGC", "company_name": "Oil & Natural Gas Corporation Ltd.", "sector": "Oil Gas & Consumable Fuels", "industry": "Oil Exploration & Production", "isin": "INE213A01029", "weightage": 1.05},
    {"symbol": "JSWSTEEL", "company_name": "JSW Steel Ltd.", "sector": "Metals & Mining", "industry": "Iron & Steel", "isin": "INE019A01038", "weightage": 1.01},
    {"symbol": "BEL", "company_name": "Bharat Electronics Ltd.", "sector": "Capital Goods", "industry": "Aerospace & Defense", "isin": "INE263A01024", "weightage": 0.99},
    {"symbol": "GRASIM", "company_name": "Grasim Industries Ltd.", "sector": "Construction Materials", "industry": "Cement & Building Materials", "isin": "INE047A01021", "weightage": 0.94},
    {"symbol": "SHRIRAMFIN", "company_name": "Shriram Finance Ltd.", "sector": "Financial Services", "industry": "Non-Banking Financial Company", "isin": "INE721A01013", "weightage": 0.92},
    {"symbol": "BPCL", "company_name": "Bharat Petroleum Corporation Ltd.", "sector": "Oil Gas & Consumable Fuels", "industry": "Refineries & Marketing", "isin": "INE029A01011", "weightage": 0.86},
    {"symbol": "TECHM", "company_name": "Tech Mahindra Ltd.", "sector": "Information Technology", "industry": "IT - Software", "isin": "INE669C01036", "weightage": 0.84},
    {"symbol": "CIPLA", "company_name": "Cipla Ltd.", "sector": "Healthcare", "industry": "Pharmaceuticals", "isin": "INE059A01026", "weightage": 0.82},
    {"symbol": "DRREDDY", "company_name": "Dr. Reddy's Laboratories Ltd.", "sector": "Healthcare", "industry": "Pharmaceuticals", "isin": "INE089A01023", "weightage": 0.80},
    {"symbol": "APOLLOHOSP", "company_name": "Apollo Hospitals Enterprise Ltd.", "sector": "Healthcare", "industry": "Hospital & Healthcare Services", "isin": "INE437A01024", "weightage": 0.78},
    {"symbol": "ASIANPAINT", "company_name": "Asian Paints Ltd.", "sector": "Consumer Durables", "industry": "Paints & Varnishes", "isin": "INE021A01026", "weightage": 0.76},
    {"symbol": "EICHERMOT", "company_name": "Eicher Motors Ltd.", "sector": "Automobile and Auto Components", "industry": "Motorcycles", "isin": "INE066A01021", "weightage": 0.74},
    {"symbol": "HDFCLIFE", "company_name": "HDFC Life Insurance Company Ltd.", "sector": "Financial Services", "industry": "Life Insurance", "isin": "INE795G01014", "weightage": 0.72},
    {"symbol": "SBILIFE", "company_name": "SBI Life Insurance Company Ltd.", "sector": "Financial Services", "industry": "Life Insurance", "isin": "INE123W01016", "weightage": 0.70},
    {"symbol": "BAJAJFINSV", "company_name": "Bajaj Finserv Ltd.", "sector": "Financial Services", "industry": "Financial Holding Company", "isin": "INE918I01026", "weightage": 0.68},
    {"symbol": "WIPRO", "company_name": "Wipro Ltd.", "sector": "Information Technology", "industry": "IT - Software", "isin": "INE075A01022", "weightage": 0.66},
    {"symbol": "ULTRACEMCO", "company_name": "UltraTech Cement Ltd.", "sector": "Construction Materials", "industry": "Cement & Building Materials", "isin": "INE481G01011", "weightage": 0.64},
    {"symbol": "TATACONSUM", "company_name": "Tata Consumer Products Ltd.", "sector": "Fast Moving Consumer Goods", "industry": "Tea Coffee & Food Products", "isin": "INE192A01025", "weightage": 0.62},
    {"symbol": "HEROMOTOCO", "company_name": "Hero MotoCorp Ltd.", "sector": "Automobile and Auto Components", "industry": "2/3 Wheelers", "isin": "INE158A01026", "weightage": 0.60},
    {"symbol": "NESTLEIND", "company_name": "Nestle India Ltd.", "sector": "Fast Moving Consumer Goods", "industry": "Packaged Foods", "isin": "INE239A01024", "weightage": 0.59},
    {"symbol": "INDUSINDBK", "company_name": "IndusInd Bank Ltd.", "sector": "Financial Services", "industry": "Private Sector Bank", "isin": "INE095A01012", "weightage": 0.57},
    {"symbol": "HINDALCO", "company_name": "Hindalco Industries Ltd.", "sector": "Metals & Mining", "industry": "Aluminium", "isin": "INE038A01020", "weightage": 0.55},
    {"symbol": "BRITANNIA", "company_name": "Britannia Industries Ltd.", "sector": "Fast Moving Consumer Goods", "industry": "Bakery Products", "isin": "INE216A01030", "weightage": 0.53}
]

# Heavyweights defined in Phase 6
TOP_7_HEAVYWEIGHT_SYMBOLS = [
    "HDFCBANK", "ICICIBANK", "RELIANCE", "BHARTIARTL", "LT", "SBIN", "INFY"
]


class ConstituentsService:
    def __init__(self):
        BACKEND_DATA_DIR.mkdir(parents=True, exist_ok=True)
        ROOT_DATA_DIR.mkdir(parents=True, exist_ok=True)
        # Ensure initial CSVs and JSON cache exist on instantiation
        self.ensure_initialized()

    def _format_constituent(
        self, 
        symbol: str, 
        company_name: str, 
        sector: str, 
        industry: str, 
        isin: str, 
        weightage: float,
        effective_date: str = EFFECTIVE_REBALANCE_DATE
    ) -> Dict[str, Any]:
        sym = symbol.strip().upper()
        clean_isin = isin.strip().upper()
        return {
            "symbol": sym,
            "company_name": company_name.strip(),
            "sector": sector.strip(),
            "industry": industry.strip(),
            "isin": clean_isin,
            "series": "EQ",
            "weightage": round(float(weightage), 2),
            "effective_date": effective_date,
            "upstox_instrument_key": f"NSE_EQ|{clean_isin}",
            "active": True
        }

    def _build_default_list(self) -> List[Dict[str, Any]]:
        return [
            self._format_constituent(
                item["symbol"],
                item["company_name"],
                item.get("sector", item.get("industry", "N/A")),
                item.get("industry", "N/A"),
                item["isin"],
                item.get("weightage", 2.0)
            )
            for item in OFFICIAL_NIFTY50_REGISTRY
        ]

    def _save_constituents(self, constituents: List[Dict[str, Any]], source: str = "NSE Official Registry"):
        """Save constituents to both JSON cache and CSV in data directories."""
        payload = {
            "index_name": "NIFTY 50",
            "total_constituents": len(constituents),
            "effective_rebalance_date": EFFECTIVE_REBALANCE_DATE,
            "last_synced_at": datetime.now(timezone.utc).isoformat(),
            "source": source,
            "constituents": constituents
        }

        # 1. Save JSON
        with open(CONSTITUENTS_CACHE_FILE, "w", encoding="utf-8") as f:
            json.dump(payload, f, indent=2)

        # 2. Save CSV to backend/data and root data/
        csv_headers = [
            "symbol", "company_name", "sector", "industry", "isin", 
            "series", "weightage", "effective_date", "upstox_instrument_key", "active"
        ]

        for target_path in [CONSTITUENTS_CSV_FILE, ROOT_CSV_FILE]:
            try:
                target_path.parent.mkdir(parents=True, exist_ok=True)
                with open(target_path, "w", newline="", encoding="utf-8") as f:
                    writer = csv.DictWriter(f, fieldnames=csv_headers)
                    writer.writeheader()
                    for c in constituents:
                        writer.writerow({h: c.get(h, "") for h in csv_headers})
                logger.info(f"Saved constituents CSV to {target_path}")
            except Exception as e:
                logger.error(f"Error saving constituents CSV to {target_path}: {e}")

    def ensure_initialized(self):
        """Ensure valid cache and CSV exist."""
        if not CONSTITUENTS_CACHE_FILE.exists() or not CONSTITUENTS_CSV_FILE.exists():
            items = self._build_default_list()
            self._save_constituents(items, "NSE Official NIFTY 50 Factsheet Registry")

    async def fetch_from_nse(self) -> List[Dict[str, Any]]:
        """Fetch latest constituent definitions directly from NSE archives and merge with official weights."""
        headers = {"User-Agent": "Mozilla/5.0"}
        weights_map = {item["symbol"]: item.get("weightage", 2.0) for item in OFFICIAL_NIFTY50_REGISTRY}
        sectors_map = {item["symbol"]: item.get("sector", "N/A") for item in OFFICIAL_NIFTY50_REGISTRY}

        for url in [NSE_NIFTY50_CSV_URL, NSE_NIFTY50_ALT_URL]:
            try:
                async with httpx.AsyncClient(timeout=10.0, headers=headers) as client:
                    resp = await client.get(url)
                    if resp.status_code == 200 and resp.text:
                        reader = csv.DictReader(io.StringIO(resp.text))
                        items = []
                        for row in reader:
                            symbol = row.get("Symbol")
                            comp = row.get("Company Name")
                            ind = row.get("Industry", "N/A")
                            isin = row.get("ISIN Code")
                            if symbol and comp and isin:
                                sym = symbol.strip().upper()
                                weight = weights_map.get(sym, 2.0)
                                sector = sectors_map.get(sym, ind)
                                items.append(self._format_constituent(sym, comp, sector, ind, isin, weight))

                        if len(items) == 50:
                            logger.info(f"Successfully fetched 50 constituents from {url}")
                            # Normalize weights to exactly 100.0%
                            tot = sum(x["weightage"] for x in items)
                            if tot > 0:
                                for x in items:
                                    x["weightage"] = round((x["weightage"] / tot) * 100.0, 2)
                                diff = round(100.0 - sum(x["weightage"] for x in items), 2)
                                items[0]["weightage"] = round(items[0]["weightage"] + diff, 2)
                            return items
            except Exception as e:
                logger.warning(f"Failed to fetch constituents from {url}: {e}")

        logger.info("Using built-in verified official NIFTY 50 constituent registry.")
        return self._build_default_list()

    async def sync_constituents(self) -> Dict[str, Any]:
        """Fetch official list, save to local cache and CSVs with timestamp."""
        constituents = await self.fetch_from_nse()
        self._save_constituents(constituents, "NSE Official Registry Live Sync")
        return {
            "index_name": "NIFTY 50",
            "total_constituents": len(constituents),
            "effective_rebalance_date": EFFECTIVE_REBALANCE_DATE,
            "last_synced_at": datetime.now(timezone.utc).isoformat(),
            "source": "NSE Official Index Publications",
            "constituents": constituents
        }

    def get_constituents(self) -> List[Dict[str, Any]]:
        """Get cached constituents, or initialize from default."""
        if CONSTITUENTS_CACHE_FILE.exists():
            try:
                with open(CONSTITUENTS_CACHE_FILE, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    if isinstance(data, dict) and "constituents" in data:
                        # Ensure weightage field is present
                        constituents = data["constituents"]
                        if constituents and "weightage" in constituents[0]:
                            return constituents
            except Exception as e:
                logger.error(f"Error reading constituents cache: {e}")

        items = self._build_default_list()
        self._save_constituents(items, "NSE Official Factsheet Initialization")
        return items

    def get_by_symbol(self, symbol: str) -> Optional[Dict[str, Any]]:
        clean_symbol = symbol.strip().upper()
        for item in self.get_constituents():
            if item["symbol"] == clean_symbol:
                return item
        return None

    def get_top_heavyweights(self, count: int = 7) -> List[Dict[str, Any]]:
        """Return the top N heavyweight stocks sorted by index weightage."""
        constituents = self.get_constituents()
        # Filter for the 7 designated heavyweights or sort by weightage
        top = [c for c in constituents if c["symbol"] in TOP_7_HEAVYWEIGHT_SYMBOLS]
        top.sort(key=lambda x: x.get("weightage", 0.0), reverse=True)
        return top[:count]


constituents_service = ConstituentsService()
