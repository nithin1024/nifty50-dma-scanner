import pytest
from app.services.pmi_intelligence_service import pmi_suite


def test_pmi_indicators_structure():
    indicators = pmi_suite.get_pmi_indicators()
    assert len(indicators) == 8
    
    # Check that required fields exist
    for ind in indicators:
        assert "name" in ind
        assert "actual" in ind
        assert "forecast" in ind
        assert "previous_month" in ind
        assert "monthly_change" in ind
        assert "surprise" in ind
        assert "case_scenario" in ind
        assert ind["case_scenario"] in ["CASE_1", "CASE_2", "CASE_3", "CASE_4"]
        assert "source" in ind
        assert "last_updated" in ind


def test_pmi_case_classification():
    # Case 1: Below 50 -> Above 50
    assert pmi_suite.classify_pmi_case(48.5, 51.2) == "CASE_1"
    # Case 2: Above 50 and rising
    assert pmi_suite.classify_pmi_case(55.0, 56.5) == "CASE_2"
    assert pmi_suite.classify_pmi_case(55.0, 55.0) == "CASE_2"
    # Case 3: Above 50 but falling
    assert pmi_suite.classify_pmi_case(58.0, 56.2) == "CASE_3"
    # Case 4: Below 50 and falling
    assert pmi_suite.classify_pmi_case(49.0, 47.5) == "CASE_4"
    assert pmi_suite.classify_pmi_case(51.0, 48.0) == "CASE_4"


def test_four_case_definitions():
    cases = pmi_suite.get_four_case_definitions()
    assert len(cases) == 4
    for cid in ["CASE_1", "CASE_2", "CASE_3", "CASE_4"]:
        c = cases[cid]
        assert len(c["sectors_to_research"]) >= 3
        assert len(c["what_to_confirm"]) >= 4
        assert len(c["companies_to_research"]) >= 4


def test_pmi_comparison_table():
    table = pmi_suite.get_scenario_comparison_table()
    assert len(table) >= 10
    row = table[0]
    required_cols = [
        "period", "pmi_case", "case_title", "previous_pmi", "current_pmi",
        "pmi_change", "expansion_status", "economic_interpretation",
        "sectors_to_research", "companies_to_research", "metrics_to_confirm",
        "potential_market_impact", "confidence_level"
    ]
    for col in required_cols:
        assert col in row


def test_pmi_companies_analysis():
    companies = pmi_suite.get_company_level_analysis()
    assert len(companies) >= 15
    for comp in companies:
        assert "symbol" in comp
        assert "revenue_growth_yoy" in comp
        assert "operating_profit_margin" in comp
        assert "pmi_sensitivity" in comp
        assert comp["pmi_case"] in ["CASE_1", "CASE_2", "CASE_3", "CASE_4"]


def test_pmi_5year_history():
    history = pmi_suite.get_5year_monthly_history()
    assert history["total_months"] >= 40
    assert len(history["history"]) >= 40
    assert "scenario_distribution" in history


def test_pmi_alerts():
    alerts = pmi_suite.get_pmi_alerts()
    assert len(alerts) >= 1
    for a in alerts:
        assert "type" in a
        assert "title" in a
        assert "severity" in a
