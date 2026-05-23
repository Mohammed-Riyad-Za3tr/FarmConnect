from src.contracts.ai import ChatbotRequest, ForecastDemandRequest, RecommendPriceRequest
from src.services.ai_logic import chatbot_reply, forecast_demand, recommend_price


def test_recommend_price_applies_margin_floor_when_below_cost_guardrail():
    payload = RecommendPriceRequest(
        current_price=90,
        cost_price=100,
        stock_level=100,
        recent_orders_7d=5,
        seasonality_index=1.0,
    )

    result = recommend_price(payload)

    assert result.recommended_price >= 110
    assert result.fallback_used is False
    assert any(f.factor == "margin_floor" for f in result.explainable_factors)


def test_forecast_demand_uses_fallback_for_weak_history():
    payload = ForecastDemandRequest(
        horizon_days=14,
        historical_daily_demand=[1.0],
    )

    result = forecast_demand(payload)

    assert result.fallback_used is True
    assert result.confidence <= 0.5
    assert result.forecast_demand >= 0


def test_chatbot_reply_returns_generic_fallback_for_unknown_intent():
    payload = ChatbotRequest(message="Need support for tractor maintenance intervals")

    result = chatbot_reply(payload)

    assert result.intent == "generic_help"
    assert result.fallback_used is True
    assert len(result.follow_up_suggestions) >= 1
