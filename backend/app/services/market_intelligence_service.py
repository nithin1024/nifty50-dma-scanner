"""
Market Intelligence & Macro Analytics Service
Integrates institutional FII/DII cash flows, FII derivative positioning,
geopolitical macro indicators, and India CPI inflation category breakdown.
"""
from typing import Dict, Any, List
from datetime import datetime, timezone
from app.services.institutional_data_service import institutional_data_service
from app.services.macro_data_service import macro_data_service


class MarketIntelligenceService:
    """Manages institutional market intelligence, FII/DII flows, derivatives, and inflation metrics."""

    @classmethod
    def get_market_intelligence(cls) -> Dict[str, Any]:
        """Retrieve full institutional market intelligence report."""
        cash_report = institutional_data_service.get_cash_market_report()
        deriv_report = institutional_data_service.get_derivatives_positioning_report()
        macro_topics = macro_data_service.get_all_topics()
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
                "session_date": cash_report["session_date"],
                "fii_net_crores": cash_report["latest"]["fii_net"],
                "fii_sentiment": cash_report["latest"]["fii_status"],
                "fii_gross_buy": cash_report["latest"]["fii_gross_buy"],
                "fii_gross_sell": cash_report["latest"]["fii_gross_sell"],
                "dii_net_crores": cash_report["latest"]["dii_net"],
                "dii_sentiment": cash_report["latest"]["dii_status"],
                "dii_gross_buy": cash_report["latest"]["dii_gross_buy"],
                "dii_gross_sell": cash_report["latest"]["dii_gross_sell"],
                "net_institutional_crores": cash_report["latest"]["net_institutional_flow"],
                "previous_session": cash_report["previous_session"],
                "aggregates": cash_report["aggregates"],
                "recent_fii_history": [
                    {"date": s["date"], "fii_net_cr": s["fii_net"], "dii_net_cr": s["dii_net"], "status": "NET_BUYER" if s["fii_net"] > 0 else "NET_SELLER"}
                    for s in cash_report["historical_daily_series"][:5]
                ],
                "historical_daily_series": cash_report["historical_daily_series"],
                "source": cash_report["source"]
            },
            "fii_derivatives_positioning": {
                "session_date": deriv_report["session_date"],
                "net_index_futures_contracts": deriv_report["fii_derivatives"]["net_contracts"],
                "long_contracts": deriv_report["fii_derivatives"]["long_contracts"],
                "short_contracts": deriv_report["fii_derivatives"]["short_contracts"],
                "contracts_change": deriv_report["fii_derivatives"]["change_in_net"],
                "change_pct": deriv_report["fii_derivatives"]["change_pct"],
                "change_description": f"{abs(deriv_report['fii_derivatives']['change_in_net']):,} contracts shift",
                "sentiment": deriv_report["fii_derivatives"]["sentiment"],
                "status": deriv_report["institutional_interpretation"]["regime"],
                "historical_peak_shorts": deriv_report["fii_derivatives"]["peak_historical_shorts"],
                "trend_analysis": deriv_report["fii_derivatives"]["deleveraging_summary"],
                "dii_derivatives": deriv_report["dii_derivatives"],
                "pro_derivatives": deriv_report["pro_derivatives"],
                "client_derivatives": deriv_report["client_derivatives"],
                "historical_derivatives_series": deriv_report["historical_derivatives_series"],
                "institutional_interpretation": deriv_report["institutional_interpretation"],
                "instrument_coverage": deriv_report["contract_universe"]
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
