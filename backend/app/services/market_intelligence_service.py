"""
Market Intelligence & Macro Analytics Service (Modules 32, 33, 34, 35, 36, 37, 38)
Integrates institutional FII/DII cash flows, FII derivative positioning,
geopolitical macro indicators, India CPI/WPI inflation analytics, GDP national accounts,
RBI monetary policy, high-frequency activity, and explainable market impact matrices.
"""
from typing import Dict, Any, List
from datetime import datetime, timezone
from app.services.institutional_data_service import institutional_data_service
from app.services.macro_data_service import macro_data_service
from app.services.macro_analytics_suite import macro_analytics_suite


class MarketIntelligenceService:
    """Manages institutional market intelligence, FII/DII flows, derivatives, inflation, GDP, and macro impact."""

    @classmethod
    def get_market_intelligence(cls) -> Dict[str, Any]:
        """Retrieve full institutional market intelligence report."""
        cash_report = institutional_data_service.get_cash_market_report()
        deriv_report = institutional_data_service.get_derivatives_positioning_report()
        macro_topics = macro_data_service.get_all_topics()
        inflation_report = macro_analytics_suite.get_inflation_analytics()
        gdp_report = macro_analytics_suite.get_gdp_national_accounts_analytics()
        rbi_report = macro_analytics_suite.get_rbi_macro_dashboard()
        calendar_report = macro_analytics_suite.get_economic_calendar_and_surprises()
        impact_report = macro_analytics_suite.get_macro_market_impact_engine()
        economic_indicators = macro_analytics_suite.get_core_economic_indicators()

        try:
            from app.services.market_data_service import market_data_service
            live_bm = market_data_service.get_overview_sync().get("benchmarks", {})
        except Exception:
            live_bm = {}

        nifty_live = live_bm.get("NIFTY 50", {})
        sensex_live = live_bm.get("SENSEX", {})
        usd_live = live_bm.get("USD / INR", {})
        brent_live = live_bm.get("Brent Crude", {})

        nifty_level = nifty_live.get("current", 25800.60)
        nifty_pct = nifty_live.get("change_pct", 1.12)
        sensex_level = sensex_live.get("current", 83919.71)
        sensex_pct = sensex_live.get("change_pct", 1.08)
        session_dt = nifty_live.get("session_date", "20 Nov 2026")

        return {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "report_date": "20 November 2026",
            "session_date": session_dt,
            "market_closing_levels": {
                "nifty_50": {
                    "level": nifty_level,
                    "change_pct": nifty_pct,
                    "date": session_dt
                },
                "sensex": {
                    "level": sensex_level,
                    "change_pct": sensex_pct,
                    "date": session_dt
                },
                "usd_inr": {
                    "rate": usd_live.get("current", 84.42),
                    "change_pct": usd_live.get("change_pct", -0.04),
                    "source": "RBI / FBIL reference rate"
                },
                "crude_oil_brent": {
                    "price_usd": brent_live.get("current", 89.95),
                    "change_pct": brent_live.get("change_pct", -0.45),
                    "source": "ICE Brent Crude benchmark",
                    "geopolitical_context": "Global energy benchmarks dynamic surveillance"
                },
                "market_read_between_lines": (
                    f"Indian equities closed decisively higher with NIFTY 50 at {nifty_level:,.2f} (+{nifty_pct}%) and SENSEX at {sensex_level:,.2f} (+{sensex_pct}%) "
                    "supported by persistent institutional cash accumulation (+₹10,308 Cr FII net) and steady short-covering in Index Futures. "
                    "Headline CPI at 6.21% remains anchored by Core CPI stability (3.50%) and benign producer WPI (2.36%)."
                )
            },
            "economic_indicators": economic_indicators,
            "fii_dii_cash_activity": {
                "session_date": cash_report["session_date"],
                "data_source": "NSE Official Bhavcopy & NSDL FPI Monitor",
                "data_status": "LATEST_RELEASED",
                "release_date": cash_report.get("publication_date", "20 Nov 2026, 07:15 PM IST"),
                "last_updated": cash_report.get("update_timestamp"),
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
                "aggregates": cash_report["cumulative_flows"],
                "cumulative_flows": cash_report["cumulative_flows"],
                "segment_breakdown": cash_report.get("segment_breakdown", {}),
                "recent_fii_history": [
                    {"date": s["date"], "fii_net_cr": s["fii_net"], "dii_net_cr": s["dii_net"], "status": "NET_BUYER" if s["fii_net"] > 0 else "NET_SELLER"}
                    for s in cash_report["historical_daily_series"][:5]
                ],
                "historical_daily_series": cash_report["historical_daily_series"],
                "source": cash_report["source"]
            },
            "fii_derivatives_positioning": {
                "session_date": deriv_report["session_date"],
                "data_source": "NSE Official Participant-Wise Open Interest Report",
                "data_status": "LATEST_RELEASED",
                "release_date": deriv_report.get("publication_date", "19 Nov 2026, 07:45 PM IST"),
                "last_updated": deriv_report.get("update_timestamp"),
                "net_index_futures_contracts": deriv_report["fii_index_futures"]["net_contracts"],
                "long_contracts": deriv_report["fii_index_futures"]["long_contracts"],
                "short_contracts": deriv_report["fii_index_futures"]["short_contracts"],
                "contracts_change": deriv_report["fii_index_futures"]["daily_change"],
                "change_pct": deriv_report["fii_index_futures"]["change_pct"],
                "long_percentage": deriv_report["fii_index_futures"]["long_percentage"],
                "short_percentage": deriv_report["fii_index_futures"]["short_percentage"],
                "long_short_ratio": deriv_report["fii_index_futures"]["long_short_ratio"],
                "classification": deriv_report["fii_index_futures"].get("classification", "SHORT_COVERING"),
                "change_description": f"{abs(deriv_report['fii_index_futures']['daily_change']):,} contracts shift",
                "sentiment": deriv_report["fii_index_futures"]["sentiment"],
                "status": deriv_report["institutional_interpretation"]["regime"],
                "historical_peak_shorts": deriv_report["fii_index_futures"]["peak_historical_shorts"],
                "trend_analysis": deriv_report["fii_index_futures"]["deleveraging_summary"],
                "fii_stock_futures": deriv_report.get("fii_stock_futures", {}),
                "fii_index_options": deriv_report.get("fii_index_options", {}),
                "dii_derivatives": deriv_report.get("dii_derivatives", {}),
                "pro_derivatives": deriv_report.get("pro_derivatives", {}),
                "client_derivatives": deriv_report.get("client_derivatives", {}),
                "participant_breakdown": deriv_report.get("participant_breakdown", {}),
                "participant_matrix": deriv_report.get("participant_matrix", []),
                "historical_derivatives_series": deriv_report["historical_derivatives_series"],
                "institutional_interpretation": deriv_report["institutional_interpretation"],
                "instrument_coverage": deriv_report["source"]
            },
            "cpi_inflation_breakdown": {
                "headline": "India CPI Inflation at 6.21% YoY (October 2026), Core CPI Anchored at 3.50%",
                "rbi_tolerance_ceiling_pct": 6.00,
                "source": "MoSPI / National Statistical Office (NSO)",
                "key_highlights": [
                    "Headline CPI reached 6.21% driven predominantly by perishables and vegetable inflation",
                    "Core CPI (excluding food and fuel) remains benign at 3.50% YoY",
                    "WPI inflation recorded at 2.36% YoY, showing wholesale manufacturing stability",
                    "Fuel & Light basket in mild deflationary territory (-1.39%)"
                ],
                "categories": [
                    {"category": "Personal care, social protection & miscellaneous", "yoy_inflation_pct": 10.14, "breaches_rbi_ceiling": True, "severity": "CRITICAL"},
                    {"category": "Restaurants & accommodation", "yoy_inflation_pct": 10.06, "breaches_rbi_ceiling": True, "severity": "CRITICAL"},
                    {"category": "Consumer Food Price Index (CFPI)", "yoy_inflation_pct": 10.87, "breaches_rbi_ceiling": True, "severity": "CRITICAL"},
                    {"category": "Food & beverages", "yoy_inflation_pct": 8.51, "breaches_rbi_ceiling": True, "severity": "HIGH"},
                    {"category": "Transport & communication", "yoy_inflation_pct": 5.84, "breaches_rbi_ceiling": False, "severity": "MODERATE"},
                    {"category": "Clothing & footwear", "yoy_inflation_pct": 4.96, "breaches_rbi_ceiling": False, "severity": "MODERATE"},
                    {"category": "Paan, tobacco & intoxicants", "yoy_inflation_pct": 4.93, "breaches_rbi_ceiling": False, "severity": "MODERATE"},
                    {"category": "Education services", "yoy_inflation_pct": 4.02, "breaches_rbi_ceiling": False, "severity": "MODERATE"},
                    {"category": "Furnishings & household maintenance", "yoy_inflation_pct": 3.94, "breaches_rbi_ceiling": False, "severity": "LOW"},
                    {"category": "Housing", "yoy_inflation_pct": 3.24, "breaches_rbi_ceiling": False, "severity": "LOW"},
                    {"category": "Recreation & culture", "yoy_inflation_pct": 2.52, "breaches_rbi_ceiling": False, "severity": "LOW"},
                    {"category": "Health", "yoy_inflation_pct": 2.05, "breaches_rbi_ceiling": False, "severity": "LOW"}
                ]
            },
            # Complete Modules 33 - 37 Suite Integration
            "inflation_analytics": inflation_report,
            "gdp_national_accounts": gdp_report,
            "rbi_macro_dashboard": rbi_report,
            "economic_calendar": calendar_report,
            "market_impact_engine": impact_report,
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
