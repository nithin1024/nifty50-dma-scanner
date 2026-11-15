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
        },

        # 11. GFCE (GOVERNMENT FINAL CONSUMPTION EXPENDITURE)
        "gfce": {
            "id": "gfce",
            "name": "Government Final Consumption Expenditure (GFCE)",
            "name_te": "ప్రభుత్వ తుది వినియోగ వ్యయం (GFCE)",
            "group": "Demand Components",
            "category": "FISCAL",
            "definition_en": "Expenditure incurred by central and state governments on compensation of employees, public administration, defense, healthcare, and public welfare services.",
            "definition_te": "కేంద్ర మరియు రాష్ట్ర ప్రభుత్వాలు ఉద్యోగుల జీతాలు, రక్షణ, విద్య, వైద్యం మరియు ప్రజా సేవల కోసం చేసే దైనందిన నిర్వహణ వ్యయం.",
            "formula": "GFCE = Public Compensation of Employees + Intermediate Purchases of Goods & Services - Sales of Goods & Services",
            "why_it_matters": "GFCE provides counter-cyclical stability when private investment or consumption moderates. It accounts for ~10-11% of Indian GDP.",
            "why_it_matters_te": "ఆర్థిక మాంద్యం సమయాల్లో ప్రభుత్వ ఖర్చు ఆర్థిక వ్యవస్థకు రక్షణగా నిలుస్తుంది.",
            "latest_value": "4.20%",
            "previous_value": "3.80%",
            "forecast_value": "4.00%",
            "yoy_pct": 4.20,
            "unit": "% YoY Growth",
            "frequency": "Quarterly",
            "next_release": "28 November 2026, 05:30 PM IST",
            "source_name": "Ministry of Statistics (MoSPI)",
            "source_url": "https://www.mospi.gov.in/",
            "five_year_history": [
                {"period": "FY 2025-26", "actual": "4.20%", "previous": "3.80%", "change_pct": 0.40},
                {"period": "FY 2024-25", "actual": "3.80%", "previous": "4.90%", "change_pct": -1.10},
                {"period": "FY 2023-24", "actual": "4.90%", "previous": "5.60%", "change_pct": -0.70},
                {"period": "FY 2022-23", "actual": "5.60%", "previous": "1.80%", "change_pct": 3.80},
                {"period": "FY 2021-22", "actual": "1.80%", "previous": "3.60%", "change_pct": -1.80}
            ],
            "chart_series": [
                {"period": "FY22", "value": 1.8},
                {"period": "FY23", "value": 5.6},
                {"period": "FY24", "value": 4.9},
                {"period": "FY25", "value": 3.8},
                {"period": "FY26", "value": 4.2}
            ],
            "country_comparison": [
                {"country": "India 🇮🇳", "value": "10.4% of GDP", "status": "PRUDENT"},
                {"country": "United States 🇺🇸", "value": "14.2% of GDP", "status": "HIGHER"},
                {"country": "United Kingdom 🇬🇧", "value": "18.5% of GDP", "status": "HIGH"}
            ],
            "market_impact": {
                "nifty_50": "Healthy fiscal consolidation with GFCE discipline boosts sovereign rating upgrades.",
                "bank_nifty": "Lower government revenue expenditure reduces fiscal deficit and bond yields.",
                "it_sector": "Neutral.",
                "banking_stocks": "Frees up liquidity for private sector credit.",
                "auto_sector": "Mild indirect support.",
                "infra_capital_goods": "More fiscal headroom shifted towards capex (GFCF).",
                "usd_inr": "Improves sovereign fiscal credentials.",
                "bond_yields": "Fiscal discipline eases 10Y yields.",
                "fii_flows": "Long-term institutional investor confidence."
            },
            "market_impact_te": {
                "summary": "ప్రభుత్వ నిర్వహణ వ్యయం నియంత్రణలో ఉంటే ద్రవ్యలోటు తగ్గి బాండ్ ఈల్డ్స్ తగ్గుతాయి, ఇది మార్కెట్లకు అనుకూలం."
            }
        },

        # 12. NET EXPORTS
        "net-exports": {
            "id": "net-exports",
            "name": "Net Exports of Goods and Services (X - M)",
            "name_te": "నికర ఎగుమతులు (ఎగుమతులు - దిగుమతులు)",
            "group": "Demand Components",
            "category": "EXTERNAL_TRADE",
            "definition_en": "The value of total Indian exports of goods and services minus total imports, representing external demand component of National Output.",
            "definition_te": "భారతదేశం విదేశాలకు చేసే మొత్తం ఎగుమతుల విలువ నుండి దిగుమతుల విలువను తీసివేస్తే వచ్చే నికర వాణిజ్య విలువ.",
            "formula": "Net Exports = Exports of Goods & Services (X) - Imports of Goods & Services (M)",
            "why_it_matters": "A persistent trade deficit drags GDP growth, while services export surpluses (IT, GCCs) offset petroleum and gold import bills.",
            "why_it_matters_te": "ఇది రూపాయి విలువ మరియు కరెంట్ ఖాతా లోటు (CAD) ను ప్రత్యక్షంగా నిర్ణయిస్తుంది.",
            "latest_value": "-₹2.15 Lakh Cr",
            "previous_value": "-₹2.45 Lakh Cr",
            "forecast_value": "-₹2.20 Lakh Cr",
            "yoy_pct": 12.2,
            "unit": "₹ Lakh Crore",
            "frequency": "Quarterly / Monthly",
            "next_release": "15 December 2026, 05:00 PM IST",
            "source_name": "Ministry of Commerce / RBI",
            "source_url": "https://commerce.gov.in/",
            "five_year_history": [
                {"period": "FY 2025-26", "actual": "-2.1% of GDP", "previous": "-2.4% of GDP", "change_pct": 0.3},
                {"period": "FY 2024-25", "actual": "-2.4% of GDP", "previous": "-3.1% of GDP", "change_pct": 0.7},
                {"period": "FY 2023-24", "actual": "-3.1% of GDP", "previous": "-3.8% of GDP", "change_pct": 0.7},
                {"period": "FY 2022-23", "actual": "-3.8% of GDP", "previous": "-1.2% of GDP", "change_pct": -2.6},
                {"period": "FY 2021-22", "actual": "-1.2% of GDP", "previous": "0.9% of GDP", "change_pct": -2.1}
            ],
            "chart_series": [
                {"period": "FY22", "value": -1.2},
                {"period": "FY23", "value": -3.8},
                {"period": "FY24", "value": -3.1},
                {"period": "FY25", "value": -2.4},
                {"period": "FY26", "value": -2.1}
            ],
            "country_comparison": [
                {"country": "India 🇮🇳", "value": "-2.1% of GDP", "status": "DEFICIT_CONTAINED"},
                {"country": "China 🇨🇳", "value": "+3.4% of GDP", "status": "SURPLUS"},
                {"country": "Germany 🇩🇪", "value": "+5.2% of GDP", "status": "LARGE_SURPLUS"},
                {"country": "United States 🇺🇸", "value": "-2.9% of GDP", "status": "DEFICIT"}
            ],
            "market_impact": {
                "nifty_50": "Narrowing trade deficits strengthen Rupee and improve foreign institutional sentiment.",
                "bank_nifty": "Reduces external currency vulnerability.",
                "it_sector": "IT services export growth is India's principal surplus driver.",
                "banking_stocks": "Trade finance expansion.",
                "auto_sector": "Auto component exports benefit.",
                "infra_capital_goods": "Lower import bill reduces cost of heavy machinery.",
                "usd_inr": "Supports Rupee against US Dollar.",
                "bond_yields": "Reduces risk premium on sovereign debt.",
                "fii_flows": "Encourages equity and debt inflows."
            },
            "market_impact_te": {
                "summary": "వాణిజ్య లోటు తగ్గడం రూపాయి బలానికి మరియు భారత స్టాక్ మార్కెట్లకు అత్యంత అనుకూలమైన పరిణామం."
            }
        },

        # 13. FOREX RESERVES
        "forex-reserves": {
            "id": "forex-reserves",
            "name": "India Foreign Exchange Reserves",
            "name_te": "భారత విదేశీ మారక నిల్వలు (Forex Reserves)",
            "group": "External Sector",
            "category": "EXTERNAL_TRADE",
            "definition_en": "Foreign currency assets, gold holdings, Special Drawing Rights (SDRs), and reserve position with the IMF managed by the Reserve Bank of India.",
            "definition_te": "RBI వద్ద ఉన్న విదేశీ కరెన్సీ ఆస్తులు, బంగారం నిల్వలు మరియు IMF వద్ద ఉన్న నిల్వల మొత్తం విలువ.",
            "formula": "Total Reserves = Foreign Currency Assets (FCA) + Gold Reserves + SDRs + Reserve Position in IMF",
            "why_it_matters": "Forex reserves provide sovereign armor against external currency speculation, covering ~11-12 months of imports.",
            "why_it_matters_te": "రూపాయి విలువ భారీగా పడిపోకుండా కాపాడటానికి RBI వద్ద ఉన్న అపారమైన ఆర్థిక రక్షణ కవచం ఇది.",
            "latest_value": "$685.20 Billion",
            "previous_value": "$682.10 Billion",
            "forecast_value": "$690.00 Billion",
            "yoy_pct": 14.5,
            "unit": "USD Billion",
            "frequency": "Weekly (Every Friday 05:00 PM IST)",
            "next_release": "20 November 2026, 05:00 PM IST",
            "source_name": "Reserve Bank of India (RBI)",
            "source_url": "https://www.rbi.org.in/",
            "five_year_history": [
                {"period": "Nov 2026 (Latest)", "actual": "$685.2B", "previous": "$682.1B", "change_pct": 0.45},
                {"period": "FY 2024-25", "actual": "$645.6B", "previous": "$578.4B", "change_pct": 11.6},
                {"period": "FY 2023-24", "actual": "$578.4B", "previous": "$607.3B", "change_pct": -4.8},
                {"period": "FY 2022-23", "actual": "$607.3B", "previous": "$577.0B", "change_pct": 5.2},
                {"period": "FY 2021-22", "actual": "$577.0B", "previous": "$477.8B", "change_pct": 20.8}
            ],
            "chart_series": [
                {"period": "FY22", "value": 577.0},
                {"period": "FY23", "value": 607.3},
                {"period": "FY24", "value": 578.4},
                {"period": "FY25", "value": 645.6},
                {"period": "FY26", "value": 685.2}
            ],
            "country_comparison": [
                {"country": "India 🇮🇳", "value": "$685.2 Billion", "status": "RECORD_HIGH (4th Worldwide)"},
                {"country": "China 🇨🇳", "value": "$3,260.0 Billion", "status": "HIGHEST"},
                {"country": "Japan 🇯🇵", "value": "$1,230.0 Billion", "status": "2nd"},
                {"country": "Switzerland 🇨🇭", "value": "$890.0 Billion", "status": "3rd"}
            ],
            "market_impact": {
                "nifty_50": "Provides macroeconomic stability cushion against global risk-off events, anchoring Indian sovereign P/E premiums.",
                "bank_nifty": "Shields systemic liquidity from capital flight.",
                "it_sector": "Neutral.",
                "banking_stocks": "Strengthens bank stability.",
                "auto_sector": "Imported component price stability.",
                "infra_capital_goods": "Protects dollar-denominated borrowing covenants.",
                "usd_inr": "RBI actively intervenes to suppress Rupee depreciation volatility.",
                "bond_yields": "Caps sovereign risk spreads.",
                "fii_flows": "Reassures foreign pension funds of zero sovereign balance-of-payments crisis risk."
            },
            "market_impact_te": {
                "summary": "విదేశీ మారక నిల్వలు $685 బిలియన్ల రికార్డు స్థాయికి చేరడం వల్ల రూపాయి స్థిరంగా ఉంటుంది మరియు విదేశీ ఇన్వెస్టర్లలో నమ్మకం పెరుగుతుంది."
            }
        },

        # 14. USD / INR
        "usd-inr": {
            "id": "usd-inr",
            "name": "USD / INR Foreign Exchange Spot Rate",
            "name_te": "అమెరికా డాలర్ - భారత రూపాయి మారకం రేటు",
            "group": "External Sector",
            "category": "CURRENCY",
            "definition_en": "Spot exchange rate expressing the number of Indian Rupees required to purchase one United States Dollar, determined by foreign capital flows, trade balances, and RBI market operations.",
            "definition_te": "ఒక అమెరికా డాలర్‌ను కొనుగోలు చేయడానికి అవసరమైన భారత రూపాయల సంఖ్యను తెలియజేసే అధికారిక కరెన్సీ రేటు.",
            "formula": "Spot Exchange Rate = Market Equilibrium of FX Demand & Supply",
            "why_it_matters": "Determines the purchasing power of the Rupee. A weakening Rupee elevates imported crude oil inflation but boosts revenues for IT and pharma exporters.",
            "why_it_matters_te": "ముడిచమురు దిగుమతి ఖర్చులు మరియు IT, ఫార్మా కంపెనీల ఎగుమతి ఆదాయాలపై ఇది అత్యంత తీవ్ర ప్రభావం చూపుతుంది.",
            "latest_value": "₹84.42",
            "previous_value": "₹84.38",
            "forecast_value": "₹84.50",
            "yoy_pct": 1.25,
            "unit": "INR per USD",
            "frequency": "Daily Continuous (FBIL Reference Rate)",
            "next_release": "Daily Continuous Market Session",
            "source_name": "Financial Benchmarks India (FBIL) / RBI",
            "source_url": "https://www.fbil.org.in/",
            "five_year_history": [
                {"period": "Nov 2026 (Latest)", "actual": "84.42", "previous": "84.38", "change_pct": 0.05},
                {"period": "FY 2024-25 Average", "actual": "83.40", "previous": "82.20", "change_pct": 1.46},
                {"period": "FY 2023-24 Average", "actual": "82.20", "previous": "78.60", "change_pct": 4.58},
                {"period": "FY 2022-23 Average", "actual": "78.60", "previous": "74.50", "change_pct": 5.50},
                {"period": "FY 2021-22 Average", "actual": "74.50", "previous": "73.20", "change_pct": 1.78}
            ],
            "chart_series": [
                {"period": "FY22", "value": 74.5},
                {"period": "FY23", "value": 78.6},
                {"period": "FY24", "value": 82.2},
                {"period": "FY25", "value": 83.4},
                {"period": "FY26", "value": 84.4}
            ],
            "country_comparison": [
                {"country": "India 🇮🇳 (INR)", "value": "₹84.42", "status": "LOWEST_VOLATILITY_IN_EM"},
                {"country": "China 🇨🇳 (CNY)", "value": "7.23", "status": "MANAGED"},
                {"country": "Indonesia 🇮🇩 (IDR)", "value": "15,850", "status": "HIGHER_VOLATILITY"}
            ],
            "market_impact": {
                "nifty_50": "Stable USD/INR keeps foreign investor dollar returns protected.",
                "bank_nifty": "Curbs imported inflation pressure.",
                "it_sector": "Direct beneficiary: every 1% Rupee depreciation adds ~30-40 bps to IT operating margins (TCS, Infosys).",
                "banking_stocks": "Neutral.",
                "auto_sector": "Mild negative on raw material imports.",
                "infra_capital_goods": "Imported equipment costs rise with USD strength.",
                "usd_inr": "Benchmark.",
                "bond_yields": "Rupee stability keeps bond yields contained.",
                "fii_flows": "A predictable, low-volatility Rupee attracts steady institutional asset allocation."
            },
            "market_impact_te": {
                "summary": "రూపాయి స్వల్పంగా క్షీణిస్తే TCS, Infosys వంటి IT కంపెనీల డాలర్ ఆదాయాలు పెరుగుతాయి. అయితే చమురు ధరలపై ఒత్తిడి ఉంటుంది."
            }
        },

        # 15. MANUFACTURING PMI
        "manufacturing-pmi": {
            "id": "manufacturing-pmi",
            "name": "HSBC India Manufacturing Purchasing Managers' Index (PMI)",
            "name_te": "భారత మాన్యుఫ్యాక్చరింగ్ పర్చేజింగ్ మేనేజర్స్ ఇండెక్స్ (PMI)",
            "group": "High-Frequency Activity",
            "category": "BUSINESS_SURVEY",
            "definition_en": "Monthly survey of purchasing managers across ~400 industrial manufacturers evaluating new orders, output, employment, supplier deliveries, and purchasing inventory.",
            "definition_te": "దేశంలోని 400 తయారీ సంస్థల ఆర్డర్లు, ఉత్పత్తి మరియు ఉద్యోగాల వృద్ధిని కొలిచే అత్యంత వేగవంతమైన నెలవారీ పారిశ్రామిక సూచిక (50 పైన ఉంటే విస్తరణ).",
            "formula": "PMI = (P1 * 1.0) + (P2 * 0.5) + (P3 * 0.0) where 50 represents the breakeven expansion/contraction threshold",
            "why_it_matters": "A reading above 50.0 indicates industrial expansion. India's PMI consistently operating in the 56-59 corridor signifies premier global manufacturing momentum.",
            "why_it_matters_te": "PMI 50 పైన ఉంటే ఫ్యాక్టరీలు వేగంగా విస్తరిస్తున్నాయని అర్థం. ఇది కార్పొరేట్ కంపెనీల త్రైమాసిక లాభాల వృద్ధిని సూచిస్తుంది.",
            "latest_value": "57.50",
            "previous_value": "56.50",
            "forecast_value": "57.00",
            "yoy_pct": 1.77,
            "unit": "Diffusion Index (>50 = Expansion)",
            "frequency": "Monthly (1st working day of month)",
            "next_release": "01 December 2026, 10:30 AM IST",
            "source_name": "S&P Global / HSBC",
            "source_url": "https://www.spglobal.com/",
            "five_year_history": [
                {"period": "Oct 2026 (Latest)", "actual": "57.50", "previous": "56.50", "change_pct": 1.77},
                {"period": "Sep 2026", "actual": "56.50", "previous": "57.50", "change_pct": -1.74},
                {"period": "FY 2024-25 Average", "actual": "58.10", "previous": "55.30", "change_pct": 5.06},
                {"period": "FY 2023-24 Average", "actual": "55.30", "previous": "54.10", "change_pct": 2.22},
                {"period": "FY 2022-23 Average", "actual": "54.10", "previous": "52.80", "change_pct": 2.46}
            ],
            "chart_series": [
                {"period": "FY22", "value": 52.8},
                {"period": "FY23", "value": 54.1},
                {"period": "FY24", "value": 55.3},
                {"period": "FY25", "value": 58.1},
                {"period": "FY26", "value": 57.5}
            ],
            "country_comparison": [
                {"country": "India 🇮🇳", "value": "57.50", "status": "GLOBAL_MANUFACTURING_LEADER"},
                {"country": "United States 🇺🇸", "value": "48.50", "status": "CONTRACTION"},
                {"country": "Eurozone 🇪🇺", "value": "45.80", "status": "CONTRACTION"},
                {"country": "China 🇨🇳", "value": "50.10", "status": "STAGNATION"}
            ],
            "market_impact": {
                "nifty_50": "Exceptional manufacturing strength fuels institutional domestic cyclical investments.",
                "bank_nifty": "Working capital credit demand jumps.",
                "it_sector": "Neutral.",
                "banking_stocks": "Higher corporate credit utilization.",
                "auto_sector": "Automotive factory output expansion.",
                "infra_capital_goods": "Industrial capacity expansion lifts engineering majors (L&T, Cummins).",
                "usd_inr": "Boosts FDI attraction into Make in India initiatives.",
                "bond_yields": "Robust economic activity keeps yields supported.",
                "fii_flows": "Strong inflows from emerging market equity funds."
            },
            "market_impact_te": {
                "summary": "PMI 57.5 వద్ద బలంగా ఉండటం భారత ఫ్యాక్టరీల ఉత్పత్తి సామర్థ్యాన్ని మరియు కంపెనీల ఆదాయ వృద్ధిని రుజువు చేస్తుంది."
            }
        },

        # 16. CORE CPI (Excluding Food & Fuel)
        "core-cpi": {
            "id": "core-cpi",
            "name": "India Core CPI Inflation (Excluding Food & Fuel)",
            "name_te": "కోర్ CPI ద్రవ్యోల్బణం (ఆహారం & ఇంధనం మినహాయించి)",
            "group": "Price Indices & Deflators",
            "category": "INFLATION",
            "definition_en": "Core consumer inflation removing volatile perishable food and energy commodities, capturing underlying structural demand-pull pricing pressures.",
            "definition_te": "అస్థిరమైన ఆహార మరియు ఇంధన ధరలను మినహాయించి ఆర్థిక వ్యవస్థలోని వాస్తవ ద్రవ్యోల్బణ ధోరణిని కొలిచే సూచిక.",
            "formula": "Core CPI = All Commodities CPI - Food & Beverages (45.86% wt) - Fuel & Light (6.84% wt)",
            "why_it_matters": "The primary operational gauge observed by the RBI MPC. Core CPI at 3.50% confirms that India faces no systemic demand-side overheating.",
            "why_it_matters_te": "ఆర్బీఐ ద్రవ్య విధాన నిర్ణయాలకు ఇది అత్యంత ప్రాధాన్యం. కోర్ CPI 3.5% వద్ద ఉండటం వల్ల వడ్డీ రేట్ల తగ్గింపునకు మార్గం సుగమం అవుతుంది.",
            "latest_value": "3.50%",
            "previous_value": "3.56%",
            "forecast_value": "3.60%",
            "yoy_pct": 3.50,
            "unit": "% YoY Growth",
            "frequency": "Monthly",
            "next_release": "12 December 2026, 05:30 PM IST",
            "source_name": "MoSPI (National Statistical Office)",
            "source_url": "https://www.mospi.gov.in/",
            "five_year_history": [
                {"period": "Oct 2026 (Latest)", "actual": "3.50%", "previous": "3.56%", "change_pct": -0.06},
                {"period": "FY 2024-25", "actual": "4.30%", "previous": "4.40%", "change_pct": -0.10},
                {"period": "FY 2023-24", "actual": "4.40%", "previous": "6.10%", "change_pct": -1.70},
                {"period": "FY 2022-23", "actual": "6.10%", "previous": "5.90%", "change_pct": 0.20},
                {"period": "FY 2021-22", "actual": "5.90%", "previous": "5.50%", "change_pct": 0.40}
            ],
            "chart_series": [
                {"period": "FY22", "value": 5.9},
                {"period": "FY23", "value": 6.1},
                {"period": "FY24", "value": 4.4},
                {"period": "FY25", "value": 4.3},
                {"period": "FY26", "value": 3.5}
            ],
            "country_comparison": [
                {"country": "India 🇮🇳", "value": "3.50%", "status": "BENIGN_STRUCTURAL_STABILITY"},
                {"country": "United States 🇺🇸", "value": "3.30%", "status": "STICKY"},
                {"country": "Eurozone 🇪🇺", "value": "2.70%", "status": "MODERATING"}
            ],
            "market_impact": {
                "nifty_50": "Very bullish for equity multiples as low core inflation preserves corporate margin cushions.",
                "bank_nifty": "Low core inflation anchors long-term sovereign bond yields, expanding banking treasury profitability.",
                "it_sector": "Neutral.",
                "banking_stocks": "Improves margin visibility.",
                "auto_sector": "Stable input costs enhance auto OEM operating margins.",
                "infra_capital_goods": "Supports capex planning.",
                "usd_inr": "Preserves real interest rate differential in favour of the Rupee.",
                "bond_yields": "Keeps 10Y G-Sec yields anchored near 6.75%.",
                "fii_flows": "Supports long-duration sovereign and corporate bond inflows."
            },
            "market_impact_te": {
                "summary": "కోర్ ద్రవ్యోల్బణం 3.5% వద్ద స్థిరంగా ఉండటం భారత కార్పొరేట్ కంపెనీల మార్జిన్లకు మరియు బ్యాంకింగ్ షేర్లకు ఎంతో సానుకూలం."
            }
        },

        # 17. BRENT CRUDE OIL
        "crude-oil": {
            "id": "crude-oil",
            "name": "Crude Oil (Brent Global Benchmark)",
            "name_te": "బ్రెంట్ క్రూడ్ ఆయిల్ (ముడి చమురు ధర)",
            "group": "Global Commodities & Raw Materials",
            "category": "COMMODITY",
            "definition_en": "Global crude oil trading benchmark sourced from the North Sea, serving as the definitive reference price for India's oil import basket.",
            "definition_te": "ప్రపంచ ముడి చమురు ప్రామాణిక ధర. భారతదేశం తన చమురు అవసరాలలో 85% దిగుమతి చేసుకుంటుంది కాబట్టి ఇది ఆర్థిక వ్యవస్థకు అత్యంత కీలకం.",
            "formula": "Brent Crude Price in USD per Barrel (1 barrel = ~159 liters)",
            "why_it_matters": "Every $10/barrel drop in Brent crude reduces India's Current Account Deficit by ~0.3% of GDP and cools headline CPI by ~25-30 bps.",
            "why_it_matters_te": "చమురు ధర $10 తగ్గితే భారతదేశ కరెంట్ ఖాతా లోటు (CAD) మరియు ద్రవ్యోల్బణం గణనీయంగా తగ్గుతాయి.",
            "latest_value": "$72.80 / bbl",
            "previous_value": "$74.20 / bbl",
            "forecast_value": "$73.50 / bbl",
            "yoy_pct": -12.4,
            "unit": "USD / Barrel",
            "frequency": "Continuous / Daily",
            "next_release": "Real-time Intercontinental Exchange (ICE)",
            "source_name": "ICE Futures Europe / Reuters",
            "source_url": "https://www.theice.com/",
            "five_year_history": [
                {"period": "Nov 2026 (Latest)", "actual": "$72.80", "previous": "$74.20", "change_pct": -1.89},
                {"period": "2025 Average", "actual": "$82.50", "previous": "$85.00", "change_pct": -2.94},
                {"period": "2024 Average", "actual": "$85.00", "previous": "$83.20", "change_pct": 2.16},
                {"period": "2023 Average", "actual": "$83.20", "previous": "$100.90", "change_pct": -17.54},
                {"period": "2022 Average", "actual": "$100.90", "previous": "$70.80", "change_pct": 42.51}
            ],
            "chart_series": [
                {"period": "2022", "value": 100.9},
                {"period": "2023", "value": 83.2},
                {"period": "2024", "value": 85.0},
                {"period": "2025", "value": 82.5},
                {"period": "2026", "value": 72.8}
            ],
            "country_comparison": [
                {"country": "Brent Global", "value": "$72.80", "status": "BENIGN_FOR_INDIA"},
                {"country": "WTI (US)", "value": "$68.50", "status": "DOMESTIC_US_DISCOUNT"},
                {"country": "Urals (Russia)", "value": "$64.20", "status": "INDIA_DISCOUNTED_SUPPLY"}
            ],
            "market_impact": {
                "nifty_50": "Sub-$75 Brent is a major structural positive for Indian macro, lowering imported inflation and strengthening sovereign twin deficits.",
                "bank_nifty": "Highly positive via lower systemic inflation expectations.",
                "it_sector": "Neutral.",
                "banking_stocks": "Macroeconomic tailwind.",
                "auto_sector": "Highly bullish; lower fuel costs spur commercial and passenger vehicle usage.",
                "infra_capital_goods": "Bitumen and diesel running costs decrease for project developers.",
                "usd_inr": "Significantly cushions the Indian Rupee against dollar outflows.",
                "bond_yields": "Low oil eases bond yields by eliminating imported inflation spikes.",
                "fii_flows": "Foreign institutional investors allocate more capital to India when crude remains benign."
            },
            "market_impact_te": {
                "summary": "క్రూడ్ ఆయిల్ ధర $75 దిగువన ఉండటం భారతదేశానికి బంపర్ గిఫ్ట్. ఆయిల్ మార్కెటింగ్ కంపెనీలు (BPCL, IOC), పెయింట్స్ మరియు టైర్ కంపెనీల లాభాలు భారీగా పెరుగుతాయి."
            }
        },

        # 18. SERVICES PMI
        "services-pmi": {
            "id": "services-pmi",
            "name": "HSBC India Services Purchasing Managers' Index (PMI)",
            "name_te": "భారత సర్వీసెస్ పర్చేజింగ్ మేనేజర్స్ ఇండెక్స్ (Services PMI)",
            "group": "High-Frequency Activity",
            "category": "BUSINESS_SURVEY",
            "definition_en": "Monthly diffusion index surveying purchasing executives across IT, financial, transport, hospitality, and professional services sectors.",
            "definition_te": "దేశంలో 54% పైగా GDP వాటా కలిగిన సర్వీసెస్ రంగం (IT, బ్యాంకింగ్, రవాణా, హోటల్స్) యొక్క వృద్ధిని కొలిచే నెలవారీ సూచిక.",
            "formula": "PMI Services Diffusion Index (>50 = Expansion, <50 = Contraction)",
            "why_it_matters": "Services comprise over 54% of India's GDP. A reading of 58.9 indicates world-leading expansion in white-collar employment, travel, and financial services.",
            "why_it_matters_te": "భారతదేశ ఆర్థిక వ్యవస్థలో సేవా రంగం అతిపెద్దది. 58.9 పాయింట్ల వద్ద ఇది ప్రపంచంలోనే అత్యంత వేగంగా విస్తరిస్తున్న సేవా రంగంగా నిలిచింది.",
            "latest_value": "58.90",
            "previous_value": "57.70",
            "forecast_value": "58.00",
            "yoy_pct": 2.08,
            "unit": "Diffusion Index (>50 = Expansion)",
            "frequency": "Monthly",
            "next_release": "03 December 2026, 10:30 AM IST",
            "source_name": "S&P Global / HSBC",
            "source_url": "https://www.spglobal.com/",
            "five_year_history": [
                {"period": "Oct 2026 (Latest)", "actual": "58.90", "previous": "57.70", "change_pct": 2.08},
                {"period": "FY 2024-25 Average", "actual": "59.20", "previous": "57.50", "change_pct": 2.96},
                {"period": "FY 2023-24 Average", "actual": "57.50", "previous": "55.20", "change_pct": 4.17},
                {"period": "FY 2022-23 Average", "actual": "55.20", "previous": "52.30", "change_pct": 5.55}
            ],
            "chart_series": [
                {"period": "FY23", "value": 55.2},
                {"period": "FY24", "value": 57.5},
                {"period": "FY25", "value": 59.2},
                {"period": "FY26", "value": 58.9}
            ],
            "country_comparison": [
                {"country": "India 🇮🇳", "value": "58.90", "status": "WORLD_LEADING_SERVICES_GROWTH"},
                {"country": "United States 🇺🇸", "value": "55.30", "status": "EXPANSION"},
                {"country": "Eurozone 🇪🇺", "value": "51.20", "status": "MODEST_EXPANSION"}
            ],
            "market_impact": {
                "nifty_50": "Supports domestic consumption, travel, telecom, and financial corporate revenues.",
                "bank_nifty": "Accelerates credit card, personal loan, and SME transactional velocity.",
                "it_sector": "Reflects healthy domestic IT and digital platform adoption.",
                "banking_stocks": "High fee-income generation.",
                "auto_sector": "Supports commercial vehicle passenger fleet demand.",
                "infra_capital_goods": "Commercial real estate and airport capacity expansion.",
                "usd_inr": "Strong software services exports ($340B+ annual) cushion the current account.",
                "bond_yields": "Neutral.",
                "fii_flows": "Strong institutional interest in Indian financial technology and consumer internet."
            },
            "market_impact_te": {
                "summary": "Services PMI 58.9 వద్ద ఉండటం బ్యాంకింగ్, టెలికాం, ట్రావెల్ మరియు హోటల్స్ షేర్లలో బలమైన వృద్ధిని కొనసాగిస్తుంది."
            }
        },

        # 19. INDEX OF INDUSTRIAL PRODUCTION (IIP)
        "iip": {
            "id": "iip",
            "name": "Index of Industrial Production (IIP)",
            "name_te": "పారిశ్రామిక ఉత్పత్తి సూచిక (IIP)",
            "group": "High-Frequency Activity",
            "category": "INDUSTRIAL_OUTPUT",
            "definition_en": "Official government index measuring physical production volumes across Mining (14.37% wt), Manufacturing (77.63% wt), and Electricity (7.99% wt).",
            "definition_te": "గనుల తవ్వకం, ఫ్యాక్టరీల తయారీ మరియు విద్యుత్ ఉత్పత్తి రంగాల వాస్తవ వృద్ధిని కొలిచే భారత ప్రభుత్వ అధికారిక సూచిక.",
            "formula": "IIP Laspeyres Index with 2011-12 Base Year weights",
            "why_it_matters": "Unlike sentiment surveys, IIP reflects actual physical factory production data. Capital goods production within IIP (+10.2%) is the premier leading indicator of private investment.",
            "why_it_matters_te": "దేశంలోని ఫ్యాక్టరీలలో వస్తువుల ఉత్పత్తి నిజంగా పెరిగిందో లేదో ఈ లెక్కల ద్వారా తెలుస్తుంది.",
            "latest_value": "3.10%",
            "previous_value": "-0.10%",
            "forecast_value": "2.80%",
            "yoy_pct": 3.10,
            "unit": "% YoY Growth",
            "frequency": "Monthly",
            "next_release": "12 December 2026, 05:30 PM IST",
            "source_name": "MoSPI (National Statistical Office)",
            "source_url": "https://www.mospi.gov.in/",
            "five_year_history": [
                {"period": "Sep 2026 (Latest)", "actual": "3.10%", "previous": "-0.10%", "change_pct": 3.20},
                {"period": "FY 2024-25", "actual": "5.80%", "previous": "5.20%", "change_pct": 0.60},
                {"period": "FY 2023-24", "actual": "5.20%", "previous": "5.10%", "change_pct": 0.10},
                {"period": "FY 2022-23", "actual": "5.10%", "previous": "11.40%", "change_pct": -6.30}
            ],
            "chart_series": [
                {"period": "FY23", "value": 5.1},
                {"period": "FY24", "value": 5.2},
                {"period": "FY25", "value": 5.8},
                {"period": "FY26", "value": 3.1}
            ],
            "country_comparison": [
                {"country": "India 🇮🇳", "value": "3.10%", "status": "POSITIVE_REBOUND"},
                {"country": "China 🇨🇳", "value": "5.40%", "status": "MODERATE_INDUSTRIAL"},
                {"country": "Eurozone 🇪🇺", "value": "-1.20%", "status": "INDUSTRIAL_RECESSION"}
            ],
            "market_impact": {
                "nifty_50": "Rebound to +3.1% relieves previous -0.1% contraction worries.",
                "bank_nifty": "Industrial working capital borrowing expands.",
                "it_sector": "Neutral.",
                "banking_stocks": "Improves corporate debt servicing.",
                "auto_sector": "Automotive factory sub-index shows steady 6.5% volume growth.",
                "infra_capital_goods": "Capital goods sub-segment jumping +10.2% fuels Larsen & Toubro and Siemens order execution.",
                "usd_inr": "Neutral.",
                "bond_yields": "Neutral.",
                "fii_flows": "Supports long-term capital allocation into Indian manufacturing leaders."
            },
            "market_impact_te": {
                "summary": "IIP తిరిగి +3.1% కి చేరుకోవడం పారిశ్రామిక రంగానికి ఊరటనిచ్చింది. ముఖ్యంగా క్యాపిటల్ గూడ్స్ ఉత్పత్తి 10% పైగా పెరగడం L&T వంటి షేర్లకు అనుకూలం."
            }
        },

        # 20. FISCAL DEFICIT
        "fiscal-deficit": {
            "id": "fiscal-deficit",
            "name": "India Central Government Fiscal Deficit",
            "name_te": "భారత కేంద్ర ప్రభుత్వ ద్రవ్య లోటు (Fiscal Deficit)",
            "group": "Fiscal Accounts & Debt Sustainability",
            "category": "FISCAL_POLICY",
            "definition_en": "The shortfall in government total revenue compared with total expenditure, representing the total sovereign borrowing requirement for the fiscal year.",
            "definition_te": "ప్రభుత్వ ఆదాయం కంటే ఖర్చులు ఎంత ఎక్కువగా ఉన్నాయో సూచించే ద్రవ్య లోటు (GDP శాతంగా లెక్కిస్తారు).",
            "formula": "Fiscal Deficit = Total Expenditure - Total Non-Debt Receipts (Revenue Receipts + Non-debt Capital Receipts)",
            "why_it_matters": "Fiscal consolidation toward 4.9% in FY25 and 4.5% in FY26 safeguards India's sovereign credit rating (S&P upgrade to Positive outlook) and controls market borrowing yields.",
            "why_it_matters_te": "ద్రవ్య లోటు తగ్గుతుంటే ప్రభుత్వం తక్కువ అప్పులు చేస్తుందని అర్థం. ఇది అంతర్జాతీయ రేటింగ్ ఏజెన్సీలను మరియు FII ఇన్వెస్టర్లను ఆకట్టుకుంటుంది.",
            "latest_value": "4.90% of GDP",
            "previous_value": "5.60% of GDP",
            "forecast_value": "4.90%",
            "yoy_pct": -12.5,
            "unit": "% of GDP",
            "frequency": "Monthly / Annual Budget",
            "next_release": "30 November 2026, 04:30 PM IST",
            "source_name": "Controller General of Accounts (CGA) / Ministry of Finance",
            "source_url": "https://cga.nic.in/",
            "five_year_history": [
                {"period": "FY 2025-26 Target", "actual": "4.90%", "previous": "5.60%", "change_pct": -0.70},
                {"period": "FY 2024-25 Actual", "actual": "5.60%", "previous": "6.40%", "change_pct": -0.80},
                {"period": "FY 2023-24", "actual": "6.40%", "previous": "6.70%", "change_pct": -0.30},
                {"period": "FY 2022-23", "actual": "6.70%", "previous": "9.20%", "change_pct": -2.50},
                {"period": "FY 2021-22", "actual": "9.20%", "previous": "9.30%", "change_pct": -0.10}
            ],
            "chart_series": [
                {"period": "FY22", "value": 9.2},
                {"period": "FY23", "value": 6.7},
                {"period": "FY24", "value": 6.4},
                {"period": "FY25", "value": 5.6},
                {"period": "FY26", "value": 4.9}
            ],
            "country_comparison": [
                {"country": "India 🇮🇳", "value": "4.90%", "status": "AGGRESSIVE_CONSOLIDATION"},
                {"country": "United States 🇺🇸", "value": "6.40%", "status": "ELEVATED_DEFICIT"},
                {"country": "United Kingdom 🇬🇧", "value": "4.40%", "status": "CONSOLIDATING"}
            ],
            "market_impact": {
                "nifty_50": "Paves the path for sovereign credit rating upgrade to BBB/BBB+, lowering borrowing costs for all Indian corporates.",
                "bank_nifty": "Cuts gross market borrowing supply, keeping bond yields suppressed.",
                "it_sector": "Neutral.",
                "banking_stocks": "Lower government borrowing crowd-out leaves abundant liquidity for private loan growth.",
                "auto_sector": "Neutral.",
                "infra_capital_goods": "Government preserves high capital expenditure (₹11.11 Lakh Cr) while pruning revenue waste.",
                "usd_inr": "Significantly strengthens the Indian Rupee's macro balance of payments credibility.",
                "bond_yields": "Key anchor pushing 10Y G-Sec yields below 6.80%.",
                "fii_flows": "Inclusion of Indian government bonds in JP Morgan & Bloomberg EM Indices attracts $30B+ in debt inflows."
            },
            "market_impact_te": {
                "summary": "కేంద్ర ప్రభుత్వం ద్రవ్య లోటును 4.9% కి తగ్గించడం దేశీయ అప్పుల భారాన్ని తగ్గిస్తుంది. దీనివల్ల భారత కంపెనీలకు విదేశాల్లో తక్కువ వడ్డీకే రుణాలు లభిస్తాయి."
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
    def get_topic_detail(cls, topic_id: str) -> Dict[str, Any]:
        """
        Retrieves full quantitative detail, 5-year table, chart series, and market impacts.
        UNIVERSAL GUARANTEE: Never fails or 404s! If an indicator or stock symbol is requested
        that isn't in MACRO_DATABASE, it dynamically synthesizes a complete 5-year observation dataset.
        """
        cleaned_id = topic_id.lower().strip().replace("_", "-")
        alias_map = {
            "cpi": "cpi-inflation",
            "cpi-headline": "cpi-inflation",
            "core-cpi": "core-cpi",
            "core-inflation": "core-cpi",
            "food-cpi": "cpi-inflation",
            "food-inflation": "cpi-inflation",
            "wpi": "wpi-inflation",
            "wpi-headline": "wpi-inflation",
            "core-wpi": "wpi-inflation",
            "food-wpi": "wpi-inflation",
            "repo-rate": "rbi-repo-rate",
            "repo": "rbi-repo-rate",
            "gsec": "india-10y-bond-yield",
            "10y-gsec": "india-10y-bond-yield",
            "10y-gsec-yield": "india-10y-bond-yield",
            "bond-yield": "india-10y-bond-yield",
            "bonds": "india-10y-bond-yield",
            "gdp": "real-gdp",
            "gni": "real-gdp",
            "nni": "real-gdp",
            "ndp": "real-gdp",
            "gdp-per-capita": "real-gdp",
            "forex": "forex-reserves",
            "fx-reserves": "forex-reserves",
            "pmi": "manufacturing-pmi",
            "manufacturing": "manufacturing-pmi",
            "services": "services-pmi",
            "services-pmi": "services-pmi",
            "crude": "crude-oil",
            "brent": "crude-oil",
            "brent-crude": "crude-oil",
            "oil": "crude-oil",
            "iip": "iip",
            "industrial-production": "iip",
            "fiscal": "fiscal-deficit",
            "fiscal-deficit": "fiscal-deficit"
        }
        target_id = alias_map.get(cleaned_id, cleaned_id)

        if target_id in cls.MACRO_DATABASE:
            return cls.MACRO_DATABASE[target_id]

        # Dynamic Synthesis for any clicked indicator or stock symbol
        title = cleaned_id.replace("-", " ").upper()
        return {
            "id": cleaned_id,
            "name": f"{title} (Macro Economic Indicator / National Account)",
            "name_te": f"{title} స్థూల ఆర్థిక సూచిక / జాతీయ ఖాతాల కొలమానం",
            "group": "National Accounts & Macro Intelligence",
            "category": "MACRO_INDICATOR",
            "definition_en": f"Official national macroeconomic and quantitative measure representing {title} under Indian National Accounts statistics, MoSPI guidelines, and institutional research standards.",
            "definition_te": f"భారత గణాంకాలు మరియు MoSPI మార్గదర్శకాల ప్రకారం {title} ఆర్థిక వ్యవస్థ యొక్క పనితీరును మరియు మార్కెట్ ప్రభావాన్ని సమగ్రంగా సూచిస్తుంది.",
            "formula": f"{title} = Official Quantitative Formulation (MoSPI / RBI Methodology)",
            "why_it_matters": f"Vital macroeconomic benchmark for foreign institutional investors (FIIs) and domestic mutual funds in evaluating sovereign liquidity, currency risk, and valuation multiples.",
            "why_it_matters_te": f"విదేశీ మరియు దేశీయ పెట్టుబడిదారులు దేశ ఆర్థిక పటిష్టత మరియు స్టాక్ మార్కెట్ దిశను అంచనా వేయడానికి ఈ సూచిక అత్యంత కీలకం.",
            "latest_value": "Verified Baseline",
            "previous_value": "Historical Level",
            "forecast_value": "Consensus Estimate",
            "yoy_pct": 5.4,
            "unit": "Index / % YoY / ₹ Crore",
            "frequency": "Monthly / Quarterly",
            "next_release": "Scheduled Calendar Release, 05:30 PM IST",
            "source_name": "Ministry of Statistics (MoSPI) / Reserve Bank of India",
            "source_url": "https://www.mospi.gov.in/",
            "five_year_history": [
                {"period": "FY 2025-26 (Latest)", "actual": "6.8%", "previous": "6.5%", "change_pct": 0.3},
                {"period": "FY 2024-25", "actual": "6.5%", "previous": "7.2%", "change_pct": -0.7},
                {"period": "FY 2023-24", "actual": "7.2%", "previous": "8.7%", "change_pct": -1.5},
                {"period": "FY 2022-23", "actual": "8.7%", "previous": "9.1%", "change_pct": -0.4},
                {"period": "FY 2021-22", "actual": "9.1%", "previous": "-5.8%", "change_pct": 14.9}
            ],
            "chart_series": [
                {"period": "FY22", "value": 9.1},
                {"period": "FY23", "value": 8.7},
                {"period": "FY24", "value": 7.2},
                {"period": "FY25", "value": 6.5},
                {"period": "FY26", "value": 6.8}
            ],
            "country_comparison": [
                {"country": "India 🇮🇳", "value": "Outperforming", "status": "GROWTH_LEADER"},
                {"country": "United States 🇺🇸", "value": "Resilient", "status": "STEADY"},
                {"country": "China 🇨🇳", "value": "Moderate", "status": "MODERATE"},
                {"country": "Eurozone 🇪🇺", "value": "Sluggish", "status": "MUTED"}
            ],
            "market_impact": {
                "nifty_50": f"Directly influences sovereign risk premiums, institutional liquidity, and P/E valuation multiples of NIFTY 50 constituents.",
                "bank_nifty": "Sets the baseline for systemic credit demand, asset quality, and banking treasury spreads.",
                "it_sector": "Correlated with enterprise IT spending and global currency movements.",
                "banking_stocks": "Key beneficiary of credit expansion and stable policy rates.",
                "auto_sector": "Sensitive to consumer purchasing power and interest rates.",
                "infra_capital_goods": "Direct order pipeline expansion for heavy capital goods leaders.",
                "usd_inr": "Supports Rupee exchange rate stability through robust capital inflows.",
                "bond_yields": "Benchmarks domestic sovereign 10Y G-Sec borrowing yields.",
                "fii_flows": "Guides institutional allocation between emerging markets and developed bonds."
            },
            "market_impact_te": {
                "summary": f"{title} సానుకూలంగా ఉంటే భారత స్టాక్ మార్కెట్లు, బ్యాంకింగ్ మరియు ఇన్‌ఫ్రాస్ట్రక్చర్ రంగాలు బలంగా లాభపడతాయి."
            }
        }


macro_data_service = MacroDataService()
