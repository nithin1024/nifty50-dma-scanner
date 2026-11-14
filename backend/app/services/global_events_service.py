"""
Global Economic & Worldwide Events Calendar Service.
Institutional macroeconomic intelligence engine tracking scheduled events across:
India, United States, Eurozone, United Kingdom, Japan, China, Australia, Canada, and Global markets.
Complete bilingual English + Telugu explanations and India-first market impact analysis.
"""

from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional
import json
import logging
from app.database.session import SessionLocal
from app.models.global_event import GlobalEventModel, EventUpdateHistoryModel, UserEventPreferenceModel
from app.services.timezone_service import (
    convert_local_to_utc_and_ist,
    compute_live_countdown,
    calculate_surprise
)

logger = logging.getLogger("global_events_service")


# Master seed of institutional worldwide scheduled events
# All timestamps are calculated with timezone_service to ensure exact IST and DST precision
MASTER_GLOBAL_EVENTS: List[Dict[str, Any]] = [
    # 1. UNITED STATES — CPI INFLATION
    {
        "id": "evt_us_cpi_202611",
        "event_name": "US Consumer Price Index (CPI) YoY",
        "event_name_te": "అమెరికా వినియోగదారుల ధరల సూచిక (CPI) వార్షిక నివేదిక",
        "country": "United States",
        "country_code": "US",
        "country_flag": "🇺🇸",
        "category": "ECONOMIC_DATA",
        "year": 2026, "month": 11, "day": 18, "hour": 8, "minute": 30,
        "original_timezone": "America/New_York",
        "importance": "HIGH",
        "currency": "USD",
        "previous_value": "2.4%",
        "forecast_value": "2.6%",
        "actual_value": "Not yet released",
        "revision_value": None,
        "source_name": "U.S. Bureau of Labor Statistics (BLS)",
        "source_url": "https://www.bls.gov/cpi/",
        "description_en": (
            "The Consumer Price Index (CPI) measures the average change over time in the prices paid by urban "
            "consumers for a representative basket of consumer goods and services including shelter, food, energy, and transportation."
        ),
        "description_te": (
            "వినియోగదారుల ధరల సూచిక (CPI) అనేది పట్టణ వినియోగదారులు ఆహారం, ఇంధనం, నివాసం మరియు రవాణా వంటి రోజువారీ వస్తువులు, "
            "సేవల కోసం చెల్లించే సగటు ధరల పెరుగుదలను లేదా తరుగుదలను కొలిచే ప్రధాన సూచిక."
        ),
        "why_it_matters_en": (
            "CPI is the primary headline metric monitored by global bond markets and the Federal Reserve to gauge inflation trajectory. "
            "A higher-than-expected reading triggers concerns of higher-for-longer interest rates, boosting the US Dollar and Treasury yields."
        ),
        "why_it_matters_te": (
            "అమెరికా ఫెడరల్ రిజర్వ్ ద్రవ్య విధానానికి ఇది అత్యంత కీలకమైనది. ద్రవ్యోల్బణం అంచనాల కంటే ఎక్కువగా వస్తే, వడ్డీ రేట్లను ఎక్కువకాలం "
            "గరిష్ట స్థాయిలో ఉంచుతారనే భయాలు పెరుగుతాయి. ఇది US డాలర్ మరియు US ట్రెజరీ బాండ్ల రాబడిని పెంచుతుంది."
        ),
        "india_market_impact_en": (
            "High US inflation leads to foreign capital outflows (FII selling) from emerging markets including India, puts depreciation "
            "pressure on USD/INR, and negatively impacts rate-sensitive sectors like NIFTY Bank and Auto. Tech/IT stocks face headwinds due to US corporate IT budget cuts."
        ),
        "india_market_impact_te": (
            "భారత మార్కెట్ ప్రభావం: US ద్రవ్యోల్బణం పెరిగితే FIIలు భారత స్టాక్ మార్కెట్ నుండి నిధులను ఉపసంహరించుకునే (Selling) అవకాశం ఉంది. "
            "దీనివల్ల USD/INR బలహీనపడి రూపాయి విలువ తగ్గుతుంది. NIFTY 50, బ్యాంక్ నిఫ్టీ ఒత్తిడికి గురవుతాయి మరియు US వ్యయాల తగ్గుదల వల్ల IT స్టాక్స్ ప్రభావితమవుతాయి."
        ),
        "key_terms": [
            {"term": "Headline CPI", "term_te": "హెడ్‌లైన్ CPI", "def_en": "Total inflation including volatile food and energy components.", "def_te": "ఆహారం మరియు ఇంధన ధరలతో కూడిన మొత్తం ద్రవ్యోల్బణం."},
            {"term": "Core CPI", "term_te": "కోర్ CPI", "def_en": "Inflation excluding volatile food and energy, showing structural price trends.", "def_te": "ఆహారం మరియు ఇంధనం మినహాయించిన స్థిరమైన ద్రవ్యోల్బణం."},
            {"term": "FII Capital Outflow", "term_te": "FII విదేశీ నిధుల ఉపసంహరణ", "def_en": "Foreign institutional investors selling domestic equities to reallocate into risk-free US treasuries.", "def_te": "విదేశీ సంస్థాగత పెట్టుబడిదారులు భారత మార్కెట్లో అమ్మి సురక్షితమైన US బాండ్లలోకి పెట్టుబడులు మార్చడం."}
        ]
    },

    # 2. INDIA — RBI MONETARY POLICY COMMITTEE (MPC) MEETING
    {
        "id": "evt_rbi_mpc_202612",
        "event_name": "RBI Monetary Policy Committee (MPC) Interest Rate Decision",
        "event_name_te": "భారత రిజర్వ్ బ్యాంక్ (RBI) ద్రవ్య విధాన కమిటీ (MPC) వడ్డీ రేటు నిర్ణయం",
        "country": "India",
        "country_code": "IN",
        "country_flag": "🇮🇳",
        "category": "CENTRAL_BANK",
        "year": 2026, "month": 12, "day": 6, "hour": 10, "minute": 0,
        "original_timezone": "Asia/Kolkata",
        "importance": "HIGH",
        "currency": "INR",
        "previous_value": "6.50%",
        "forecast_value": "6.50%",
        "actual_value": "Not yet released",
        "revision_value": None,
        "source_name": "Reserve Bank of India (RBI)",
        "source_url": "https://www.rbi.org.in/",
        "description_en": (
            "The 6-member Monetary Policy Committee (MPC) headed by the RBI Governor reviews domestic economic growth, "
            "liquidity conditions, and retail inflation (CPI) to announce the policy Repo Rate, Standing Deposit Facility (SDF), and monetary stance."
        ),
        "description_te": (
            "RBI గవర్నర్ నేతృత్వంలోని 6 మంది సభ్యుల MPC కమిటీ దేశీయ ఆర్థిక వృద్ధి, లిక్విడిటీ పరిస్థితులు మరియు రిటైల్ ద్రవ్యోల్బణాన్ని సమీక్షించి "
            "పాలసీ రెపో రేటు (Repo Rate) మరియు ద్రవ్య విధాన వైఖరిని (Policy Stance) నిర్ణయిస్తుంది."
        ),
        "why_it_matters_en": (
            "The Repo Rate directly determines commercial bank lending and borrowing costs (home loans, car loans, working capital) throughout India. "
            "A rate cut injects liquidity and spurs consumer spending, whereas a hawkish pause sustains higher credit costs."
        ),
        "why_it_matters_te": (
            "రెపో రేటు భారతదేశంలోని అన్ని వాణిజ్య బ్యాంకుల హోమ్ లోన్, కార్ లోన్ మరియు కార్పొరేట్ రుణాల వడ్డీ రేట్లను నేరుగా నిర్దేశిస్తుంది. "
            "రేటు తగ్గితే రుణగ్రహీతలకు EMI భారం తగ్గి కొనుగోలు శక్తి పెరుగుతుంది."
        ),
        "india_market_impact_en": (
            "The highest-impact single domestic event for Indian equities. A dovish stance or repo rate cut directly fuels rallies in "
            "Bank Nifty (HDFCBANK, ICICIBANK, SBIN), Real Estate (DLF, Godrej), Automobiles (Tata Motors, M&M), and infrastructure companies with high borrowing."
        ),
        "india_market_impact_te": (
            "భారత స్టాక్ మార్కెట్ ప్రభావం: ఇది దేశీయ మార్కెట్లకు అత్యంత కీలకమైన ఈవెంట్. రేటు తగ్గింపు లేదా డోవిష్ (సరళమైన) వైఖరి ప్రకటిస్తే "
            "బ్యాంక్ నిఫ్టీ (HDFCBANK, ICICIBANK, SBIN), రియల్ ఎస్టేట్, మరియు ఆటోమొబైల్ రంగాలు భారీగా ర్యాలీ చేస్తాయి."
        ),
        "key_terms": [
            {"term": "Repo Rate", "term_te": "రెపో రేటు", "def_en": "Rate at which commercial banks borrow short-term funds from RBI against government securities.", "def_te": "వాణిజ్య బ్యాంకులు ప్రభుత్వ సెక్యూరిటీలను తనఖా పెట్టి RBI నుండి స్వల్పకాలిక రుణాలు తీసుకునే వడ్డీ రేటు."},
            {"term": "Dovish Stance", "term_te": "డోవిష్ వైఖరి", "def_en": "Policy bias favoring economic growth through lower interest rates.", "def_te": "ఆర్థిక వృద్ధికి మద్దతుగా వడ్డీ రేట్లను తగ్గించే లేదా స్థిరంగా ఉంచే అనుకూల వైఖరి."},
            {"term": "Hawkish Stance", "term_te": "హాకిష్ వైఖరి", "def_en": "Policy bias prioritizing inflation containment through higher interest rates.", "def_te": "ద్రవ్యోల్బణాన్ని అదుపు చేయడానికి వడ్డీ రేట్లను పెంచే కఠిన వైఖరి."}
        ]
    },

    # 3. UNITED STATES — FEDERAL RESERVE FOMC RATE DECISION
    {
        "id": "evt_us_fomc_202612",
        "event_name": "US Federal Reserve FOMC Interest Rate Decision & Powell Press Conference",
        "event_name_te": "అమెరికా ఫెడరల్ రిజర్వ్ (FOMC) వడ్డీ రేటు నిర్ణయం & పావెల్ ప్రెస్ కాన్ఫరెన్స్",
        "country": "United States",
        "country_code": "US",
        "country_flag": "🇺🇸",
        "category": "CENTRAL_BANK",
        "year": 2026, "month": 12, "day": 16, "hour": 14, "minute": 0,
        "original_timezone": "America/New_York",
        "importance": "HIGH",
        "currency": "USD",
        "previous_value": "4.75% - 5.00%",
        "forecast_value": "4.50% - 4.75%",
        "actual_value": "Not yet released",
        "revision_value": None,
        "source_name": "Federal Reserve System",
        "source_url": "https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm",
        "description_en": (
            "The Federal Open Market Committee (FOMC) announces its target benchmark federal funds rate corridor, "
            "releases its Summary of Economic Projections (Dot Plot), followed 30 minutes later by Fed Chair Jerome Powell's live press conference."
        ),
        "description_te": (
            "ఫెడరల్ ఓపెన్ మార్కెట్ కమిటీ (FOMC) తన కీలక ఫెడరల్ ఫండ్స్ వడ్డీ రేటును ప్రకటిస్తుంది. ఆర్థిక అంచనాల సారాంశం (డాట్ ప్లాట్) విడుదల చేయడంతో పాటు, "
            "ఫెడ్ చైర్మన్ జెరోమ్ పావెల్ ప్రత్యక్ష మీడియా సమావేశంలో రాబోయే పాలసీ దిశను వివరిస్తారు."
        ),
        "why_it_matters_en": (
            "The Federal Funds Rate is the cost of borrowing global reserve currency. Changes dictate worldwide asset allocations, "
            "dollar strength, sovereign debt yields, commodities pricing, and emerging market currency valuations."
        ),
        "why_it_matters_te": (
            "ప్రపంచ రిజర్వ్ కరెన్సీ అయిన US డాలర్ వడ్డీ రేటును ఇది నిర్ణయిస్తుంది. దీని ఆధారంగా ప్రపంచవ్యాప్తంగా పెట్టుబడుల ప్రవాహం, బాండ్ల రాబడి, "
            "బంగారం, క్రూడ్ ఆయిల్ ధరలు మరియు వర్ధమాన మార్కెట్ల కరెన్సీల విలువ మారుతుంది."
        ),
        "india_market_impact_en": (
            "Global risk sentiment pivot. Rate cuts in the US narrow the yield differential, spur risk-on emerging market inflows into Indian equities, "
            "benefit NIFTY IT (due to US enterprise capex recovery), and strengthen the Indian Rupee against the Dollar."
        ),
        "india_market_impact_te": (
            "భారత మార్కెట్ ప్రభావం: అమెరికాలో వడ్డీ రేట్లు తగ్గితే గ్లోబల్ మార్కెట్లలో ఉత్సాహం పెరుగుతుంది. విదేశీ సంస్థాగత పెట్టుబడులు (FII) భారత మార్కెట్లలోకి "
            "భారీగా వస్తాయి. రూపాయి బలపడుతుంది మరియు US కార్పొరేట్ వ్యయం పెరగడం వల్ల NIFTY IT స్టాక్స్ (TCS, INFY, HCLTECH) పుంజుకుంటాయి."
        ),
        "key_terms": [
            {"term": "Fed Funds Rate", "term_te": "ఫెడ్ ఫండ్స్ రేటు", "def_en": "Target overnight interest rate set by the Federal Reserve.", "def_te": "అమెరికా ఫెడరల్ రిజర్వ్ నిర్ణయించే ప్రామాణిక రాత్రిపూట వడ్డీ రేటు."},
            {"term": "Dot Plot", "term_te": "డాట్ ప్లాట్", "def_en": "Chart showing Fed officials' individual forecasts for future interest rates.", "def_te": "ఫెడ్ అధికారులు రాబోయే సంవత్సరాల్లో వడ్డీ రేట్లు ఎక్కడ ఉండవచ్చో సూచించే అంచనాల చార్ట్."},
            {"term": "Risk-On / Risk-Off", "term_te": "రిస్క్-ఆన్ / రిస్క్-ఆఫ్", "def_en": "Market regime where investors embrace emerging market equities (Risk-On) vs safe-haven US assets (Risk-Off).", "def_te": "పెట్టుబడిదారులు భారత మార్కెట్లలో కొనుగోళ్లు చేయడం (Risk-On) లేదా భయంతో సురక్షిత US బాండ్లలోకి వెళ్లడం (Risk-Off)."}
        ]
    },

    # 4. INDIA — CPI INFLATION & INDUSTRIAL PRODUCTION (IIP)
    {
        "id": "evt_in_cpi_202611",
        "event_name": "India Retail Inflation (CPI) YoY & Industrial Production (IIP)",
        "event_name_te": "భారత రిటైల్ ద్రవ్యోల్బణం (CPI) & పారిశ్రామిక ఉత్పత్తి (IIP)",
        "country": "India",
        "country_code": "IN",
        "country_flag": "🇮🇳",
        "category": "ECONOMIC_DATA",
        "year": 2026, "month": 11, "day": 12, "hour": 17, "minute": 30,
        "original_timezone": "Asia/Kolkata",
        "importance": "HIGH",
        "currency": "INR",
        "previous_value": "5.49%",
        "forecast_value": "5.80%",
        "actual_value": "6.21%",
        "revision_value": None,
        "source_name": "Ministry of Statistics and Programme Implementation (MOSPI)",
        "source_url": "https://www.mospi.gov.in/",
        "description_en": (
            "Monthly Consumer Price Index (Base 2012=100) reflecting rural and urban consumer basket changes across Food & Beverages, "
            "Housing, Fuel & Light, Clothing, and Miscellaneous goods."
        ),
        "description_te": (
            "భారతదేశంలో గ్రామీణ మరియు పట్టణ వినియోగదారుల ఆహార పదార్థాలు, గృహ నిర్మాణం, ఇంధనం, వస్త్రాలు తదితర నిత్యావసరాల ధరల మార్పులను తెలియజేసే అధికారిక నివేదిక."
        ),
        "why_it_matters_en": (
            "RBI operates under a statutory mandate to target 4.0% CPI with a +/- 2.0% tolerance band (2.0% to 6.0%). A breach above 6.0% "
            "restricts RBI from easing monetary policy and raises stagflation concerns."
        ),
        "why_it_matters_te": (
            "RBI చట్టబద్ధమైన నిబంధనల ప్రకారం ద్రవ్యోల్బణం 4.0% (+/- 2%) పరిధిలో ఉండాలి. ఇది 6.0% దాటితే RBI వడ్డీ రేట్లను తగ్గించే అవకాశం ఉండదు."
        ),
        "india_market_impact_en": (
            "Direct domestic equity shock. A print above 6.0% delays RBI rate cuts, pushes 10-year Indian G-Sec bond yields higher, "
            "dampens consumer discretionary (FMCG) margins, and creates short-term correction risk for NIFTY 50."
        ),
        "india_market_impact_te": (
            "భారత మార్కెట్ ప్రభావం: ద్రవ్యోల్బణం 6% పైకి చేరితే RBI వడ్డీ రేట్ల తగ్గింపు వాయిదా పడుతుంది. ప్రభుత్వ బాండ్ల రాబడి పెరిగి, "
            "FMCG మరియు బ్యాంకింగ్ షేర్లపై ఒత్తిడి వస్తుంది. NIFTY 50 స్వల్పకాలిక దిద్దుబాటు (Correction) కు గురవుతుంది."
        ),
        "key_terms": [
            {"term": "RBI Tolerance Band", "term_te": "RBI సహన పరిమితి", "def_en": "Statutory inflation target corridor of 2% to 6% with 4% midpoint.", "def_te": "భారత ప్రభుత్వం నిర్ణయించిన 4% ద్రవ్యోల్బణ లక్ష్యం (కనిష్ట 2% - గరిష్ట 6%)."},
            {"term": "Food Inflation", "term_te": "ఆహార ద్రవ్యోల్బణం", "def_en": "Constitutes ~46% of Indian CPI basket; vegetable spikes trigger headline inflation surges.", "def_te": "భారత CPI సూచీలో దాదాపు 46% వాటా కలిగిన కూరగాయలు, తృణధాన్యాల ధరల పెరుగుదల."}
        ]
    },

    # 5. UNITED STATES — NON-FARM PAYROLLS & UNEMPLOYMENT
    {
        "id": "evt_us_nfp_202612",
        "event_name": "US Non-Farm Payrolls (NFP) & Unemployment Rate",
        "event_name_te": "అమెరికా నాన్-ఫార్మ్ పేరోల్స్ (ఉపాధి కల్పన) & నిరుద్యోగిత రేటు",
        "country": "United States",
        "country_code": "US",
        "country_flag": "🇺🇸",
        "category": "ECONOMIC_DATA",
        "year": 2026, "month": 12, "day": 4, "hour": 8, "minute": 30,
        "original_timezone": "America/New_York",
        "importance": "HIGH",
        "currency": "USD",
        "previous_value": "12K",
        "forecast_value": "200K",
        "actual_value": "Not yet released",
        "revision_value": None,
        "source_name": "U.S. Bureau of Labor Statistics (BLS)",
        "source_url": "https://www.bls.gov/news.release/empsit.nr0.htm",
        "description_en": (
            "Measures the net change in the number of paid workers in the US during the prior month, excluding farm workers, "
            "private household employees, and non-profit organization employees, alongside the headline Unemployment Rate."
        ),
        "description_te": (
            "వ్యవసాయేతర రంగాలలో అమెరికా ఆర్థిక వ్యవస్థలో కొత్తగా చేరిన ఉద్యోగుల నికర సంఖ్య మరియు అధికారిక నిరుద్యోగిత రేటును ఈ నివేదిక తెలియజేస్తుంది."
        ),
        "why_it_matters_en": (
            "The paramount monthly health check of the world's largest economy. Robust job growth fuels wage inflation, while sharp "
            "employment slowdowns indicate recession risks and force rapid central bank rate cuts."
        ),
        "why_it_matters_te": (
            "ప్రపంచంలోనే అతిపెద్ద ఆర్థిక వ్యవస్థ యొక్క ఉద్యోగ మార్కెట్ ఆరోగ్యాన్ని ఇది తెలియజేస్తుంది. ఉద్యోగాలు తగ్గితే ఆర్థిక మాంద్యం భయాలు మొదలవుతాయి."
        ),
        "india_market_impact_en": (
            "Dictates Wall Street opening trajectory which drives next-day Asian market sentiment. Moderate job growth is ideal for NIFTY 50 "
            "(Goldilocks scenario); extreme weakness triggers global recession sell-offs."
        ),
        "india_market_impact_te": (
            "భారత మార్కెట్ ప్రభావం: ఈ నివేదిక ఆధారంగా వాల్ స్ట్రీట్ మరియు మరుసటి రోజు ఆసియా మార్కెట్ల దిశ ఆధారపడి ఉంటుంది. "
            "సమతుల్య ఉద్యోగ వృద్ధి భారత మార్కెట్లకు అత్యంత అనుకూలం."
        ),
        "key_terms": [
            {"term": "Goldilocks Economy", "term_te": "గోల్డిలాక్స్ ఆర్థిక వ్యవస్థ", "def_en": "An economy that is not too hot (causing inflation) nor too cold (causing recession).", "def_te": "ద్రవ్యోల్బణం అధికం కాకుండా, మాంద్యం రాకుండా స్థిరంగా సాగే అనుకూల ఆర్థిక పరిస్థితి."}
        ]
    },

    # 6. GLOBAL / OPEC+ — OIL PRODUCTION QUOTA MEETING
    {
        "id": "evt_opec_meeting_202612",
        "event_name": "OPEC+ Ministerial Meeting & Crude Oil Production Quota Decision",
        "event_name_te": "OPEC+ మంత్రుల సమావేశం & ముడి చమురు ఉత్పత్తి కోటా నిర్ణయం",
        "country": "Global",
        "country_code": "GLOBAL",
        "country_flag": "🌐",
        "category": "COMMODITIES_ENERGY",
        "year": 2026, "month": 12, "day": 1, "hour": 12, "minute": 0,
        "original_timezone": "Europe/Vienna",
        "importance": "HIGH",
        "currency": "USD",
        "previous_value": "Voluntary cuts 2.2M bpd",
        "forecast_value": "Extension of voluntary cuts",
        "actual_value": "Not yet released",
        "revision_value": None,
        "source_name": "Organization of the Petroleum Exporting Countries (OPEC)",
        "source_url": "https://www.opec.org/",
        "description_en": (
            "Biannual or emergency policy gathering of OPEC nations and non-OPEC allies (including Saudi Arabia and Russia) "
            "to establish binding collective daily crude oil production quotas and voluntary output reductions."
        ),
        "description_te": (
            "సౌదీ అరేబియా, రష్యాతో సహా చమురు ఎగుమతి దేశాలు (OPEC+) సమావేశమై ప్రపంచవ్యాప్తంగా రోజువారీ క్రూడ్ ఆయిల్ ఉత్పత్తి కోటాలను నిర్ణయిస్తాయి."
        ),
        "why_it_matters_en": (
            "Crude oil is the fundamental energy benchmark driving global logistics, refining margins, and headline transportation inflation worldwide."
        ),
        "why_it_matters_te": (
            "ముడి చమురు ధరలు ప్రపంచ లాజిస్టిక్స్, రవాణా ఖర్చులు మరియు రసాయన ఉత్పత్తుల ధరలను నిర్ణయిస్తాయి."
        ),
        "india_market_impact_en": (
            "Critical macro sensitivity for India, which imports over 85% of its crude oil requirements. Every $10/barrel rise in Brent crude "
            "widens India's current account deficit by ~$10 Billion, depresses Rupee value, and pressures oil marketing companies (BPCL, IOC, HPCL), "
            "paints (Asian Paints), and airline stocks (InterGlobe Aviation)."
        ),
        "india_market_impact_te": (
            "భారత మార్కెట్ ప్రభావం: భారతదేశం తన చమురు అవసరాలలో 85% పైగా దిగుమతి చేసుకుంటుంది. బ్రెంట్ క్రూడ్ బ్యారెల్ ధర $10 పెరిగితే భారత కరెంట్ ఖాతా లోటు "
            "సుమారు $10 బిలియన్లు పెరుగుతుంది. రూపాయి పడిపోతుంది; పెయింట్స్ (Asian Paints), టైర్లు, విమానయాన మరియు చమురు మార్కెటింగ్ కంపెనీల లాభాలు తగ్గుతాయి."
        ),
        "key_terms": [
            {"term": "Current Account Deficit (CAD)", "term_te": "కరెంట్ ఖాతా లోటు (CAD)", "def_en": "Net shortfall when the value of imported goods and services exceeds exports.", "def_te": "దేశం ఎగుమతి చేసే విలువల కంటే దిగుమతి చేసుకునే విలువ ఎక్కువగా ఉన్నప్పుడు ఏర్పడే నికర లోటు."},
            {"term": "Brent Crude", "term_te": "బ్రెంట్ క్రూడ్", "def_en": "International benchmark grade of crude oil extracted from the North Sea.", "def_te": "భారతదేశం దిగుమతి చేసుకునే చమురు ధరలకు అంతర్జాతీయ ప్రామాణికం."}
        ]
    },

    # 7. EUROZONE — ECB INTEREST RATE DECISION
    {
        "id": "evt_eu_ecb_202612",
        "event_name": "European Central Bank (ECB) Interest Rate Decision & Lagarde Briefing",
        "event_name_te": "యూరోపియన్ సెంట్రల్ బ్యాంక్ (ECB) వడ్డీ రేటు నిర్ణయం & లగార్డ్ ప్రెస్ మీట్",
        "country": "Eurozone",
        "country_code": "EU",
        "country_flag": "🇪🇺",
        "category": "CENTRAL_BANK",
        "year": 2026, "month": 12, "day": 12, "hour": 14, "minute": 15,
        "original_timezone": "Europe/Berlin",
        "importance": "HIGH",
        "currency": "EUR",
        "previous_value": "3.25%",
        "forecast_value": "3.00%",
        "actual_value": "Not yet released",
        "revision_value": None,
        "source_name": "European Central Bank",
        "source_url": "https://www.ecb.europa.eu/",
        "description_en": (
            "The Governing Council of the ECB sets the deposit facility rate, main refinancing operations rate, and marginal lending facility rate "
            "for the 20 European Union nations that share the Euro currency."
        ),
        "description_te": (
            "యూరో కరెన్సీని ఉపయోగించే 20 యూరోపియన్ దేశాల కోసం ECB గవర్నింగ్ కౌన్సిల్ డిపాజిట్ మరియు రీఫైనాన్సింగ్ వడ్డీ రేట్లను నిర్ణయిస్తుంది."
        ),
        "why_it_matters_en": (
            "The Euro is the second largest global reserve currency. ECB policy shifts drive EUR/USD currency pairs and European sovereign debt yields."
        ),
        "why_it_matters_te": (
            "యూరో ప్రపంచంలో రెండవ అతిపెద్ద రిజర్వ్ కరెన్సీ. ECB తీసుకునే నిర్ణయాలు యూరో-డాలర్ మారకం రేటును మరియు ప్రపంచ ద్రవ్య సరఫరాను ప్రభావితం చేస్తాయి."
        ),
        "india_market_impact_en": (
            "European rate cuts stimulate European economic demand, benefiting Indian exporters to Europe including Tata Steel, Motherson Sumi, "
            "textiles, and IT services firms with large European banking clients."
        ),
        "india_market_impact_te": (
            "భారత మార్కెట్ ప్రభావం: యూరప్‌లో వడ్డీ రేట్లు తగ్గితే అక్కడ వినియోగం పుంజుకుంటుంది. దీనివల్ల యూరప్‌కు ఎగుమతులు చేసే భారత కంపెనీలు "
            "(టాటా స్టీల్, ఆటో విడిభాగాలు, టెక్స్‌టైల్స్ మరియు యూరోపియన్ బ్యాంకింగ్ క్లయింట్లు ఉన్న IT సంస్థలు) లాభపడతాయి."
        ),
        "key_terms": [
            {"term": "Deposit Facility Rate", "term_te": "డిపాజిట్ ఫెసిలిటీ రేటు", "def_en": "Rate banks receive for overnight deposits with the ECB.", "def_te": "వాణిజ్య బ్యాంకులు ECB వద్ద ఉంచే నిధులపై పొందే వడ్డీ రేటు."}
        ]
    },

    # 8. CHINA — NBS MANUFACTURING & SERVICES PMI
    {
        "id": "evt_cn_pmi_202611",
        "event_name": "China Official NBS Manufacturing & Services PMI",
        "event_name_te": "చైనా అధికారిక NBS తయారీ మరియు సేవల రంగాల PMI నివేదిక",
        "country": "China",
        "country_code": "CN",
        "country_flag": "🇨🇳",
        "category": "ECONOMIC_DATA",
        "year": 2026, "month": 11, "day": 30, "hour": 9, "minute": 30,
        "original_timezone": "Asia/Shanghai",
        "importance": "HIGH",
        "currency": "CNY",
        "previous_value": "50.1",
        "forecast_value": "50.3",
        "actual_value": "Not yet released",
        "revision_value": None,
        "source_name": "National Bureau of Statistics China (NBS)",
        "source_url": "http://www.stats.gov.cn/english/",
        "description_en": (
            "Monthly survey of purchasing managers across Chinese state-owned and large industrial enterprises. A reading above 50 indicates "
            "expansion in manufacturing activity, while below 50 indicates economic contraction."
        ),
        "description_te": (
            "ప్రపంచ తయారీ కర్మాగారమైన చైనాలోని భారీ పరిశ్రమల పనితీరును తెలియజేసే పర్చేజింగ్ మేనేజర్స్ ఇండెక్స్ (PMI). 50 కంటే ఎక్కువ ఉంటే వృద్ధిని, "
            "50 కంటే తక్కువ ఉంటే సంక్షోభాన్ని సూచిస్తుంది."
        ),
        "why_it_matters_en": (
            "China consumes over 50% of the world's industrial metals (copper, steel, iron ore, aluminium). Strong factory output drives global commodity super-cycles."
        ),
        "why_it_matters_te": (
            "ప్రపంచవ్యాప్తంగా ఉత్పత్తి అయ్యే పారిశ్రామిక లోహాలలో (రాగి, ఉక్కు, అల్యూమినియం) 50% కంటే ఎక్కువ చైనానే వినియోగిస్తుంది. అక్కడ డిమాండ్ పెరిగితే మెటల్ షేర్లు పెరుగుతాయి."
        ),
        "india_market_impact_en": (
            "Direct bellwether for the NIFTY Metal Index. Strong Chinese PMI rallies Indian metal producers (Tata Steel, JSW Steel, Hindalco, Vedanta), "
            "whereas weak data leads to Chinese metal dumping in international markets, compressing domestic steel realization."
        ),
        "india_market_impact_te": (
            "భారత మార్కెట్ ప్రభావం: NIFTY మెటల్ రంగానికి ఇది అత్యంత ముఖ్యం. చైనాలో తయారీ పెరిగితే టాటా స్టీల్, JSW స్టీల్, హిండాల్కో, వేదాంత షేర్లు లాభపడతాయి. "
            "చైనాలో డిమాండ్ తగ్గితే ఆ దేశం తక్కువ ధరకే ప్రపంచ మార్కెట్లో స్టీల్ డంపింగ్ చేయడం వల్ల భారత కంపెనీల మార్జిన్లు దెబ్బతింటాయి."
        ),
        "key_terms": [
            {"term": "PMI 50 Threshold", "term_te": "PMI 50 ప్రామాణిక విభజన", "def_en": "50.0 marks the dividing line between economic expansion and contraction.", "def_te": "50 పాయింట్లు ఆర్థిక విస్తరణ మరియు క్షీణత మధ్య సరిహద్దు గీతగా పనిచేస్తుంది."}
        ]
    },

    # 9. JAPAN — BANK OF JAPAN (BOJ) MONETARY POLICY
    {
        "id": "evt_jp_boj_202612",
        "event_name": "Bank of Japan (BOJ) Interest Rate Decision & Monetary Outlook",
        "event_name_te": "బ్యాంక్ ఆఫ్ జపాన్ (BOJ) వడ్డీ రేటు నిర్ణయం & ద్రవ్య విధాన నివేదిక",
        "country": "Japan",
        "country_code": "JP",
        "country_flag": "🇯🇵",
        "category": "CENTRAL_BANK",
        "year": 2026, "month": 12, "day": 19, "hour": 12, "minute": 0,
        "original_timezone": "Asia/Tokyo",
        "importance": "HIGH",
        "currency": "JPY",
        "previous_value": "0.25%",
        "forecast_value": "0.50%",
        "actual_value": "Not yet released",
        "revision_value": None,
        "source_name": "Bank of Japan",
        "source_url": "https://www.boj.or.jp/en/",
        "description_en": (
            "Policy board decision by the Bank of Japan concerning the uncollateralized overnight call rate, quantitative asset purchases, "
            "and government bond yield flexibility, followed by Governor Kazuo Ueda's press conference."
        ),
        "description_te": (
            "బ్యాంక్ ఆఫ్ జపాన్ తన స్వల్పకాలిక వడ్డీ రేట్లు మరియు ప్రభుత్వ బాండ్ల దిగుబడిపై తీసుకునే కీలక పాలసీ నిర్ణయం."
        ),
        "why_it_matters_en": (
            "Japan was the world's cheapest capital supplier for decades. Hikes in Japanese rates trigger the massive unwinding of global 'Yen Carry Trades', "
            "causing sudden worldwide liquidity drains and global stock market volatility."
        ),
        "why_it_matters_te": (
            "ప్రపంచ పెట్టుబడిదారులు జపాన్ నుండి చౌకగా రుణాలు తీసుకుని ఇతర దేశాల స్టాక్ మార్కెట్లలో పెట్టుబడులు పెట్టే 'యెన్ క్యారీ ట్రేడ్' దీనిపై ఆధారపడి ఉంటుంది. "
            "జపాన్ రేట్లు పెంచితే ప్రపంచవ్యాప్తంగా నిధుల ఉపసంహరణ జరిగి మార్కెట్లలో భారీ పతనం రావచ్చు."
        ),
        "india_market_impact_en": (
            "Yen carry trade unwinding creates sharp flash-crash episodes in global equities that ripple directly into NIFTY 50 and Bank Nifty, "
            "as global hedge funds rapidly liquidate emerging-market positions to cover Yen borrowing liabilities."
        ),
        "india_market_impact_te": (
            "భారత మార్కెట్ ప్రభావం: జపాన్ వడ్డీ రేట్లు పెంచినప్పుడు గ్లోబల్ హెడ్జ్ ఫండ్స్ తమ పెట్టుబడులను హడావిడిగా విక్రయించి జపాన్ అప్పులు చెల్లించాల్సి వస్తుంది. "
            "దీనివల్ల NIFTY 50 మరియు బ్యాంక్ నిఫ్టీలో అకస్మాత్తుగా తీవ్ర ఒడిదుడుకులు (Volatility) సంభవిస్తాయి."
        ),
        "key_terms": [
            {"term": "Yen Carry Trade", "term_te": "యెన్ క్యారీ ట్రేడ్", "def_en": "Borrowing in low-interest Japanese Yen to invest in higher-yielding global equities and bonds.", "def_te": "చౌకైన వడ్డీకి జపాన్ యెన్ రుణాలు తీసుకుని భారతీయ మరియు అమెరికన్ మార్కెట్లలో అధిక లాభాల కోసం పెట్టుబడి పెట్టడం."}
        ]
    },

    # 10. UNITED KINGDOM — BANK OF ENGLAND (BOE) INTEREST RATE
    {
        "id": "evt_gb_boe_202612",
        "event_name": "Bank of England (BoE) Official Bank Rate & Monetary Policy Summary",
        "event_name_te": "బ్యాంక్ ఆఫ్ ఇంగ్లాండ్ (BoE) అధికారిక బ్యాంక్ రేటు & ద్రవ్య విధాన ప్రకటన",
        "country": "United Kingdom",
        "country_code": "GB",
        "country_flag": "🇬🇧",
        "category": "CENTRAL_BANK",
        "year": 2026, "month": 12, "day": 18, "hour": 12, "minute": 0,
        "original_timezone": "Europe/London",
        "importance": "MEDIUM",
        "currency": "GBP",
        "previous_value": "4.75%",
        "forecast_value": "4.50%",
        "actual_value": "Not yet released",
        "revision_value": None,
        "source_name": "Bank of England",
        "source_url": "https://www.bankofengland.co.uk/",
        "description_en": (
            "The 9-member Monetary Policy Committee (MPC) sets the official Bank Rate paid to commercial banks on reserve balances, "
            "with a published vote split and inflation report."
        ),
        "description_te": (
            "బ్యాంక్ ఆఫ్ ఇంగ్లాండ్ అధికారిక వడ్డీ రేటును నిర్ణయించే బ్రిటిష్ ద్రవ్య విధాన కమిటీ నిర్ణయం."
        ),
        "why_it_matters_en": (
            "London remains the premier international financial center for foreign exchange and global derivatives settlement."
        ),
        "why_it_matters_te": (
            "లండన్ ప్రపంచంలోనే అతిపెద్ద విదేశీ మారక ద్రవ్య (Forex) మరియు డెరివేటివ్స్ ఆర్థిక కేంద్రంగా ఉంది."
        ),
        "india_market_impact_en": (
            "UK rate stability directly impacts Indian corporations with substantial UK and European operations such as Tata Motors "
            "(Jaguar Land Rover), Tata Steel Europe, and Indian IT services firms with major British banking contracts."
        ),
        "india_market_impact_te": (
            "భారత మార్కెట్ ప్రభావం: UKలో ప్రధాన కార్యకలాపాలు కలిగిన టాటా మోటార్స్ (Jaguar Land Rover), టాటా స్టీల్ మరియు యూకే బ్యాంకింగ్ ప్రాజెక్టులు కలిగిన భారతీయ IT కంపెనీలపై ప్రభావం ఉంటుంది."
        ),
        "key_terms": [
            {"term": "Bank Rate", "term_te": "బ్యాంక్ రేటు", "def_en": "The UK's benchmark interest rate set by the Bank of England.", "def_te": "బ్రిటన్ సెంట్రల్ బ్యాంక్ నిర్ణయించే ప్రామాణిక వడ్డీ రేటు."}
        ]
    },

    # 11. INDIA — UNION BUDGET & FISCAL POLICY ANNOUNCEMENT
    {
        "id": "evt_in_budget_202702",
        "event_name": "Government of India Union Budget & Annual Financial Statement",
        "event_name_te": "భారత ప్రభుత్వ కేంద్ర బడ్జెట్ & వార్షిక ఆర్థిక ప్రకటన",
        "country": "India",
        "country_code": "IN",
        "country_flag": "🇮🇳",
        "category": "GOVERNMENT_FISCAL",
        "year": 2027, "month": 2, "day": 1, "hour": 11, "minute": 0,
        "original_timezone": "Asia/Kolkata",
        "importance": "HIGH",
        "currency": "INR",
        "previous_value": "Fiscal Deficit 4.9% of GDP",
        "forecast_value": "Fiscal Deficit 4.5% of GDP",
        "actual_value": "Not yet released",
        "revision_value": None,
        "source_name": "Ministry of Finance, Government of India",
        "source_url": "https://www.indiabudget.gov.in/",
        "description_en": (
            "Annual fiscal manifesto presented by the Union Finance Minister outlining government expenditure, capital investment (CAPEX), "
            "borrowing program, tax reforms, import duties, and fiscal deficit glide path for the upcoming financial year."
        ),
        "description_te": (
            "కేంద్ర ఆర్థిక మంత్రి పార్లమెంట్‌లో ప్రవేశపెట్టే వార్షిక బడ్జెట్. రాబోయే ఆర్థిక సంవత్సరానికి ప్రభుత్వ వ్యయం, మౌలిక సదుపాయాల మూలధన పెట్టుబడులు (CAPEX), "
            "పన్నుల సంస్కరణలు మరియు ద్రవ్యలోటు లక్ష్యాలను వివరిస్తుంది."
        ),
        "why_it_matters_en": (
            "Sets sovereign economic priorities, public sector capital expenditure allocations, sector incentives (PLI schemes), and sovereign debt market borrowing limits."
        ),
        "why_it_matters_te": (
            "దేశ ఆర్థిక ప్రాధాన్యతలు, రోడ్లు, రైల్వేలు, రక్షణ రంగాల మూలధన వ్యయం మరియు కొత్త పరిశ్రమల కోసం PLI పథకాలను ఇది నిర్దేశిస్తుంది."
        ),
        "india_market_impact_en": (
            "The monumental fiscal event of the year. CAPEX boosts infrastructure (Larsen & Toubro), capital goods, and railways. "
            "Tax adjustments move consumption stocks, while borrowing numbers dictate sovereign bond yields and banking Treasury books."
        ),
        "india_market_impact_te": (
            "భారత మార్కెట్ ప్రభావం: మార్కెట్‌కు అత్యంత ప్రధానమైన రోజు. ఇన్ఫ్రాస్ట్రక్చర్ CAPEX పెంచితే L&T, సిమెంట్, రక్షణ మరియు రైల్వే స్టాక్స్ లాభపడతాయి. "
            "ఆదాయ పన్ను మార్పులు వినియోగ వస్తువుల అమ్మకాలను పెంచుతాయి. ద్రవ్యలోటు తగ్గితే బ్యాంకుల లాభదాయకత పెరుగుతుంది."
        ),
        "key_terms": [
            {"term": "CAPEX", "term_te": "మూలధన వ్యయం (CAPEX)", "def_en": "Government funds invested in creating long-term physical assets like highways, ports, and power plants.", "def_te": "హైవేలు, పోర్టులు, విద్యుత్ కేంద్రాలు వంటి శాశ్వత మౌలిక ఆస్తుల సృష్టికి ప్రభుత్వం చేసే వ్యయం."},
            {"term": "Fiscal Deficit", "term_te": "ద్రవ్యలోటు", "def_en": "Excess of total government spending over non-debt receipts, expressed as % of GDP.", "def_te": "ప్రభుత్వ ఆదాయాల కంటే వ్యయం ఎంత ఎక్కువగా ఉందో తెలిపే లోటు (GDP శాతంలో)."}
        ]
    },

    # 12. UNITED STATES — EIA WEEKLY PETROLEUM INVENTORIES
    {
        "id": "evt_us_eia_crude_weekly",
        "event_name": "US EIA Weekly Crude Oil and Distillate Inventories",
        "event_name_te": "అమెరికా EIA వారపు క్రూడ్ ఆయిల్ మరియు ఇంధన నిల్వల నివేదిక",
        "country": "United States",
        "country_code": "US",
        "country_flag": "🇺🇸",
        "category": "COMMODITIES_ENERGY",
        "year": 2026, "month": 11, "day": 19, "hour": 10, "minute": 30,
        "original_timezone": "America/New_York",
        "importance": "MEDIUM",
        "currency": "USD",
        "previous_value": "+2.1M bbl",
        "forecast_value": "-1.5M bbl",
        "actual_value": "Not yet released",
        "revision_value": None,
        "source_name": "U.S. Energy Information Administration (EIA)",
        "source_url": "https://www.eia.gov/petroleum/supply/weekly/",
        "description_en": (
            "Weekly statistical release tracking commercial crude oil barrels stored in US facilities, strategic petroleum reserve (SPR) levels, "
            "refinery utilization rates, and gasoline inventories."
        ),
        "description_te": (
            "అమెరికా వాణిజ్య నిల్వల్లోని ముడి చమురు బ్యారెళ్ల సంఖ్య, వ్యూహాత్మక పెట్రోలియం నిల్వలు (SPR) మరియు రిఫైనరీ వినియోగ స్థాయిలను తెలిపే వారపు నివేదిక."
        ),
        "why_it_matters_en": (
            "Provides an immediate real-time indicator of world demand versus American crude extraction and inventory drawdowns."
        ),
        "why_it_matters_te": (
            "ప్రపంచంలోనే అతిపెద్ద చమురు వినియోగదారు అయిన అమెరికాలో డిమాండ్-సరఫరాల వాస్తవ స్థితిని ఇది తెలియజేస్తుంది."
        ),
        "india_market_impact_en": (
            "Higher-than-expected crude draws push oil prices up, increasing India's import bill and dampening OMC margins. Builds in crude lower oil prices, cheering Indian markets."
        ),
        "india_market_impact_te": (
            "భారత మార్కెట్ ప్రభావం: US ఆయిల్ నిల్వలు తగ్గితే ముడి చమురు ధరలు పెరిగి భారత దిగుమతి భారం పెరుగుతుంది. నిల్వలు పెరిగితే చమురు ధరలు తగ్గి భారత మార్కెట్లకు అనుకూలిస్తుంది."
        ),
        "key_terms": [
            {"term": "Crude Draw", "term_te": "క్రూడ్ నిల్వల తగ్గుదల", "def_en": "Reduction in stored oil indicating consumption outpacing supply.", "def_te": "నిల్వలు తగ్గడం చమురు డిమాండ్ బలంగా ఉందని సూచిస్తుంది."}
        ]
    },

    # 13. GLOBAL FINANCIAL MARKETS — NSE / BSE MONTHLY DERIVATIVES EXPIRY
    {
        "id": "evt_in_fo_expiry_202611",
        "event_name": "NSE NIFTY 50 & Bank Nifty Monthly Derivatives (F&O) Expiry",
        "event_name_te": "NSE నిఫ్టీ 50 & బ్యాంక్ నిఫ్టీ నెలవారీ డెరివేటివ్స్ (F&O) ఎక్స్‌పైరీ",
        "country": "India",
        "country_code": "IN",
        "country_flag": "🇮🇳",
        "category": "FINANCIAL_MARKETS",
        "year": 2026, "month": 11, "day": 26, "hour": 15, "minute": 30,
        "original_timezone": "Asia/Kolkata",
        "importance": "HIGH",
        "currency": "INR",
        "previous_value": "Rollover 78.4%",
        "forecast_value": "Rollover 79.0%",
        "actual_value": "Not yet released",
        "revision_value": None,
        "source_name": "National Stock Exchange of India (NSE)",
        "source_url": "https://www.nseindia.com/",
        "description_en": (
            "Final trading session of the monthly futures and options contracts for NIFTY 50 index and single-stock derivatives on the last Thursday of the month."
        ),
        "description_te": (
            "ప్రతి నెలా చివరి గురువారం జరిగే నిఫ్టీ 50 ఇండెక్స్ మరియు స్టాక్ ఫ్యూచర్స్ & ఆప్షన్స్ కాంట్రాక్టుల తుది గడువు ముగింపు (ఎక్స్‌పైరీ)."
        ),
        "why_it_matters_en": (
            "Institutional position rolling, short-covering, gamma squeezes, and pin risk peak during the final settlement window (2:00 PM to 3:30 PM)."
        ),
        "why_it_matters_te": (
            "సంస్థాగత వ్యాపారులు (FII/DII) తమ పాత పొజిషన్లను క్లోజ్ చేయడం లేదా వచ్చే నెలకు బదిలీ (Rollover) చేయడం వల్ల భారీ వాల్యూమ్‌లు మరియు గరిష్ట ఒడిదుడుకులు నమోదవుతాయి."
        ),
        "india_market_impact_en": (
            "Day of peak intraday traded volume across all 50 constituents. Heavyweight stocks often experience rapid mean-reversion or directional trending."
        ),
        "india_market_impact_te": (
            "భారత మార్కెట్ ప్రభావం: మార్కెట్లోని అన్ని 50 స్టాక్స్‌లో రికార్డు స్థాయి వాల్యూమ్‌లు నమోదవుతాయి. హెవీవెయిట్ షేర్లలో తీవ్రమైన ధరల కదలికలు కనిపిస్తాయి."
        ),
        "key_terms": [
            {"term": "Rollover", "term_te": "రోల్‌ఓవర్", "def_en": "Carrying forward an open derivative position to the subsequent expiration month.", "def_te": "ప్రస్తుత నెల కాంట్రాక్టును క్లోజ్ చేసి వచ్చే నెల కాంట్రాక్టుకు స్థానాన్ని మార్చడం."}
        ]
    },

    # 14. MAJOR CORPORATE & TECH — NVIDIA GLOBAL AI DEVELOPER KEYNOTE
    {
        "id": "evt_corp_nvidia_ai_202611",
        "event_name": "NVIDIA Global AI Architecture & Semiconductor Keynote",
        "event_name_te": "NVIDIA గ్లోబల్ AI ఆర్కిటెక్చర్ & సెమీకండక్టర్ సదస్సు",
        "country": "United States",
        "country_code": "US",
        "country_flag": "🇺🇸",
        "category": "CORPORATE_TECH",
        "year": 2026, "month": 11, "day": 20, "hour": 13, "minute": 0,
        "original_timezone": "America/Los_Angeles",
        "importance": "MEDIUM",
        "currency": "USD",
        "previous_value": "Blackwell Ultra GPU",
        "forecast_value": "Next-Gen Rubin Architecture",
        "actual_value": "Not yet released",
        "revision_value": None,
        "source_name": "NVIDIA Corporation",
        "source_url": "https://www.nvidia.com/",
        "description_en": (
            "Major technology event where the world's most valuable semiconductor company unveils its roadmap for accelerated computing, "
            "AI infrastructure, and data center GPU chips."
        ),
        "description_te": (
            "ప్రపంచంలోనే అత్యంత విలువైన సెమీకండక్టర్ కంపెనీ తన భవిష్యత్ ఆర్టిఫిషియల్ ఇంటెలిజెన్స్ (AI) మరియు డేటా సెంటర్ చిప్స్ రోడ్‌మ్యాప్‌ను ఆవిష్కరించే సదస్సు."
        ),
        "why_it_matters_en": (
            "NVIDIA is the bellwether for the multi-trillion dollar global generative AI infrastructure buildout. Product delays or surges directly move Nasdaq."
        ),
        "why_it_matters_te": (
            "ప్రపంచవ్యాప్తంగా సాగుతున్న AI విప్లవానికి NVIDIA చిప్స్ అత్యంత ముఖ్యం. ఇది మొత్తం గ్లోబల్ టెక్ రంగాన్ని ప్రభావితం చేస్తుంది."
        ),
        "india_market_impact_en": (
            "Indian IT majors (TCS, Infosys, Wipro, LTIMindtree, Tech Mahindra) have deep partnership ecosystems with NVIDIA. Announcements spur AI engineering contract expectations."
        ),
        "india_market_impact_te": (
            "భారత మార్కెట్ ప్రభావం: TCS, Infosys, Tech Mahindra వంటి భారతీయ IT సంస్థలు NVIDIAతో భారీ AI భాగస్వామ్యాలను కలిగి ఉన్నాయి. ఇది NIFTY IT షేర్లకు ఊపునిస్తుంది."
        ),
        "key_terms": [
            {"term": "AI Capex", "term_te": "AI మూలధన వ్యయం", "def_en": "Capital spent by cloud giants (Microsoft, Google, Meta) on GPUs and AI servers.", "def_te": "ప్రముఖ క్లౌడ్ కంపెనీలు AI సర్వర్లు మరియు చిప్స్ కొనుగోలుకు చేసే భారీ వ్యయం."}
        ]
    },

    # 15. GEOPOLITICAL — US-CHINA BILATERAL TRADE RELATIONS REVIEW
    {
        "id": "evt_geopol_us_china_202612",
        "event_name": "US-China Bilateral Strategic Economic & High-Tech Export Review",
        "event_name_te": "అమెరికా-చైనా వ్యూహాత్మక ఆర్థిక సంబంధాలు & హై-టెక్ ఎగుమతుల సమీక్ష",
        "country": "Global",
        "country_code": "GLOBAL",
        "country_flag": "🌐",
        "category": "GEOPOLITICAL",
        "year": 2026, "month": 12, "day": 10, "hour": 15, "minute": 0,
        "original_timezone": "UTC",
        "importance": "HIGH",
        "currency": "USD",
        "previous_value": "Tariffs maintained",
        "forecast_value": "Critical minerals & chip export controls",
        "actual_value": "Not yet released",
        "revision_value": None,
        "source_name": "U.S. Trade Representative / Ministry of Commerce China",
        "source_url": "https://ustr.gov/",
        "description_en": (
            "Scheduled high-level diplomatic review addressing cross-border tariffs, advanced semiconductor export restrictions, "
            "and rare-earth mineral supply chain stability between the world's two largest superpowers."
        ),
        "description_te": (
            "ప్రపంచంలోని రెండు అగ్రరాజ్యాల మధ్య సుంకాలు, అత్యాధునిక సెమీకండక్టర్ ఎగుమతుల నిబంధనలు మరియు అరుదైన ఖనిజాల సరఫరాపై జరిగే ద్వైపాక్షిక సమీక్ష."
        ),
        "why_it_matters_en": (
            "US-China frictions govern global supply chain decoupling, trade corridors, and geopolitical risk premiums across international financial markets."
        ),
        "why_it_matters_te": (
            "రెండు అగ్రరాజ్యాల మధ్య వాణిజ్య యుద్ధం లేదా ఉద్రిక్తతలు ప్రపంచ వాణిజ్య సరఫరా గొలుసును దెబ్బతీస్తాయి."
        ),
        "india_market_impact_en": (
            "India is a prime beneficiary of the 'China Plus One' diversification strategy. Escalating friction accelerates multinational manufacturing "
            "migration into Indian electronics (EMS), chemicals, and pharmaceutical manufacturing under PLI schemes."
        ),
        "india_market_impact_te": (
            "భారత మార్కెట్ ప్రభావం: 'చైనా ప్లస్ వన్' విధానం ద్వారా భారతదేశం ప్రధాన ప్రయోజనం పొందుతుంది. గ్లోబల్ కంపెనీలు చైనా నుండి బయటకు వచ్చి "
            "భారతదేశంలో ఎలక్ట్రానిక్స్ (డిక్సన్, ఫాక్స్‌కాన్), రసాయనాలు మరియు ఫార్మా తయారీని వేగవంతం చేస్తాయి."
        ),
        "key_terms": [
            {"term": "China Plus One", "term_te": "చైనా ప్లస్ వన్ వ్యూహం", "def_en": "Global corporate strategy to diversify manufacturing investments beyond China into alternative hubs like India.", "def_te": "కేవలం చైనాపైనే ఆధారపడకుండా భారతదేశం వంటి ఇతర దేశాల్లో కూడా ఫ్యాక్టరీలు నెలకొల్పే గ్లోబల్ వ్యూహం."}
        ]
    }
]


