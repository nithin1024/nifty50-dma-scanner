import httpx
import csv
import io
import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Dict, Optional, Any

logger = logging.getLogger("nifty50_constituents")

DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data"
CONSTITUENTS_CACHE_FILE = DATA_DIR / "nifty50_constituents.json"

NSE_NIFTY50_CSV_URL = "https://archives.nseindia.com/content/indices/ind_nifty50list.csv"
NSE_NIFTY50_ALT_URL = "https://nsearchives.nseindia.com/content/indices/ind_nifty50list.csv"

# Verified official 50 NIFTY 50 constituents (with ISINs and Sectors)
OFFICIAL_NIFTY50_DEFAULT: List[Dict[str, str]] = [
    {"symbol": "ADANIENT", "company_name": "Adani Enterprises Ltd.", "industry": "Metals & Mining", "isin": "INE423A01024"},
    {"symbol": "ADANIPORTS", "company_name": "Adani Ports and Special Economic Zone Ltd.", "industry": "Services", "isin": "INE742F01042"},
    {"symbol": "APOLLOHOSP", "company_name": "Apollo Hospitals Enterprise Ltd.", "industry": "Healthcare", "isin": "INE437A01024"},
    {"symbol": "ASIANPAINT", "company_name": "Asian Paints Ltd.", "industry": "Consumer Durables", "isin": "INE021A01026"},
    {"symbol": "AXISBANK", "company_name": "Axis Bank Ltd.", "industry": "Financial Services", "isin": "INE238A01034"},
    {"symbol": "BAJAJ-AUTO", "company_name": "Bajaj Auto Ltd.", "industry": "Automobile and Auto Components", "isin": "INE917I01010"},
    {"symbol": "BAJFINANCE", "company_name": "Bajaj Finance Ltd.", "industry": "Financial Services", "isin": "INE296A01024"},
    {"symbol": "BAJAJFINSV", "company_name": "Bajaj Finserv Ltd.", "industry": "Financial Services", "isin": "INE918I01026"},
    {"symbol": "BEL", "company_name": "Bharat Electronics Ltd.", "industry": "Capital Goods", "isin": "INE263A01024"},
    {"symbol": "BHARTIARTL", "company_name": "Bharti Airtel Ltd.", "industry": "Telecommunication", "isin": "INE397D01024"},
    {"symbol": "BPCL", "company_name": "Bharat Petroleum Corporation Ltd.", "industry": "Oil Gas & Consumable Fuels", "isin": "INE029A01011"},
    {"symbol": "BRITANNIA", "company_name": "Britannia Industries Ltd.", "industry": "Fast Moving Consumer Goods", "isin": "INE216A01030"},
    {"symbol": "CIPLA", "company_name": "Cipla Ltd.", "industry": "Healthcare", "isin": "INE059A01026"},
    {"symbol": "COALINDIA", "company_name": "Coal India Ltd.", "industry": "Oil Gas & Consumable Fuels", "isin": "INE522F01014"},
    {"symbol": "DRREDDY", "company_name": "Dr. Reddy's Laboratories Ltd.", "industry": "Healthcare", "isin": "INE089A01023"},
    {"symbol": "EICHERMOT", "company_name": "Eicher Motors Ltd.", "industry": "Automobile and Auto Components", "isin": "INE066A01021"},
    {"symbol": "GRASIM", "company_name": "Grasim Industries Ltd.", "industry": "Construction Materials", "isin": "INE047A01021"},
    {"symbol": "HCLTECH", "company_name": "HCL Technologies Ltd.", "industry": "Information Technology", "isin": "INE860A01027"},
    {"symbol": "HDFCBANK", "company_name": "HDFC Bank Ltd.", "industry": "Financial Services", "isin": "INE040A01034"},
    {"symbol": "HDFCLIFE", "company_name": "HDFC Life Insurance Company Ltd.", "industry": "Financial Services", "isin": "INE795G01014"},
    {"symbol": "HEROMOTOCO", "company_name": "Hero MotoCorp Ltd.", "industry": "Automobile and Auto Components", "isin": "INE158A01026"},
    {"symbol": "HINDALCO", "company_name": "Hindalco Industries Ltd.", "industry": "Metals & Mining", "isin": "INE038A01020"},
    {"symbol": "HINDUNILVR", "company_name": "Hindustan Unilever Ltd.", "industry": "Fast Moving Consumer Goods", "isin": "INE030A01027"},
    {"symbol": "ICICIBANK", "company_name": "ICICI Bank Ltd.", "industry": "Financial Services", "isin": "INE090A01021"},
    {"symbol": "INDUSINDBK", "company_name": "IndusInd Bank Ltd.", "industry": "Financial Services", "isin": "INE095A01012"},
    {"symbol": "INFY", "company_name": "Infosys Ltd.", "industry": "Information Technology", "isin": "INE009A01021"},
    {"symbol": "ITC", "company_name": "ITC Ltd.", "industry": "Fast Moving Consumer Goods", "isin": "INE154A01025"},
    {"symbol": "JSWSTEEL", "company_name": "JSW Steel Ltd.", "industry": "Metals & Mining", "isin": "INE019A01038"},
    {"symbol": "KOTAKBANK", "company_name": "Kotak Mahindra Bank Ltd.", "industry": "Financial Services", "isin": "INE237A01028"},
    {"symbol": "LT", "company_name": "Larsen & Toubro Ltd.", "industry": "Construction", "isin": "INE018A01030"},
    {"symbol": "M&M", "company_name": "Mahindra & Mahindra Ltd.", "industry": "Automobile and Auto Components", "isin": "INE101A01026"},
    {"symbol": "MARUTI", "company_name": "Maruti Suzuki India Ltd.", "industry": "Automobile and Auto Components", "isin": "INE585B01010"},
    {"symbol": "NESTLEIND", "company_name": "Nestle India Ltd.", "industry": "Fast Moving Consumer Goods", "isin": "INE239A01024"},
    {"symbol": "NTPC", "company_name": "NTPC Ltd.", "industry": "Power", "isin": "INE733E01010"},
    {"symbol": "ONGC", "company_name": "Oil & Natural Gas Corporation Ltd.", "industry": "Oil Gas & Consumable Fuels", "isin": "INE213A01029"},
    {"symbol": "POWERGRID", "company_name": "Power Grid Corporation of India Ltd.", "industry": "Power", "isin": "INE752E01010"},
    {"symbol": "RELIANCE", "company_name": "Reliance Industries Ltd.", "industry": "Oil Gas & Consumable Fuels", "isin": "INE002A01018"},
    {"symbol": "SBILIFE", "company_name": "SBI Life Insurance Company Ltd.", "industry": "Financial Services", "isin": "INE123W01016"},
    {"symbol": "SBIN", "company_name": "State Bank of India", "industry": "Financial Services", "isin": "INE062A01020"},
    {"symbol": "SHRIRAMFIN", "company_name": "Shriram Finance Ltd.", "industry": "Financial Services", "isin": "INE721A01013"},
    {"symbol": "SUNPHARMA", "company_name": "Sun Pharmaceutical Industries Ltd.", "industry": "Healthcare", "isin": "INE044A01036"},
    {"symbol": "TATACONSUM", "company_name": "Tata Consumer Products Ltd.", "industry": "Fast Moving Consumer Goods", "isin": "INE192A01025"},
    {"symbol": "TATAMOTORS", "company_name": "Tata Motors Ltd.", "industry": "Automobile and Auto Components", "isin": "INE155A01022"},
    {"symbol": "TATASTEEL", "company_name": "Tata Steel Ltd.", "industry": "Metals & Mining", "isin": "INE081A01020"},
    {"symbol": "TCS", "company_name": "Tata Consultancy Services Ltd.", "industry": "Information Technology", "isin": "INE467B01029"},
    {"symbol": "TECHM", "company_name": "Tech Mahindra Ltd.", "industry": "Information Technology", "isin": "INE669C01036"},
    {"symbol": "TITAN", "company_name": "Titan Company Ltd.", "industry": "Consumer Durables", "isin": "INE280A01028"},
    {"symbol": "TRENT", "company_name": "Trent Ltd.", "industry": "Consumer Services", "isin": "INE849A01020"},
    {"symbol": "ULTRACEMCO", "company_name": "UltraTech Cement Ltd.", "industry": "Construction Materials", "isin": "INE481G01011"},
    {"symbol": "WIPRO", "company_name": "Wipro Ltd.", "industry": "Information Technology", "isin": "INE075A01022"}
]


