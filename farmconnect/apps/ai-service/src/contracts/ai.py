from typing import Any, Literal

from pydantic import BaseModel, Field


class ExplainableFactor(BaseModel):
    factor: str
    impact: Literal["increase", "decrease", "neutral"]
    weight: float = Field(ge=0.0, le=1.0)
    detail: str


class RecommendPriceRequest(BaseModel):
    product_name: str | None = None
    category: str | None = None
    current_price: float = Field(gt=0)
    cost_price: float | None = Field(default=None, ge=0)
    stock_level: int | None = Field(default=None, ge=0)
    recent_orders_7d: int | None = Field(default=None, ge=0)
    seasonality_index: float | None = Field(default=None, gt=0)
    currency: str = "DZD"


class RecommendPriceResponse(BaseModel):
    recommended_price: float
    currency: str
    confidence: float = Field(ge=0.0, le=1.0)
    explanation: str
    fallback_used: bool
    explainable_factors: list[ExplainableFactor]


class ForecastDemandRequest(BaseModel):
    product_name: str | None = None
    category: str | None = None
    horizon_days: int = Field(default=7, ge=1, le=90)
    historical_daily_demand: list[float] = Field(default_factory=list)
    active_listings: int | None = Field(default=None, ge=0)
    stock_level: int | None = Field(default=None, ge=0)
    seasonality_index: float | None = Field(default=None, gt=0)


class ForecastDemandResponse(BaseModel):
    forecast_demand: float
    horizon_days: int
    confidence: float = Field(ge=0.0, le=1.0)
    explanation: str
    fallback_used: bool
    explainable_factors: list[ExplainableFactor]


class ChatbotRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    role: Literal["BUYER", "PRODUCER", "ADMIN"] | None = None
    context: dict[str, Any] | None = None


class ChatbotResponse(BaseModel):
    answer: str
    intent: str
    confidence: float = Field(ge=0.0, le=1.0)
    explanation: str
    fallback_used: bool
    follow_up_suggestions: list[str] = Field(default_factory=list)