class GlobalEventsService:
    """Service layer managing global events persistence, filtering, time conversions, and telemetry."""

    def __init__(self):
        self._initialized = False

    def init_database_events(self):
        """Seeds master global events into database if missing."""
        db = SessionLocal()
        try:
            for item in MASTER_GLOBAL_EVENTS:
                existing = db.query(GlobalEventModel).filter(GlobalEventModel.id == item["id"]).first()
                # Compute exact timestamps
                time_info = convert_local_to_utc_and_ist(
                    year=item["year"],
                    month=item["month"],
                    day=item["day"],
                    hour=item["hour"],
                    minute=item["minute"],
                    local_tz_name=item["original_timezone"]
                )

                utc_dt = time_info["utc_dt"].replace(tzinfo=None)
                ist_dt = time_info["ist_dt"].replace(tzinfo=None)

                # Surprise calculation
                surprise = calculate_surprise(item.get("actual_value"), item.get("forecast_value"))

                # JSON key terms
                terms_json = json.dumps(item.get("key_terms", []))

                if not existing:
                    event = GlobalEventModel(
                        id=item["id"],
                        event_name=item["event_name"],
                        event_name_te=item["event_name_te"],
                        country=item["country"],
                        country_code=item["country_code"],
                        country_flag=item["country_flag"],
                        category=item["category"],
                        start_time_utc=utc_dt,
                        end_time_utc=None,
                        original_timezone=item["original_timezone"],
                        original_time_str=time_info["local_str"],
                        start_time_ist=ist_dt,
                        start_time_ist_str=time_info["full_ist_str"],
                        importance=item["importance"],
                        currency=item["currency"],
                        previous_value=item["previous_value"],
                        forecast_value=item["forecast_value"],
                        actual_value=item["actual_value"],
                        revision_value=item.get("revision_value"),
                        surprise_value=surprise.get("surprise_value"),
                        surprise_direction=surprise.get("surprise_direction", "PENDING"),
                        status="RELEASED" if item.get("actual_value") and item.get("actual_value") != "Not yet released" else "UPCOMING",
                        source_name=item["source_name"],
                        source_url=item["source_url"],
                        description_en=item["description_en"],
                        description_te=item["description_te"],
                        why_it_matters_en=item["why_it_matters_en"],
                        why_it_matters_te=item["why_it_matters_te"],
                        india_market_impact_en=item["india_market_impact_en"],
                        india_market_impact_te=item["india_market_impact_te"],
                        key_terms=terms_json,
                        last_verified_timestamp=datetime.now(timezone.utc).replace(tzinfo=None)
                    )
                    db.add(event)
                else:
                    # Update dynamic fields
                    existing.previous_value = item["previous_value"]
                    existing.forecast_value = item["forecast_value"]
                    existing.actual_value = item["actual_value"]
                    existing.surprise_value = surprise.get("surprise_value")
                    existing.surprise_direction = surprise.get("surprise_direction", "PENDING")
                    existing.last_verified_timestamp = datetime.now(timezone.utc).replace(tzinfo=None)

            # Ensure default user preference exists
            pref = db.query(UserEventPreferenceModel).filter(UserEventPreferenceModel.user_id == "default_user").first()
            if not pref:
                db.add(UserEventPreferenceModel(user_id="default_user"))

            db.commit()
            self._initialized = True
            logger.info("Successfully synced %d global economic events into database.", len(MASTER_GLOBAL_EVENTS))
        except Exception as e:
            db.rollback()
            logger.error("Error initializing global events database: %s", e)
        finally:
            db.close()

    def get_all_events(
        self,
        category: Optional[str] = None,
        country_code: Optional[str] = None,
        importance: Optional[str] = None,
        search_query: Optional[str] = None,
        timeframe: Optional[str] = None  # TODAY, 7_DAYS, 30_DAYS, 90_DAYS
    ) -> List[Dict[str, Any]]:
        """Queries events with advanced filtering and dynamically attaches live countdowns."""
        if not self._initialized:
            self.init_database_events()

        db = SessionLocal()
        try:
            query = db.query(GlobalEventModel)

            if category and category.upper() != "ALL":
                query = query.filter(GlobalEventModel.category == category.upper())

            if country_code and country_code.upper() != "ALL":
                query = query.filter(GlobalEventModel.country_code == country_code.upper())

            if importance and importance.upper() != "ALL":
                query = query.filter(GlobalEventModel.importance == importance.upper())

            if search_query and search_query.strip():
                term = f"%{search_query.strip().lower()}%"
                query = query.filter(
                    (GlobalEventModel.event_name.ilike(term)) |
                    (GlobalEventModel.event_name_te.ilike(term)) |
                    (GlobalEventModel.country.ilike(term)) |
                    (GlobalEventModel.description_en.ilike(term))
                )

            # Timeframe filter based on start_time_utc
            now_utc = datetime.now(timezone.utc).replace(tzinfo=None)
            if timeframe == "TODAY":
                today_start = now_utc.replace(hour=0, minute=0, second=0)
                today_end = now_utc.replace(hour=23, minute=59, second=59)
                query = query.filter(GlobalEventModel.start_time_utc >= today_start, GlobalEventModel.start_time_utc <= today_end)
            elif timeframe == "7_DAYS":
                end_7d = now_utc + timedelta(days=7)
                query = query.filter(GlobalEventModel.start_time_utc <= end_7d)
            elif timeframe == "30_DAYS":
                end_30d = now_utc + timedelta(days=30)
                query = query.filter(GlobalEventModel.start_time_utc <= end_30d)
            elif timeframe == "90_DAYS":
                end_90d = now_utc + timedelta(days=90)
                query = query.filter(GlobalEventModel.start_time_utc <= end_90d)

            # Sort chronologically by start_time_utc
            records = query.order_by(GlobalEventModel.start_time_utc.asc()).all()

            results = []
            for r in records:
                # Add live countdown
                countdown = compute_live_countdown(r.start_time_utc)
                key_terms = []
                try:
                    if r.key_terms:
                        key_terms = json.loads(r.key_terms)
                except Exception:
                    key_terms = []

                results.append({
                    "id": r.id,
                    "event_name": r.event_name,
                    "event_name_te": r.event_name_te,
                    "country": r.country,
                    "country_code": r.country_code,
                    "country_flag": r.country_flag,
                    "category": r.category,
                    "start_time_utc": r.start_time_utc.isoformat() + "Z" if r.start_time_utc else None,
                    "original_timezone": r.original_timezone,
                    "original_time_str": r.original_time_str,
                    "start_time_ist": r.start_time_ist.isoformat() if r.start_time_ist else None,
                    "start_time_ist_str": r.start_time_ist_str,
                    "importance": r.importance,
                    "currency": r.currency,
                    "previous_value": r.previous_value,
                    "forecast_value": r.forecast_value,
                    "actual_value": r.actual_value,
                    "revision_value": r.revision_value,
                    "surprise_value": r.surprise_value,
                    "surprise_direction": r.surprise_direction,
                    "status": r.status,
                    "countdown": countdown,
                    "source_name": r.source_name,
                    "source_url": r.source_url,
                    "description_en": r.description_en,
                    "description_te": r.description_te,
                    "why_it_matters_en": r.why_it_matters_en,
                    "why_it_matters_te": r.why_it_matters_te,
                    "india_market_impact_en": r.india_market_impact_en,
                    "india_market_impact_te": r.india_market_impact_te,
                    "key_terms": key_terms,
                    "last_verified_timestamp": r.last_verified_timestamp.isoformat() if r.last_verified_timestamp else None,
                })

            return results
        finally:
            db.close()

    def get_market_overview_summary(self) -> Dict[str, Any]:
        """Provides Section 1 top telemetry cards: IST live clock, high impact counts, next countdown."""
        events = self.get_all_events()
        now_utc = datetime.now(timezone.utc)
        now_ist = now_utc.astimezone(timezone(timedelta(hours=5, minutes=30)))

        today_ist_date = now_ist.strftime("%Y-%m-%d")

        # High impact count
        high_impact_events = [e for e in events if e["importance"] == "HIGH"]

        # Today's events
        events_today = [
            e for e in events
            if e["start_time_ist"] and e["start_time_ist"].startswith(today_ist_date)
        ]

        # Upcoming upcoming events
        upcoming_events = [e for e in events if e["countdown"]["status"] == "UPCOMING"]
        next_event = upcoming_events[0] if upcoming_events else (events[0] if events else None)

        # Recently released events
        recently_released = [e for e in events if e["actual_value"] and e["actual_value"] != "Not yet released"]

        return {
            "current_ist_timestamp": now_ist.isoformat(),
            "current_ist_formatted": now_ist.strftime("%d %b %Y, %I:%M:%S %p IST"),
            "current_ist_date": now_ist.strftime("%A, %d %B %Y"),
            "total_events_tracked": len(events),
            "high_impact_total": len(high_impact_events),
            "events_today_count": len(events_today),
            "next_event": next_event,
            "recently_released_count": len(recently_released),
            "categories_breakdown": {
                "ECONOMIC_DATA": len([e for e in events if e["category"] == "ECONOMIC_DATA"]),
                "CENTRAL_BANK": len([e for e in events if e["category"] == "CENTRAL_BANK"]),
                "GOVERNMENT_FISCAL": len([e for e in events if e["category"] == "GOVERNMENT_FISCAL"]),
                "GEOPOLITICAL": len([e for e in events if e["category"] == "GEOPOLITICAL"]),
                "COMMODITIES_ENERGY": len([e for e in events if e["category"] == "COMMODITIES_ENERGY"]),
                "FINANCIAL_MARKETS": len([e for e in events if e["category"] == "FINANCIAL_MARKETS"]),
                "CORPORATE_TECH": len([e for e in events if e["category"] == "CORPORATE_TECH"]),
            }
        }

    def get_event_by_id(self, event_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves single event with detailed history."""
        events = self.get_all_events()
        for e in events:
            if e["id"] == event_id:
                return e
        return None

    def get_preferences(self) -> Dict[str, Any]:
        """Gets user alert configuration."""
        db = SessionLocal()
        try:
            pref = db.query(UserEventPreferenceModel).filter(UserEventPreferenceModel.user_id == "default_user").first()
            if not pref:
                return {
                    "alert_24h": True,
                    "alert_1h": True,
                    "alert_15m": True,
                    "alert_results": True,
                    "alert_postponed": True,
                    "preferred_countries": "ALL",
                    "preferred_categories": "ALL"
                }
            return {
                "alert_24h": pref.alert_24h,
                "alert_1h": pref.alert_1h,
                "alert_15m": pref.alert_15m,
                "alert_results": pref.alert_results,
                "alert_postponed": pref.alert_postponed,
                "preferred_countries": pref.preferred_countries,
                "preferred_categories": pref.preferred_categories
            }
        finally:
            db.close()

    def update_preferences(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Saves user alert configuration."""
        db = SessionLocal()
        try:
            pref = db.query(UserEventPreferenceModel).filter(UserEventPreferenceModel.user_id == "default_user").first()
            if not pref:
                pref = UserEventPreferenceModel(user_id="default_user")
                db.add(pref)

            if "alert_24h" in data:
                pref.alert_24h = bool(data["alert_24h"])
            if "alert_1h" in data:
                pref.alert_1h = bool(data["alert_1h"])
            if "alert_15m" in data:
                pref.alert_15m = bool(data["alert_15m"])
            if "alert_results" in data:
                pref.alert_results = bool(data["alert_results"])
            if "alert_postponed" in data:
                pref.alert_postponed = bool(data["alert_postponed"])
            if "preferred_countries" in data:
                pref.preferred_countries = str(data["preferred_countries"])
            if "preferred_categories" in data:
                pref.preferred_categories = str(data["preferred_categories"])

            db.commit()
            return self.get_preferences()
        finally:
            db.close()


global_events_service = GlobalEventsService()
