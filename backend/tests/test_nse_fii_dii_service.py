import pytest
from datetime import datetime, timezone

from app.services.nse_fii_dii_service import NseFiiDiiService


def test_parse_official_nse_cash_flow_fields():
    payload = [
        {"buyValue": "11745.95", "category": "DII", "date": "13-Nov-2026", "netValue": "-2253.58", "sellValue": "13999.53"},
        {"buyValue": "18339.57", "category": "FII/FPI", "date": "13-Nov-2026", "netValue": "5736.55", "sellValue": "12603.02"},
    ]

    trading_date, categories = NseFiiDiiService._parse_rows(payload)

    assert trading_date.isoformat() == "2026-11-13"
    assert categories["FII/FPI"] == {"buy": 18339.57, "sell": 12603.02, "net": 5736.55}
    assert categories["DII"] == {"buy": 11745.95, "sell": 13999.53, "net": -2253.58}


def test_parse_rejects_incomplete_or_inconsistent_nse_rows():
    with pytest.raises(ValueError):
        NseFiiDiiService._parse_rows([
            {"buyValue": "100", "category": "FII/FPI", "date": "13-Nov-2026", "netValue": "25", "sellValue": "75"},
        ])

    with pytest.raises(ValueError):
        NseFiiDiiService._parse_rows([
            {"buyValue": "100", "category": "FII/FPI", "date": "13-Nov-2026", "netValue": "10", "sellValue": "75"},
            {"buyValue": "100", "category": "DII", "date": "13-Nov-2026", "netValue": "0", "sellValue": "100"},
        ])


def test_parse_documented_upstox_cash_activity_and_convert_inr_to_crores():
    timestamp_ms = int(datetime(2026, 11, 13, 12, tzinfo=timezone.utc).timestamp() * 1000)
    parsed = NseFiiDiiService._parse_upstox_rows({
        "NSE_EQ|CASH": [
            {"time_stamp": timestamp_ms, "buy_amount": 18_339_570_000, "sell_amount": 12_603_020_000}
        ]
    })

    assert parsed[next(iter(parsed))] == {"buy": 1833.96, "sell": 1260.3, "net": 573.66}


def test_parse_upstox_rejects_undocumented_or_invalid_rows():
    with pytest.raises(ValueError):
        NseFiiDiiService._parse_upstox_rows({"NSE_EQ|CASH": [{"date": "2026-11-13", "buy": 100}]})

    with pytest.raises(ValueError):
        NseFiiDiiService._parse_upstox_rows({
            "NSE_EQ|CASH": [{"time_stamp": 0, "buy_amount": 100, "sell_amount": 50}]
        })
