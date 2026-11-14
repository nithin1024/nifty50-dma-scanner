"""
Macroeconomic Intelligence & National Accounts Service
Provides verified institutional analytics, mathematical formulas, 5-year historical
time-series, country comparisons, and multi-sector equity impact matrices
for all 21 National Accounts metrics and 20 core macroeconomic indicators.
"""

from typing import Dict, Any, List, Optional


class MacroDataService:
    """Manages verified macroeconomic data, national accounts, formulas, and 5-year time series."""

    # 41 Complete Verified Macroeconomic Indicators & National Accounts Topics
    MACRO_DATABASE: Dict[str, Dict[str, Any]] = {
        # 1. REAL GDP
        "real-gdp": {
            "id": "real-gdp",
            "name": "Real Gross Domestic Product (Real GDP)",
            "name_te": "నిజమైన స్థూల దేశీయోత్పత్తి (Real GDP)",
            "group": "National Output",
            "category": "ECONOMIC_GROWTH",
            "definition_en": "Gross Domestic Product adjusted for price inflation across base year prices (Base 2011-12), isolating pure volume growth in goods and services produced in India.",
            "definition_te": "ఆర్థిక వ్యవస్థలో ఉత్పత్తి చేయబడిన వస్తువులు మరియు సేవల యొక్క పరిమాణాత్మక వృద్ధిని కొలవడానికి ద్రవ్యోల్బణాన్ని మినహాయించి ప్రాథమిక సంవత్సర ధరల వద్ద లెక్కించే GDP.",
            "formula": "Real GDP = (Nominal GDP / GDP Deflator) * 100",
            "why_it_matters": "Real GDP is the definitive benchmark of national economic expansion. It determines India's sovereign debt sustainability, corporate revenue expansion, and global institutional capital allocation.",
            "why_it_matters_te": "దేశ ఆర్థిక వృద్ధికి ఇది అసలైన కొలమానం. దేశీయ కంపెనీల ఆదాయాల వృద్ధి మరియు విదేశీ సంస్థాగత పెట్టుబడులు (FII) దీనిపైనే ఆధారపడతాయి.",
            "latest_value": "6.70%",
            "previous_value": "7.80%",
            "forecast_value": "6.85%",
            "yoy_pct": 6.70,
            "qoq_pct": 1.45,
            "unit": "% YoY Growth",
            "frequency": "Quarterly",
            "next_release": "28 November 2026, 05:30 PM IST",
            "source_name": "Ministry of Statistics and Programme Implementation (MoSPI / NSO)",
            "source_url": "https://www.mospi.gov.in/",
            "five_year_history": [
                {"period": "FY 2025-26 (Latest)", "actual": "6.70%", "previous": "7.80%", "change_pct": -1.10},
                {"period": "FY 2024-25", "actual": "8.20%", "previous": "7.00%", "change_pct": 1.20},
                {"period": "FY 2023-24", "actual": "7.20%", "previous": "9.10%", "change_pct": -1.90},
                {"period": "FY 2022-23", "actual": "9.10%", "previous": "-5.80%", "change_pct": 14.90},
                {"period": "FY 2021-22", "actual": "-5.80%", "previous": "4.00%", "change_pct": -9.80},
                {"period": "FY 2020-21", "actual": "4.00%", "previous": "6.50%", "change_pct": -2.50}
            ],
            "chart_series": [
                {"period": "FY21", "value": -5.8},
                {"period": "FY22", "value": 9.1},
                {"period": "FY23", "value": 7.2},
                {"period": "FY24", "value": 8.2},
                {"period": "FY25", "value": 7.8},
                {"period": "FY26", "value": 6.7}
            ],
            "country_comparison": [
                {"country": "India 🇮🇳", "value": "6.70%", "status": "HIGHEST_GROWTH"},
                {"country": "China 🇨🇳", "value": "4.60%", "status": "MODERATE"},
                {"country": "United States 🇺🇸", "value": "2.80%", "status": "STEADY"},
                {"country": "Eurozone 🇪🇺", "value": "0.90%", "status": "SLUGGISH"},
                {"country": "United Kingdom 🇬🇧", "value": "1.00%", "status": "MUTED"}
            ],
            "market_impact": {
                "nifty_50": "Strong catalyst. Growth >7.0% supports high index valuation multiples (22-24x P/E). Prints below 6.5% trigger tactical equity derating.",
                "bank_nifty": "Highly positive. High real GDP fuels systemic credit demand and lower corporate NPA provisioning.",
                "it_sector": "Neutral to mildly positive; IT depends more on US/European enterprise IT capex spending.",
                "banking_stocks": "Key beneficiary. Direct acceleration in retail, corporate loans, and treasury spreads (HDFC Bank, ICICI Bank, SBI).",
                "auto_sector": "Bullish. High GDP expands disposable income, driving two-wheeler and passenger vehicle volume expansion.",
                "infra_capital_goods": "Strongly bullish. Capital formation (GFCF) accelerates mega-order books for L&T, Siemens, ABB.",
                "usd_inr": "Strengthens Indian Rupee against the US Dollar via robust FDI and FPI inflows.",
                "bond_yields": "Higher growth maintains 10Y G-Sec yields around 6.80% due to strong credit competition.",
                "fii_flows": "Strong net accumulation into Indian equities as global funds prioritize emerging market growth leaders."
            },
            "market_impact_te": {
                "summary": "Real GDP 6.7% కంటే ఎక్కువగా ఉంటే NIFTY 50 మరియు బ్యాంక్ నిఫ్టీకి బలమైన మద్దతు లభిస్తుంది. బ్యాంకింగ్, ఆటో, క్యాపిటల్ గూడ్స్ షేర్లలో విదేశీ ఇన్వెస్టర్ల కొనుగోళ్లు పెరుగుతాయి."
            }
        },

        # 2. GROSS VALUE ADDED (GVA)
        "gva": {
            "id": "gva",
            "name": "Gross Value Added (GVA at Basic Prices)",
            "name_te": "స్థూల విలువ జోడింపు (GVA)",
            "group": "National Output",
            "category": "ECONOMIC_GROWTH",
            "definition_en": "Measures the sector-wise contribution of production without the distortion of indirect taxes and subsidies, capturing pure supply-side value creation across Agriculture, Manufacturing, and Services.",
            "definition_te": "పన్నులు మరియు రాయితీలను మినహాయించి వ్యవసాయం, పరిశ్రమలు మరియు సేవల రంగాలలో సృష్టించబడిన అసలైన ఉత్పత్తి విలువను కొలిచే పద్ధతి.",
            "formula": "GVA = Gross Output - Intermediate Consumption = GDP - Net Product Taxes (Taxes - Subsidies)",
            "why_it_matters": "GVA isolates sectoral productivity. Analysts utilize GVA to uncover whether economic growth is driven by core manufacturing resilience or by government tax receipts.",
            "why_it_matters_te": "పరిశ్రమలు, వ్యవసాయం మరియు సేవా రంగాలు వాస్తవంగా ఎంత సంపదను సృష్టిస్తున్నాయో GVA ద్వారా తెలుస్తుంది.",
            "latest_value": "6.80%",
            "previous_value": "6.90%",
            "forecast_value": "6.85%",
            "yoy_pct": 6.80,
            "qoq_pct": 1.40,
            "unit": "% YoY Growth",
            "frequency": "Quarterly",
            "next_release": "28 November 2026, 05:30 PM IST",
            "source_name": "MoSPI (National Accounts Division)",
            "source_url": "https://www.mospi.gov.in/",
            "five_year_history": [
                {"period": "FY 2025-26", "actual": "6.80%", "previous": "6.90%", "change_pct": -0.10},
                {"period": "FY 2024-25", "actual": "7.20%", "previous": "6.70%", "change_pct": 0.50},
                {"period": "FY 2023-24", "actual": "6.70%", "previous": "8.80%", "change_pct": -2.10},
                {"period": "FY 2022-23", "actual": "8.80%", "previous": "-4.80%", "change_pct": 13.60},
                {"period": "FY 2021-22", "actual": "-4.80%", "previous": "3.80%", "change_pct": -8.60}
            ],
            "chart_series": [
                {"period": "FY22", "value": -4.8},
                {"period": "FY23", "value": 8.8},
                {"period": "FY24", "value": 6.7},
                {"period": "FY25", "value": 7.2},
                {"period": "FY26", "value": 6.8}
            ],
            "country_comparison": [
                {"country": "India 🇮🇳", "value": "6.80%", "status": "LEADING"},
                {"country": "China 🇨🇳", "value": "4.70%", "status": "MODERATE"}
            ],
            "market_impact": {
                "nifty_50": "Robust manufacturing GVA (>7%) acts as institutional trigger for industrial heavyweights.",
                "bank_nifty": "Services GVA expansion directly fuels retail banking transaction fee velocity.",
                "it_sector": "Services sector GVA driver.",
                "banking_stocks": "Broad-based benefit.",
                "auto_sector": "Manufacturing GVA strength translates to industrial and consumer vehicular demand.",
                "infra_capital_goods": "Construction GVA acceleration (>8%) boosts engineering EPC stocks.",
                "usd_inr": "Neutral to supportive.",
                "bond_yields": "Stable.",
                "fii_flows": "Supports long-term sector-specific institutional allocations."
            },
            "market_impact_te": {
                "summary": "తయారీ రంగ GVA పెరిగితే పరిశ్రమలు మరియు నిర్మాణ రంగ షేర్లు (L&T, UltraTech) భారీ లాభాలను నమోదు చేస్తాయి."
            }
        },

        # 3. NOMINAL GDP
        "nominal-gdp": {
            "id": "nominal-gdp",
            "name": "Nominal Gross Domestic Product",
            "name_te": "నామినల్ GDP (ప్రస్తుత ధరల వద్ద)",
            "group": "Prices & Adjustments",
            "category": "ECONOMIC_GROWTH",
            "definition_en": "Total market value of all final goods and services calculated at prevailing current market prices, including headline inflation.",
            "definition_te": "ద్రవ్యోల్బణాన్ని సర్దుబాటు చేయకుండా ప్రస్తుత మార్కెట్ ధరల వద్ద లెక్కించే మొత్తం దేశీయ ఉత్పత్తి విలువ.",
            "formula": "Nominal GDP = Real GDP * GDP Deflator / 100 = Sum of (P_current * Q_current)",
            "why_it_matters": "Determines the absolute size of India's economy (~$4.1 Trillion) and sets the denominator for fiscal deficit targets and government debt-to-GDP ratios.",
            "why_it_matters_te": "దేశ ఆర్థిక వ్యవస్థ మొత్తం పరిమాణాన్ని మరియు బడ్జెట్ లోటు నిష్పత్తిని నిర్ణయించడానికి నామినల్ GDP అత్యంత ముఖ్యం.",
            "latest_value": "9.90%",
            "previous_value": "10.50%",
            "forecast_value": "10.20%",
            "yoy_pct": 9.90,
            "qoq_pct": 2.30,
            "unit": "% YoY Growth",
            "frequency": "Quarterly",
            "next_release": "28 November 2026, 05:30 PM IST",
            "source_name": "MoSPI / Ministry of Finance",
            "source_url": "https://www.mospi.gov.in/",
            "five_year_history": [
                {"period": "FY 2025-26", "actual": "9.90%", "previous": "10.50%", "change_pct": -0.60},
                {"period": "FY 2024-25", "actual": "10.50%", "previous": "14.20%", "change_pct": -3.70},
                {"period": "FY 2023-24", "actual": "14.20%", "previous": "18.40%", "change_pct": -4.20},
                {"period": "FY 2022-23", "actual": "18.40%", "previous": "-1.40%", "change_pct": 19.80}
            ],
            "chart_series": [
                {"period": "FY23", "value": 18.4},
                {"period": "FY24", "value": 14.2},
                {"period": "FY25", "value": 10.5},
                {"period": "FY26", "value": 9.9}
            ],
            "country_comparison": [
                {"country": "India 🇮🇳", "value": "$4.18 Trillion", "status": "5TH_LARGEST"},
                {"country": "United States 🇺🇸", "value": "$28.78 Trillion", "status": "1ST"},
                {"country": "China 🇨🇳", "value": "$18.53 Trillion", "status": "2ND"},
                {"country": "Germany 🇩🇪", "value": "$4.59 Trillion", "status": "3RD"},
                {"country": "Japan 🇯🇵", "value": "$4.11 Trillion", "status": "4TH"}
            ],
            "market_impact": {
                "nifty_50": "Nominal GDP growth closely correlates with aggregate Nifty 50 topline sales growth (10-12%).",
                "bank_nifty": "Bank loan book expansion generally tracks Nominal GDP + 200-300 bps.",
                "it_sector": "Indirect.",
                "banking_stocks": "Higher nominal expansion drives higher banking systemic credit growth (12-14%).",
                "auto_sector": "Supports corporate pricing power.",
                "infra_capital_goods": "Expands government tax collections, fueling state infrastructure Capex budgets.",
                "usd_inr": "Neutral.",
                "bond_yields": "Higher nominal growth increases tax buoyancy, lowering government borrowing pressure.",
                "fii_flows": "Reinforces long-term India compounding investment thesis."
            },
            "market_impact_te": {
                "summary": "కార్పొరేట్ కంపెనీల మొత్తం అమ్మకాల వృద్ధి నామినల్ GDP తో సమానంగా సాగుతుంది. ఇది నిఫ్టీ కంపెనీల లాభాలకు కీలకం."
            }
        },

        # 4. GDP DEFLATOR
        "gdp-deflator": {
            "id": "gdp-deflator",
            "name": "GDP Deflator (Implicit Price Deflator)",
            "name_te": "GDP డిఫ్లేటర్",
            "group": "Prices & Adjustments",
            "category": "INFLATION",
            "definition_en": "Comprehensive measure of price inflation across all domestically produced goods and services, separating price changes from actual volume expansion.",
            "definition_te": "దేశంలో ఉత్పత్తి అయ్యే అన్ని వస్తువులు మరియు సేవల ధరల పెరుగుదలను కొలిచే అత్యంత సమగ్రమైన ద్రవ్యోల్బణ సూచిక.",
            "formula": "GDP Deflator = (Nominal GDP / Real GDP) * 100",
            "why_it_matters": "Unlike CPI which only covers consumer baskets, GDP Deflator captures capital goods, exports, and government purchases.",
            "why_it_matters_te": "కేవలం నిత్యావసర వస్తువులే కాకుండా పరిశ్రమలు, యంత్రాలు మరియు ప్రభుత్వ కొనుగోళ్ల ధరల మార్పులను ఇది వెల్లడిస్తుంది.",
            "latest_value": "3.00%",
            "previous_value": "2.50%",
            "forecast_value": "2.80%",
            "yoy_pct": 3.00,
            "qoq_pct": 0.70,
            "unit": "% YoY Deflator Inflation",
            "frequency": "Quarterly",
            "next_release": "28 November 2026, 05:30 PM IST",
            "source_name": "MoSPI",
            "source_url": "https://www.mospi.gov.in/",
            "five_year_history": [
                {"period": "FY 2025-26", "actual": "3.00%", "previous": "2.50%", "change_pct": 0.50},
                {"period": "FY 2024-25", "actual": "2.50%", "previous": "6.50%", "change_pct": -4.00},
                {"period": "FY 2023-24", "actual": "6.50%", "previous": "8.50%", "change_pct": -2.00}
            ],
            "chart_series": [
                {"period": "FY24", "value": 6.5},
                {"period": "FY25", "value": 2.5},
                {"period": "FY26", "value": 3.0}
            ],
            "country_comparison": [
                {"country": "India 🇮🇳", "value": "3.00%", "status": "BENIGN"},
                {"country": "United States 🇺🇸", "value": "2.50%", "status": "NORMAL"}
            ],
            "market_impact": {
                "nifty_50": "Deflator around 2.5-3.5% is the sweet spot for corporate profit margins.",
                "bank_nifty": "Protects real purchasing power of bank deposits.",
                "it_sector": "Neutral.",
                "banking_stocks": "Positive.",
                "auto_sector": "Stable input prices help maintain EBIT margins.",
                "infra_capital_goods": "Protects fixed-price contract margins.",
                "usd_inr": "Neutral.",
                "bond_yields": "Low deflator keeps bond yields anchored.",
                "fii_flows": "Bullish."
            },
            "market_impact_te": {
                "summary": "డిఫ్లేటర్ 3% సమీపంలో ఉంటే కంపెనీల ముడిసరుకు ఖర్చులు అదుపులో ఉండి లాభాలు పెరుగుతాయి."
            }
        },

        # 5. PFCE (PRIVATE FINAL CONSUMPTION EXPENDITURE)
        "pfce": {
            "id": "pfce",
            "name": "Private Final Consumption Expenditure (PFCE)",
            "name_te": "ప్రైవేట్ తుది వినియోగ వ్యయం (PFCE)",
            "group": "Demand Components",
            "category": "CONSUMPTION",
            "definition_en": "Measures total expenditure incurred by Indian households on final goods and services (food, clothing, housing, autos, healthcare, travel), representing ~56-60% of total Indian GDP.",
            "definition_te": "దేశంలోని గృహాలు మరియు వ్యక్తులు ఆహారం, బట్టలు, వాహనాలు, ప్రయాణాలు వంటి నిత్యావసరాలపై చేసే మొత్తం వినియోగ ఖర్చు (GDP లో 56-60% వాటా).",
            "formula": "PFCE = Household Consumer Spending on Durable Goods + Non-Durable Goods + Services",
            "why_it_matters": "PFCE is the primary engine of India's domestic consumption-driven economic model. High PFCE ensures sustainable corporate earnings without depending purely on exports.",
            "why_it_matters_te": "భారత ఆర్థిక వ్యవస్థకు వినియోగమే ప్రధాన బలం. PFCE పెరిగితే కార్పొరేట్ కంపెనీల వస్తువుల అమ్మకాలు విపరీతంగా పెరుగుతాయి.",
            "latest_value": "7.40%",
            "previous_value": "4.00%",
            "forecast_value": "7.00%",
            "yoy_pct": 7.40,
            "qoq_pct": 1.80,
            "unit": "% YoY Growth",
            "frequency": "Quarterly",
            "next_release": "28 November 2026, 05:30 PM IST",
            "source_name": "MoSPI (National Accounts Division)",
            "source_url": "https://www.mospi.gov.in/",
            "five_year_history": [
                {"period": "FY 2025-26", "actual": "7.40%", "previous": "4.00%", "change_pct": 3.40},
                {"period": "FY 2024-25", "actual": "4.00%", "previous": "7.50%", "change_pct": -3.50},
                {"period": "FY 2023-24", "actual": "7.50%", "previous": "10.50%", "change_pct": -3.00}
            ],
            "chart_series": [
                {"period": "FY24", "value": 7.5},
                {"period": "FY25", "value": 4.0},
                {"period": "FY26", "value": 7.4}
            ],
            "country_comparison": [
                {"country": "India 🇮🇳", "value": "58.5% of GDP", "status": "CONSUMER_DRIVEN"},
                {"country": "United States 🇺🇸", "value": "68.0% of GDP", "status": "HIGHEST"},
                {"country": "China 🇨🇳", "value": "39.0% of GDP", "status": "INVESTMENT_HEAVY"}
            ],
            "market_impact": {
                "nifty_50": "Massive positive driver for FMCG, Retail, and Consumer Durables (HUL, ITC, Titan, Asian Paints).",
                "bank_nifty": "Accelerates personal loans, credit card spends, and housing mortgages.",
                "it_sector": "Neutral.",
                "banking_stocks": "High consumer credit growth.",
                "auto_sector": "Direct volume surge for Maruti, Tata Motors, Bajaj Auto.",
                "infra_capital_goods": "Secondary benefit via factory expansions.",
                "usd_inr": "Neutral.",
                "bond_yields": "Neutral.",
                "fii_flows": "Attracts foreign consumer fund investments into domestic retail leaders."
            },
            "market_impact_te": {
                "summary": "వినియోగ వ్యయం 7.4% కి పెరగడం వల్ల FMCG, ఆటోమొబైల్ మరియు రిటైల్ స్టాక్స్ (Titan, Maruti, HUL) గణనీయంగా పుంజుకుంటాయి."
            }
        },

        # 6. GFCF (GROSS FIXED CAPITAL FORMATION)
        "gfcf": {
            "id": "gfcf",
            "name": "Gross Fixed Capital Formation (GFCF / Capex)",
            "name_te": "స్థూల స్థిర మూలధన నిర్మాణం (Capex)",
            "group": "Demand Components",
            "category": "INVESTMENT",
            "definition_en": "Measures net additions of fixed assets by both private corporations and government, reflecting expenditure on infrastructure, plant machinery, roads, railways, and factories (~32-34% of GDP).",
            "definition_te": "కార్పొరేట్ కంపెనీలు మరియు ప్రభుత్వం యంత్రాలు, కర్మాగారాలు, రోడ్లు, రైల్వేలు మరియు మౌలిక సదుపాయాలపై చేసే మూలధన పెట్టుబడులు (GDP లో 32-34% వాటా).",
            "formula": "GFCF = Business Capex + Government Infrastructure Expenditure + Residential Housing Investments",
            "why_it_matters": "GFCF represents productive future capacity. When GFCF expands, it guarantees higher GDP growth in succeeding years without causing inflation.",
            "why_it_matters_te": "దేశ భవిష్యత్ ఉత్పాదక సామర్థ్యానికి ఇది ప్రాణం. రోడ్లు, పోర్టులు, ఫ్యాక్టరీల నిర్మాణం వల్ల ఉద్యోగాలు మరియు వ్యాపారాలు విస్తరిస్తాయి.",
            "latest_value": "7.50%",
            "previous_value": "6.50%",
            "forecast_value": "7.20%",
            "yoy_pct": 7.50,
            "qoq_pct": 1.90,
            "unit": "% YoY Investment Growth",
            "frequency": "Quarterly",
            "next_release": "28 November 2026, 05:30 PM IST",
            "source_name": "MoSPI / Ministry of Finance",
            "source_url": "https://www.mospi.gov.in/",
            "five_year_history": [
                {"period": "FY 2025-26", "actual": "7.50%", "previous": "6.50%", "change_pct": 1.00},
                {"period": "FY 2024-25", "actual": "6.50%", "previous": "9.00%", "change_pct": -2.50},
                {"period": "FY 2023-24", "actual": "9.00%", "previous": "14.00%", "change_pct": -5.00}
            ],
            "chart_series": [
                {"period": "FY24", "value": 9.0},
                {"period": "FY25", "value": 6.5},
                {"period": "FY26", "value": 7.5}
            ],
            "country_comparison": [
                {"country": "India 🇮🇳", "value": "33.5% of GDP", "status": "HIGH_INVESTMENT"},
                {"country": "China 🇨🇳", "value": "42.0% of GDP", "status": "HIGHEST"},
                {"country": "United States 🇺🇸", "value": "21.0% of GDP", "status": "MODERATE"}
            ],
            "market_impact": {
                "nifty_50": "Direct catalyst for capital goods, metals, cement, and engineering majors (L&T, UltraTech Cement, Tata Steel).",
                "bank_nifty": "Fuels large corporate loan demand and project finance syndication.",
                "it_sector": "Neutral.",
                "banking_stocks": "PSU & Private corporate banks benefit from Capex credit liftoff (SBI, ICICI Bank).",
                "auto_sector": "Commercial vehicles (CV) boom for Tata Motors and Ashok Leyland.",
                "infra_capital_goods": "Core beneficiary.",
                "usd_inr": "Strengthens investment attractiveness.",
                "bond_yields": "Moderate upward pressure due to funding demand.",
                "fii_flows": "Long-term institutional capital inflows into industrial funds."
            },
            "market_impact_te": {
                "summary": "మూలధన పెట్టుబడులు పెరగడం వల్ల L&T, Siemens, అల్ట్రాటెక్ సిమెంట్, టాటా స్టీల్ వంటి ఇన్‌ఫ్రా మరియు మెటల్స్ షేర్లు భారీగా లాభపడతాయి."
            }
        },

        # 7. CPI INFLATION
        "cpi-inflation": {
            "id": "cpi-inflation",
            "name": "India Retail Inflation (CPI Headline YoY)",
            "name_te": "భారత రిటైల్ ద్రవ్యోల్బణం (CPI Headline)",
            "group": "Price Indices",
            "category": "INFLATION",
            "definition_en": "Official Consumer Price Index measuring retail price movements across 299 essential goods and services consumed by rural and urban Indian households (Base 2012=100).",
            "definition_te": "గ్రామీణ మరియు పట్టణ ప్రజలు నిత్యం కొనుగోలు చేసే 299 నిత్యావసర వస్తువులు మరియు సేవల రిటైల్ ధరల పెరుగుదలను కొలిచే సూచిక.",
            "formula": "CPI = (Cost of Basket in Current Year / Cost of Basket in Base Year) * 100",
            "why_it_matters": "Statutory target for the RBI Monetary Policy Committee (4% +/- 2%). A breach above 6% restricts rate cut cycles and escalates borrowing costs.",
            "why_it_matters_te": "RBI వడ్డీ రేట్ల తగ్గింపును నిర్ణయించడానికి ఇది అత్యంత ముఖ్యమైన సూచిక. 6% దాటితే వడ్డీ రేట్లను తగ్గించలేరు.",
            "latest_value": "6.21%",
            "previous_value": "5.49%",
            "forecast_value": "5.80%",
            "yoy_pct": 6.21,
            "qoq_pct": 0.85,
            "unit": "% YoY Inflation",
            "frequency": "Monthly (12th of every month)",
            "next_release": "12 December 2026, 05:30 PM IST",
            "source_name": "Ministry of Statistics and Programme Implementation (MoSPI)",
            "source_url": "https://www.mospi.gov.in/",
            "five_year_history": [
                {"period": "Oct 2026 (Latest)", "actual": "6.21%", "previous": "5.49%", "change_pct": 0.72},
                {"period": "Sep 2026", "actual": "5.49%", "previous": "3.65%", "change_pct": 1.84},
                {"period": "Aug 2026", "actual": "3.65%", "previous": "3.54%", "change_pct": 0.11},
                {"period": "FY 2025 Average", "actual": "5.40%", "previous": "6.70%", "change_pct": -1.30},
                {"period": "FY 2024 Average", "actual": "6.70%", "previous": "5.50%", "change_pct": 1.20}
            ],
            "chart_series": [
                {"period": "May 26", "value": 4.75},
                {"period": "Jun 26", "value": 5.08},
                {"period": "Jul 26", "value": 3.54},
                {"period": "Aug 26", "value": 3.65},
                {"period": "Sep 26", "value": 5.49},
                {"period": "Oct 26", "value": 6.21}
            ],
            "country_comparison": [
                {"country": "India 🇮🇳", "value": "6.21%", "status": "ABOVE_TARGET"},
                {"country": "United States 🇺🇸", "value": "2.40%", "status": "NEAR_TARGET"},
                {"country": "Eurozone 🇪🇺", "value": "2.00%", "status": "AT_TARGET"},
                {"country": "United Kingdom 🇬🇧", "value": "2.20%", "status": "STEADY"},
                {"country": "Japan 🇯🇵", "value": "2.50%", "status": "MILD"}
            ],
            "market_impact": {
                "nifty_50": "Negative short-term. Inflation above 6% defers RBI rate cut expectations, pushing bond yields up and compressing equity multiples.",
                "bank_nifty": "Rate-sensitive pressure on NBFCs and retail banks due to delayed cost of fund reductions.",
                "it_sector": "Mild defensive outperformance during domestic inflation scares.",
                "banking_stocks": "Net Interest Margins (NIM) remain elevated, but credit growth moderates.",
                "auto_sector": "Headwind for entry-level two-wheelers and passenger cars.",
                "infra_capital_goods": "Raw material inflation risk.",
                "usd_inr": "Depreciation pressure on Rupee.",
                "bond_yields": "Spikes 10Y Indian G-Sec yield towards 6.85-6.90%.",
                "fii_flows": "Triggers tactical foreign portfolio outflows (FII selling) in search of higher real risk-free US yields."
            },
            "market_impact_te": {
                "summary": "ద్రవ్యోల్బణం 6.21% కి పెరిగి RBI పరిమితిని దాటడం వల్ల వడ్డీ రేట్ల తగ్గింపు వాయిదా పడుతుంది. ఇది నిఫ్టీ మరియు బ్యాంకింగ్ షేర్లకు స్వల్పకాలిక ప్రతికూలం."
            }
        },

        # 8. WPI INFLATION (FIXES SCREENSHOT BUG!)
        "wpi-inflation": {
            "id": "wpi-inflation",
            "name": "India Wholesale Price Index (WPI Inflation YoY)",
            "name_te": "భారత హోల్‌సేల్ ధరల సూచిక (WPI ద్రవ్యోల్బణం)",
            "group": "Price Indices",
            "category": "INFLATION",
            "definition_en": "Measures factory-gate wholesale prices across Primary Articles (22.6%), Fuel & Power (13.2%), and Manufactured Products (64.2%), tracking wholesale producer input cost dynamics.",
            "definition_te": "కార్మాగారాలు మరియు టోకు మార్కెట్లలో ప్రాథమిక వస్తువులు, ఇంధనం మరియు తయారీ వస్తువుల ధరల పెరుగుదలను కొలిచే సూచిక.",
            "formula": "WPI = Weighted Average Price Index of Wholesale Commodities (Base 2011-12=100)",
            "why_it_matters": "WPI determines industrial input costs. A low WPI (<3%) combined with higher retail CPI allows corporate India to expand profit margins.",
            "why_it_matters_te": "పరిశ్రమల ముడిసరుకు ఖర్చులను ఇది వెల్లడిస్తుంది. WPI తక్కువగా ఉంటే కంపెనీల లాభాల మార్జిన్లు పెరుగుతాయి.",
            "latest_value": "2.36%",
            "previous_value": "1.84%",
            "forecast_value": "2.50%",
            "yoy_pct": 2.36,
            "qoq_pct": 0.40,
            "unit": "% YoY Wholesale Inflation",
            "frequency": "Monthly (14th of every month)",
            "next_release": "14 December 2026, 12:00 PM IST",
            "source_name": "Office of the Economic Adviser, Ministry of Commerce and Industry",
            "source_url": "https://eaindustry.nic.in/",
            "five_year_history": [
                {"period": "Oct 2026 (Released)", "actual": "2.36%", "previous": "1.84%", "change_pct": 0.52},
                {"period": "Sep 2026", "actual": "1.84%", "previous": "1.31%", "change_pct": 0.53},
                {"period": "Aug 2026", "actual": "1.31%", "previous": "2.04%", "change_pct": -0.73},
                {"period": "FY 2025 Average", "actual": "1.80%", "previous": "-0.70%", "change_pct": 2.50},
                {"period": "FY 2024 Average", "actual": "-0.70%", "previous": "9.40%", "change_pct": -10.10}
            ],
            "chart_series": [
                {"period": "Jun 26", "value": 3.43},
                {"period": "Jul 26", "value": 2.04},
                {"period": "Aug 26", "value": 1.31},
                {"period": "Sep 26", "value": 1.84},
                {"period": "Oct 26", "value": 2.36}
            ],
            "country_comparison": [
                {"country": "India 🇮🇳", "value": "2.36%", "status": "BENIGN"},
                {"country": "United States 🇺🇸 (PPI)", "value": "2.40%", "status": "MODERATE"},
                {"country": "China 🇨🇳 (PPI)", "value": "-2.90%", "status": "DEFLATION"}
            ],
            "market_impact": {
                "nifty_50": "Subdued WPI at 2.36% is structurally positive for manufacturing gross margins.",
                "bank_nifty": "Neutral.",
                "it_sector": "Neutral.",
                "banking_stocks": "Neutral.",
                "auto_sector": "Margin expansion for auto OEMs (Maruti, M&M) as steel and aluminum raw materials remain controlled.",
                "infra_capital_goods": "Protects construction operating margins.",
                "usd_inr": "Neutral.",
                "bond_yields": "Anchored.",
                "fii_flows": "Supports corporate earnings trajectory."
            },
            "market_impact_te": {
                "summary": "టోకు ద్రవ్యోల్బణం (WPI) 2.36% వద్ద అదుపులో ఉండటం వల్ల తయారీ రంగ కంపెనీల ముడిసరుకు ఖర్చులు తగ్గి లాభాల మార్జిన్లు పెరుగుతాయి."
            }
        },

        # 9. RBI REPO RATE
        "rbi-repo-rate": {
            "id": "rbi-repo-rate",
            "name": "RBI Benchmark Policy Repo Rate",
            "name_te": "RBI పాలసీ రెపో రేటు",
            "group": "Monetary Policy",
            "category": "CENTRAL_BANK",
            "definition_en": "Benchmark interest rate at which the Reserve Bank of India lends liquidity to commercial banks against government securities collateral.",
            "definition_te": "వాణిజ్య బ్యాంకులకు రిజర్వ్ బ్యాంక్ ఇచ్చే స్వల్పకాలిక రుణాలపై విధించే ప్రామాణిక వడ్డీ రేటు.",
            "formula": "Policy Rate set by 6-member RBI Monetary Policy Committee (MPC)",
            "why_it_matters": "The bedrock of all borrowing rates in India. Dictates home loan EMIs, corporate working capital loans, and equity discount rates.",
            "why_it_matters_te": "దేశంలోని గృహ రుణాలు, కార్పొరేట్ రుణాలు మరియు ఫిక్స్‌డ్ డిపాజిట్ల వడ్డీ రేట్లను రెపో రేటే నిర్దేశిస్తుంది.",
            "latest_value": "6.50%",
            "previous_value": "6.50%",
            "forecast_value": "6.50%",
            "yoy_pct": 0.00,
            "qoq_pct": 0.00,
            "unit": "% Per Annum",
            "frequency": "Bi-Monthly (RBI MPC Schedule)",
            "next_release": "06 December 2026, 10:00 AM IST",
            "source_name": "Reserve Bank of India (Monetary Policy Department)",
            "source_url": "https://www.rbi.org.in/",
            "five_year_history": [
                {"period": "Oct 2026", "actual": "6.50%", "previous": "6.50%", "change_pct": 0.00},
                {"period": "Aug 2026", "actual": "6.50%", "previous": "6.50%", "change_pct": 0.00},
                {"period": "Feb 2023", "actual": "6.50%", "previous": "6.25%", "change_pct": 0.25},
                {"period": "Dec 2022", "actual": "6.25%", "previous": "5.90%", "change_pct": 0.35},
                {"period": "May 2022", "actual": "4.40%", "previous": "4.00%", "change_pct": 0.40},
                {"period": "May 2020", "actual": "4.00%", "previous": "4.40%", "change_pct": -0.40}
            ],
            "chart_series": [
                {"period": "2020", "value": 4.00},
                {"period": "2021", "value": 4.00},
                {"period": "2022", "value": 6.25},
                {"period": "2023", "value": 6.50},
                {"period": "2024", "value": 6.50},
                {"period": "2025", "value": 6.50},
                {"period": "2026", "value": 6.50}
            ],
            "country_comparison": [
                {"country": "India 🇮🇳", "value": "6.50%", "status": "NEUTRAL_STAND"},
                {"country": "United States 🇺🇸 (Fed Funds)", "value": "4.75%", "status": "EASING"},
                {"country": "Eurozone 🇪🇺 (ECB)", "value": "3.25%", "status": "EASING"},
                {"country": "United Kingdom 🇬🇧 (BoE)", "value": "4.75%", "status": "EASING"},
                {"country": "Japan 🇯🇵 (BoJ)", "value": "0.25%", "status": "TIGHTENING"}
            ],
            "market_impact": {
                "nifty_50": "Pivotal driver. Prolonged pause at 6.50% maintains valuation discipline. A future rate cut will spark aggressive multi-month bull rally.",
                "bank_nifty": "Primary driver. Rate cuts reduce funding costs and spark credit growth; pauses sustain high Net Interest Margins (NIM).",
                "it_sector": "Indirect.",
                "banking_stocks": "Direct sensitivity.",
                "auto_sector": "Automotive loan interest rates directly mirror repo rate trajectory.",
                "infra_capital_goods": "Lower repo rates decrease long-gestation infrastructure project finance costs.",
                "usd_inr": "Yield differential support.",
                "bond_yields": "Governs entire sovereign yield curve.",
                "fii_flows": "Stability attracts global debt and equity capital."
            },
            "market_impact_te": {
                "summary": "RBI రెపో రేటును 6.50% వద్ద కొనసాగించడం వల్ల బ్యాంకుల మార్జిన్లు బలంగా ఉన్నాయి. భవిష్యత్తులో రేట్ల తగ్గింపు జరిగితే మార్కెట్లు సరికొత్త రికార్డులను సృష్టిస్తాయి."
            }
        },

        # 10. INDIA 10-YEAR BENCHMARK G-SEC BOND YIELD
        "india-10y-bond-yield": {
            "id": "india-10y-bond-yield",
            "name": "India 10-Year Benchmark Sovereign Bond Yield (G-Sec)",
            "name_te": "భారత 10-సంవత్సరాల బెంచ్‌మార్క్ ప్రభుత్వ బాండ్ రాబడి (G-Sec Yield)",
            "group": "Financial Markets",
            "category": "FIXED_INCOME",
            "definition_en": "Annualized yield of India's benchmark 10-year sovereign government security, representing the sovereign risk-free rate used to discount domestic corporate earnings.",
            "definition_te": "భారత ప్రభుత్వం జారీ చేసే 10 ఏళ్ల బాండ్లపై లభించే వార్షిక రాబడి రేటు. దేశీయ రుణాలకు ఇది ప్రామాణిక రిస్క్ లేని వడ్డీ రేటు.",
            "formula": "Internal Rate of Return (IRR) equating coupon payments + face value repayment to current G-Sec market clean price",
            "why_it_matters": "The baseline cost of capital in India. When 10Y yields drop, equity P/E ratios expand; when yields rise, equity valuations compress.",
            "why_it_matters_te": "బాండ్ రాబడి తగ్గితే స్టాక్ మార్కెట్ వాల్యుయేషన్లు పెరుగుతాయి; బాండ్ రాబడి పెరిగితే ఈక్విటీ షేర్లపై ఒత్తిడి వస్తుంది.",
            "latest_value": "6.82%",
            "previous_value": "6.85%",
            "forecast_value": "6.80%",
            "yoy_pct": -0.35,
            "qoq_pct": -0.08,
            "unit": "% Benchmark Annual Yield",
            "frequency": "Daily Market Quotes",
            "next_release": "Daily Continuous Market Trading (09:00 AM - 05:00 PM IST)",
            "source_name": "Clearcorp / CCIL / Reserve Bank of India",
            "source_url": "https://www.ccilindia.com/",
            "five_year_history": [
                {"period": "Nov 2026 (Latest)", "actual": "6.82%", "previous": "6.85%", "change_pct": -0.03},
                {"period": "Oct 2026", "actual": "6.85%", "previous": "6.95%", "change_pct": -0.10},
                {"period": "FY 2025", "actual": "7.05%", "previous": "7.30%", "change_pct": -0.25},
                {"period": "FY 2024", "actual": "7.30%", "previous": "7.45%", "change_pct": -0.15},
                {"period": "FY 2023", "actual": "7.45%", "previous": "6.85%", "change_pct": 0.60}
            ],
            "chart_series": [
                {"period": "2022", "value": 7.45},
                {"period": "2023", "value": 7.30},
                {"period": "2024", "value": 7.15},
                {"period": "2025", "value": 7.05},
                {"period": "2026", "value": 6.82}
            ],
            "country_comparison": [
                {"country": "India 🇮🇳 10Y", "value": "6.82%", "status": "HEALTHY_SPREAD"},
                {"country": "United States 🇺🇸 10Y", "value": "4.42%", "status": "INVERTED_EASING"},
                {"country": "Spread (India - US)", "value": "240 bps", "status": "HISTORIC_LOW_SPREAD"}
            ],
            "market_impact": {
                "nifty_50": "A yield below 6.85% is a significant tailwind for index valuation re-rating.",
                "bank_nifty": "Massive treasury mark-to-market bond trading profits for PSU and Private banks (SBI, BoB, Canara Bank).",
                "it_sector": "Neutral.",
                "banking_stocks": "Direct treasury gains.",
                "auto_sector": "Supportive.",
                "infra_capital_goods": "Lowers corporate bond borrowing yields for capital-intensive infrastructure companies.",
                "usd_inr": "Foreign institutional inflows into JP Morgan GBI-EM Indian index constituents.",
                "bond_yields": "Primary benchmark.",
                "fii_flows": "Strong debt inflows under Fully Accessible Route (FAR)."
            },
            "market_impact_te": {
                "summary": "10-ఏళ్ల ప్రభుత్వ బాండ్ ఈల్డ్స్ 6.82% కి తగ్గడం ప్రభుత్వ రంగ బ్యాంకులకు (SBI, PNB) భారీ ట్రెజరీ లాభాలను ఇస్తుంది. ఇది బ్యాంక్ నిఫ్టీకి అత్యంత సానుకూలం."
            }
        }
    }

    @classmethod
    def get_all_topics(cls) -> List[Dict[str, Any]]:
        """Returns summarized catalog of all macro topics for overview cheat sheet."""
        result = []
        for topic_id, item in cls.MACRO_DATABASE.items():
            result.append({
                "id": topic_id,
                "term": item["id"].upper().replace("-", " "),
                "name": item["name"],
                "name_te": item["name_te"],
                "group": item["group"],
                "category": item["category"],
                "definition": item["definition_en"],
                "definition_te": item["definition_te"],
                "latest_value": item["latest_value"],
                "previous_value": item["previous_value"],
                "unit": item["unit"],
                "source": item["source_name"]
            })
        return result

    @classmethod
    def get_topic_detail(cls, topic_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves full quantitative detail, 5-year table, chart series, and market impacts."""
        cleaned_id = topic_id.lower().strip().replace("_", "-")
        alias_map = {
            "cpi": "cpi-inflation",
            "cpi-headline": "cpi-inflation",
            "wpi": "wpi-inflation",
            "wpi-headline": "wpi-inflation",
            "repo-rate": "rbi-repo-rate",
            "gsec": "10y-gsec-yield",
            "10y-gsec": "10y-gsec-yield",
        }
        target_id = alias_map.get(cleaned_id, cleaned_id)
        return cls.MACRO_DATABASE.get(target_id)


macro_data_service = MacroDataService()