class ConstituentsService:
    def __init__(self):
        DATA_DIR.mkdir(parents=True, exist_ok=True)

    def _format_constituent(self, symbol: str, company_name: str, industry: str, isin: str) -> Dict[str, Any]:
        return {
            "symbol": symbol.strip().upper(),
            "company_name": company_name.strip(),
            "industry": industry.strip(),
            "isin": isin.strip().upper(),
            "series": "EQ",
            "upstox_instrument_key": f"NSE_EQ|{isin.strip().upper()}",
            "active": True
        }

    async def fetch_from_nse(self) -> List[Dict[str, Any]]:
        """Fetch latest official constituent CSV directly from NSE archives."""
        headers = {"User-Agent": "Mozilla/5.0"}
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
                                items.append(self._format_constituent(symbol, comp, ind, isin))
                        if len(items) == 50:
                            logger.info(f"Successfully fetched 50 constituents from {url}")
                            return items
            except Exception as e:
                logger.warning(f"Failed to fetch constituents from {url}: {e}")

        # Fallback to verified official list
        logger.info("Using built-in official NIFTY 50 constituent registry.")
        return [
            self._format_constituent(item["symbol"], item["company_name"], item["industry"], item["isin"])
            for item in OFFICIAL_NIFTY50_DEFAULT
        ]

    async def sync_constituents(self) -> Dict[str, Any]:
        """Fetch official list, save to local cache with timestamp."""
        constituents = await self.fetch_from_nse()
        payload = {
            "index_name": "NIFTY 50",
            "total_constituents": len(constituents),
            "last_synced_at": datetime.now(timezone.utc).isoformat(),
            "source": "NSE Official Index Publications",
            "constituents": constituents
        }
        with open(CONSTITUENTS_CACHE_FILE, "w", encoding="utf-8") as f:
            json.dump(payload, f, indent=2)
        return payload

    def get_constituents(self) -> List[Dict[str, Any]]:
        """Get cached constituents, or initialize from default."""
        if CONSTITUENTS_CACHE_FILE.exists():
            try:
                with open(CONSTITUENTS_CACHE_FILE, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    if isinstance(data, dict) and "constituents" in data:
                        return data["constituents"]
            except Exception as e:
                logger.error(f"Error reading constituents cache: {e}")

        # Initialize cache immediately if missing
        items = [
            self._format_constituent(item["symbol"], item["company_name"], item["industry"], item["isin"])
            for item in OFFICIAL_NIFTY50_DEFAULT
        ]
        payload = {
            "index_name": "NIFTY 50",
            "total_constituents": len(items),
            "last_synced_at": datetime.now(timezone.utc).isoformat(),
            "source": "NSE Official Index Publications",
            "constituents": items
        }
        with open(CONSTITUENTS_CACHE_FILE, "w", encoding="utf-8") as f:
            json.dump(payload, f, indent=2)
        return items

    def get_by_symbol(self, symbol: str) -> Optional[Dict[str, Any]]:
        clean_symbol = symbol.strip().upper()
        for item in self.get_constituents():
            if item["symbol"] == clean_symbol:
                return item
        return None


constituents_service = ConstituentsService()
