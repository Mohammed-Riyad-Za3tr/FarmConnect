from __future__ import annotations

from ..contracts.ai import (
    ChatbotRequest,
    ChatbotResponse,
    ExplainableFactor,
    ForecastDemandRequest,
    ForecastDemandResponse,
    RecommendPriceRequest,
    RecommendPriceResponse,
)


def _clamp(value: float, minimum: float, maximum: float) -> float:
    return max(minimum, min(maximum, value))


def _round_currency(value: float) -> float:
    return round(value, 2)


def recommend_price(payload: RecommendPriceRequest) -> RecommendPriceResponse:
    factors: list[ExplainableFactor] = []
    data_strength = 0.0

    if payload.cost_price is not None:
        data_strength += 0.35
    if payload.stock_level is not None:
        data_strength += 0.25
    if payload.recent_orders_7d is not None:
        data_strength += 0.25
    if payload.seasonality_index is not None:
        data_strength += 0.15

    candidate = payload.current_price

    if payload.recent_orders_7d is not None and payload.stock_level is not None and payload.stock_level > 0:
        demand_ratio = payload.recent_orders_7d / max(payload.stock_level, 1)
        if demand_ratio >= 1.0:
            candidate *= 1.12
            factors.append(
                ExplainableFactor(
                    factor="demand_vs_stock",
                    impact="increase",
                    weight=0.55,
                    detail="Orders are high relative to stock, so price is nudged upward.",
                )
            )
        elif demand_ratio <= 0.2:
            candidate *= 0.95
            factors.append(
                ExplainableFactor(
                    factor="demand_vs_stock",
                    impact="decrease",
                    weight=0.4,
                    detail="Demand appears soft relative to stock, so price is nudged downward.",
                )
            )

    if payload.seasonality_index is not None:
        seasonal_adjustment = _clamp((payload.seasonality_index - 1.0) * 0.08, -0.08, 0.08)
        candidate *= 1 + seasonal_adjustment
        impact = "increase" if seasonal_adjustment > 0 else "decrease" if seasonal_adjustment < 0 else "neutral"
        factors.append(
            ExplainableFactor(
                factor="seasonality",
                impact=impact,
                weight=0.3,
                detail="Seasonality index influences final recommendation.",
            )
        )

    if payload.cost_price is not None:
        minimum_margin_price = payload.cost_price * 1.1
        if candidate < minimum_margin_price:
            candidate = minimum_margin_price
            factors.append(
                ExplainableFactor(
                    factor="margin_floor",
                    impact="increase",
                    weight=0.7,
                    detail="Price floor applied to preserve a minimal margin over cost.",
                )
            )

    fallback_used = data_strength < 0.45
    if fallback_used:
        candidate = max(payload.current_price, payload.cost_price * 1.1) if payload.cost_price is not None else payload.current_price
        confidence = 0.34
        explanation = (
            "Fallback recommendation used because feature coverage is weak; "
            "returned a conservative value close to the current price."
        )
    else:
        confidence = _clamp(0.46 + data_strength * 0.46, 0.46, 0.92)
        explanation = "Price recommendation estimated from simple demand/stock/seasonality heuristics with margin guardrails."

    if not factors:
        factors.append(
            ExplainableFactor(
                factor="baseline",
                impact="neutral",
                weight=0.2,
                detail="Insufficient strong directional signal; baseline recommendation retained.",
            )
        )

    return RecommendPriceResponse(
        recommended_price=_round_currency(candidate),
        currency=payload.currency,
        confidence=round(confidence, 2),
        explanation=explanation,
        fallback_used=fallback_used,
        explainable_factors=factors,
    )


