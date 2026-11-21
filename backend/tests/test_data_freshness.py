from fastapi.testclient import TestClient
from app.main import app
from app.services.data_freshness_service import data_freshness_service

client = TestClient(app)


def test_data_freshness_service_all_25_modules():
    audit = data_freshness_service.get_full_freshness_audit()
    assert "summary" in audit
    assert "modules" in audit
    assert audit["summary"]["total_modules"] == 25
    assert len(audit["modules"]) == 25

    # Verify required keys in every module
    required_keys = {
        "id",
        "name",
        "category",
        "source",
        "data_date",
        "publication_date",
        "last_fetch_timestamp",
        "last_updated",
        "data_status",
        "update_frequency",
    }
    allowed_statuses = {
        "LIVE",
        "DELAYED",
        "LATEST VERIFIED",
        "STALE",
        "PENDING",
        "MARKET CLOSED",
        "ERROR",
    }

    for mod in audit["modules"]:
        missing = required_keys - set(mod.keys())
        assert not missing, f"Module {mod.get('id')} missing keys: {missing}"
        assert (
            mod["data_status"] in allowed_statuses
        ), f"Invalid status: {mod['data_status']}"


def test_data_freshness_endpoint():
    response = client.get("/api/v1/market-intelligence/freshness")
    assert response.status_code == 200
    data = response.json()
    assert data["summary"]["total_modules"] == 25
    assert len(data["modules"]) == 25
