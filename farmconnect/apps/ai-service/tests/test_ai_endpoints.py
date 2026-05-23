import pytest
from httpx import ASGITransport, AsyncClient

from src.app import app


@pytest.mark.asyncio
async def test_recommend_price_endpoint_returns_explainable_fields():
    payload = {
        "current_price": 220,
        "cost_price": 150,
        "stock_level": 40,
        "recent_orders_7d": 30,
        "seasonality_index": 1.1,
        "currency": "DZD",
    }

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/api/recommend_price", json=payload)

    assert response.status_code == 200
    data = response.json()
    assert data["recommended_price"] > 0
    assert "confidence" in data
    assert "explanation" in data
    assert isinstance(data["explainable_factors"], list)


@pytest.mark.asyncio
async def test_forecast_demand_endpoint_fallback_when_data_weak():
    payload = {
        "horizon_days": 7,
        "historical_daily_demand": [1.0],
    }

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/api/forecast_demand", json=payload)

    assert response.status_code == 200
    data = response.json()
    assert data["forecast_demand"] >= 0
    assert data["fallback_used"] is True
    assert data["confidence"] <= 0.5


@pytest.mark.asyncio
async def test_chatbot_endpoint_returns_response_shape():
    payload = {"message": "Can you help me forecast demand?"}

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/api/chatbot", json=payload)

    assert response.status_code == 200
    data = response.json()
    assert data["answer"]
    assert data["intent"]
    assert "confidence" in data
    assert "explanation" in data