def forecast_demand(payload: ForecastDemandRequest) -> ForecastDemandResponse:
    factors: list[ExplainableFactor] = []
    history = payload.historical_daily_demand
    data_strength = 0.0

    if len(history) >= 3:
        data_strength += 0.5
    if payload.seasonality_index is not None:
        data_strength += 0.2
    if payload.active_listings is not None:
        data_strength += 0.15
    if payload.stock_level is not None:
        data_strength += 0.15

    if history:
        average_daily = sum(history) / len(history)
        trend = (history[-1] - history[0]) / max(abs(history[0]), 1)
    else:
        average_daily = 1.5
        trend = 0.0

    seasonal_multiplier = payload.seasonality_index if payload.seasonality_index is not None else 1.0
    trend_multiplier = 1 + _clamp(trend, -0.4, 0.4) * 0.35

    forecast_value = average_daily * payload.horizon_days * trend_multiplier * seasonal_multiplier

    if payload.active_listings is not None:
        if payload.active_listings >= 5:
            forecast_value *= 1.1
            factors.append(
                ExplainableFactor(
                    factor="listing_depth",
                    impact="increase",
                    weight=0.25,
                    detail="More active listings suggest broader demand capture potential.",
                )
            )
        elif payload.active_listings <= 1:
            forecast_value *= 0.9
            factors.append(
                ExplainableFactor(
                    factor="listing_depth",
                    impact="decrease",
                    weight=0.2,
                    detail="Limited listing depth can reduce expected demand volume.",
                )
            )

    if payload.stock_level is not None and forecast_value > payload.stock_level * 1.1:
        forecast_value = payload.stock_level * 1.1
        factors.append(
            ExplainableFactor(
                factor="stock_cap",
                impact="decrease",
                weight=0.5,
                detail="Forecast capped by available stock to keep near-term projection realistic.",
            )
        )

    fallback_used = data_strength < 0.4 or len(history) < 3
    if fallback_used:
        baseline = max(6.0, payload.horizon_days * 1.5)
        forecast_value = baseline if not history else max(forecast_value, baseline * 0.7)
        confidence = 0.35
        explanation = (
            "Fallback forecast used because historical signal is weak; "
            "returned a conservative baseline adjusted by available context."
        )
    else:
        confidence = _clamp(0.5 + data_strength * 0.4, 0.5, 0.9)
        explanation = "Demand forecast estimated from moving average, simple trend, and optional seasonality adjustments."

    if not factors:
        factors.append(
            ExplainableFactor(
                factor="historical_average",
                impact="neutral",
                weight=0.35,
                detail="Forecast primarily follows recent average demand signal.",
            )
        )

    return ForecastDemandResponse(
        forecast_demand=round(max(forecast_value, 0.0), 2),
        horizon_days=payload.horizon_days,
        confidence=round(confidence, 2),
        explanation=explanation,
        fallback_used=fallback_used,
        explainable_factors=factors,
    )


def chatbot_reply(payload: ChatbotRequest) -> ChatbotResponse:
    message = payload.message.strip()
    normalized = message.lower()

    if any(keyword in normalized for keyword in ["price", "pricing", "cost"]):
        return ChatbotResponse(
            answer="For pricing decisions, combine your current margin floor with recent order velocity and stock levels before changing prices.",
            intent="pricing_help",
            confidence=0.78,
            explanation="Keyword-matched pricing intent; returned a deterministic guidance template.",
            fallback_used=False,
            follow_up_suggestions=["Share current price and cost for a recommendation.", "Check demand trend over the last 7 days."],
        )

    if any(keyword in normalized for keyword in ["demand", "forecast", "predict"]):
        return ChatbotResponse(
            answer="Demand forecasts are stronger with at least 7 days of history. Include seasonality and stock for more reliable outputs.",
            intent="demand_help",
            confidence=0.76,
            explanation="Keyword-matched demand intent; returned baseline forecasting best-practice guidance.",
            fallback_used=False,
            follow_up_suggestions=["Provide daily demand history.", "Add seasonality index and stock data."],
        )

    if any(keyword in normalized for keyword in ["stock", "inventory"]):
        return ChatbotResponse(
            answer="Low stock can justify moderate price increases, while overstock often benefits from promotions or slight price reductions.",
            intent="inventory_help",
            confidence=0.73,
            explanation="Keyword-matched inventory intent and returned a deterministic policy hint.",
            fallback_used=False,
            follow_up_suggestions=["Compare current stock to weekly orders.", "Review products with low turnover."],
        )

    if any(keyword in normalized for keyword in ["hi", "hello", "salam", "hey"]):
        return ChatbotResponse(
            answer="Hello. I can help with price recommendations, demand forecasting, and stock-aware decisions.",
            intent="greeting",
            confidence=0.74,
            explanation="Greeting intent recognized through keyword rules.",
            fallback_used=False,
            follow_up_suggestions=["Ask for price recommendation.", "Ask for demand forecast."],
        )

    return ChatbotResponse(
        answer="I can help with pricing, demand forecast, and inventory guidance. Ask with product details for a more specific response.",
        intent="generic_help",
        confidence=0.42,
        explanation="Fallback response used because intent confidence from keyword rules is low.",
        fallback_used=True,
        follow_up_suggestions=["Recommend price for my tomatoes.", "Forecast demand for next 14 days."],
    )
