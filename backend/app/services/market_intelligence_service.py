"""
Market Intelligence & Macro Analytics Service
Integrates institutional FII/DII cash flows, FII derivative positioning,
geopolitical macro indicators, and India CPI inflation category breakdown.
"""
from typing import Dict, Any, List
from datetime import datetime, timezone


class MarketIntelligenceService:
    """Manages institutional market intelligence, FII/DII flows, derivatives, and inflation metrics."""

    @classmethod
    def get_market_intelligence(cls) -> Dict[str, Any]:
        """Retrieve full institutional market intelligence report."""
        return {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "report_date": "11-12 November 2026",
            "market_closing_levels": {
                "nifty_50": {
                    "level": 25255.05,
                    "change_pct": 0.84,
                    "date": "11 Nov 2026"
                },
                "sensex": {
                    "level": 81879.40,
                    "change_pct": 0.95,
                    "date": "11 Nov 2026"
                },
                "usd_inr": {
                    "rate": 93.71,
                    "source": "Mint reference"
                },
                "crude_oil_brent": {
                    "price_usd": 93.53,
                    "source": "Mint reference",
                    "geopolitical_context": "Iran-US-Israel war risk elevating crude volatility"
                },
                "market_read_between_lines": (
                    "Indian equities finished strongly above 25,250, supported by aggressive foreign cash buying "
                    "and systematic short covering. However, macro headwinds remain elevated due to Brent crude at $93.53 "
                    "amid Middle East geopolitical friction and USD/INR at 93.71."
                )
            },
            "fii_dii_cash_activity": {
                "session_date": "Wednesday, 11 November 2026",
                "fii_net_crores": 12563.0,
                "fii_sentiment": "STRONG_FOREIGN_BUYING",
                "dii_net_crores": -8435.0,
                "dii_sentiment": "DOMESTIC_INSTITUTIONAL_SELLING",
                "net_institutional_crores": 4128.0,
                "recent_fii_history": [
                    {"date": "11 Nov 2026", "fii_net_cr": 12563.0, "status": "NET_BUYER"},
                    {"date": "6 Nov 2026", "fii_net_cr": 13750.0, "status": "NET_BUYER"},
                    {"date": "5 Nov 2026", "fii_net_cr": 14975.0, "status": "NET_BUYER"}
                ],
                "source": "Moneycontrol daily institutional trading table & NSE corroborated data"
            },
            "fii_derivatives_positioning": {
                "session_date": "11 November 2026 close",
                "net_index_futures_contracts": -70413,
                "contracts_change": 20328,
                "change_description": "20,328 fewer net shorts vs 9 Nov",
                "sentiment": "NET_BEARISH_EXPOSURE_REDUCED",
                "status": "SHARP_SHORT_COVERING_RALLY",
                "historical_peak_shorts": 225000,
                "trend_analysis": (
                    "Aggressive short covering has unfolded as FII net index-futures shorts tumbled "
                    "from over 225,000 contracts to 70,413 contracts, providing massive liquidity tailwind."
                ),
                "instrument_coverage": "NSE participant-wise index futures (Nifty, Bank Nifty, and index contracts)"
            },
            "cpi_inflation_breakdown": {
                "headline": "Inflation breaches RBI's 6% ceiling, six states cross 7%, onion prices surge 116%",
                "rbi_tolerance_ceiling_pct": 6.00,
                "source": "Moneycontrol / MoSPI CPI Official Release",
                "key_highlights": [
                    "Headline CPI breached RBI's 6.0% upper tolerance threshold",
                    "Six Indian states recorded headline inflation crossing 7.0%",
                    "Essential food items under acute pressure with onion prices surging 116%",
                    "Personal care, restaurants & accommodation experiencing double-digit inflation (>10%)"
                ],
                "categories": [
                    {
                        "category": "Personal care, social protection & miscellaneous",
                        "yoy_inflation_pct": 10.14,
                        "breaches_rbi_ceiling": True,
                        "severity": "CRITICAL"
                    },
                    {
                        "category": "Restaurants & accommodation",
                        "yoy_inflation_pct": 10.06,
                        "breaches_rbi_ceiling": True,
                        "severity": "CRITICAL"
                    },
                    {
                        "category": "Food & beverages",
                        "yoy_inflation_pct": 8.51,
                        "breaches_rbi_ceiling": True,
                        "severity": "HIGH"
                    },
                    {
                        "category": "Transport",
                        "yoy_inflation_pct": 5.84,
                        "breaches_rbi_ceiling": False,
                        "severity": "MODERATE"
                    },
                    {
                        "category": "Clothing & footwear",
                        "yoy_inflation_pct": 4.96,
                        "breaches_rbi_ceiling": False,
                        "severity": "MODERATE"
                    },
                    {
                        "category": "Paan, tobacco & intoxicants",
                        "yoy_inflation_pct": 4.93,
                        "breaches_rbi_ceiling": False,
                        "severity": "MODERATE"
                    },
                    {
                        "category": "Education services",
                        "yoy_inflation_pct": 4.02,
                        "breaches_rbi_ceiling": False,
                        "severity": "MODERATE"
                    },
                    {
                        "category": "Furnishings & household maintenance",
                        "yoy_inflation_pct": 3.94,
                        "breaches_rbi_ceiling": False,
                        "severity": "LOW"
                    },
                    {
                        "category": "Information & communication",
                        "yoy_inflation_pct": 3.16,
                        "breaches_rbi_ceiling": False,
                        "severity": "LOW"
                    },
                    {
                        "category": "Housing, water, electricity & fuels",
                        "yoy_inflation_pct": 2.90,
                        "breaches_rbi_ceiling": False,
                        "severity": "LOW"
                    },
                    {
                        "category": "Recreation, sport & culture",
                        "yoy_inflation_pct": 2.52,
                        "breaches_rbi_ceiling": False,
                        "severity": "LOW"
                    },
                    {
                        "category": "Health",
                        "yoy_inflation_pct": 2.05,
                        "breaches_rbi_ceiling": False,
                        "severity": "LOW"
                    }
                ]
            },
            "macro_glossary": [
                {"term": "GDP", "definition": "Value of domestic final production", "remember_this": "Whole economy's output", "group": "National Output"},
                {"term": "GVA", "definition": "Output minus intermediate consumption", "remember_this": "Where value is created", "group": "National Output"},
                {"term": "Nominal GDP", "definition": "GDP at current prices", "remember_this": "Prices + volumes", "group": "Prices & Adjustments"},
                {"term": "Real GDP", "definition": "GDP adjusted for price changes", "remember_this": "Production volume growth", "group": "Prices & Adjustments"},
                {"term": "GDP Deflator", "definition": "Broad domestic-output price index", "remember_this": "Separates prices from volumes", "group": "Prices & Adjustments"},
                {"term": "NDP", "definition": "GDP minus consumption of fixed capital", "remember_this": "Domestic net output", "group": "National Output"},
                {"term": "GNI", "definition": "GDP plus net primary income from abroad", "remember_this": "Residents' gross income", "group": "Income Accounts"},
                {"term": "NNI", "definition": "GNI minus consumption of fixed capital", "remember_this": "National Income", "group": "Income Accounts"},
                {"term": "GDP per capita", "definition": "GDP divided by population", "remember_this": "Average output per person", "group": "Income Accounts"},
                {"term": "PFCE", "definition": "Private final consumption", "remember_this": "Consumer spending", "group": "Demand Components"},
                {"term": "GFCE", "definition": "Government final consumption", "remember_this": "Government services/current consumption", "group": "Demand Components"},
                {"term": "GFCF", "definition": "Gross fixed capital formation", "remember_this": "Investment in fixed assets", "group": "Demand Components"},
                {"term": "Net Exports", "definition": "Exports minus imports", "remember_this": "External-demand component", "group": "Demand Components"},
                {"term": "YoY", "definition": "Same period compared with previous year", "remember_this": "Annual comparison", "group": "Comparisons"},
                {"term": "QoQ", "definition": "Compared with preceding quarter", "remember_this": "Sequential comparison", "group": "Comparisons"},
                {"term": "Base Effect", "definition": "Growth influenced by comparison level", "remember_this": "Read the base", "group": "Comparisons"},
                {"term": "Potential GDP", "definition": "Estimated sustainable output", "remember_this": "Productive capacity", "group": "Economic Capacity"},
                {"term": "Output Gap", "definition": "Actual versus potential output", "remember_this": "Economic slack/pressure", "group": "Economic Capacity"},
                {"term": "World GDP", "definition": "Combined global economic output", "remember_this": "Global economic activity", "group": "Global Macro"},
                {"term": "GDP Forecast", "definition": "Expected future GDP outcome", "remember_this": "Not actual data", "group": "Projections"},
                {"term": "GDP Surprise", "definition": "Actual minus consensus expectation", "remember_this": "May shift market pricing", "group": "Projections"}
            ]
        }


market_intelligence_service = MarketIntelligenceService()
