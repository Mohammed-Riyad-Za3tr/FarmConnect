from fastapi import APIRouter

from ..contracts.ai import (
    ChatbotRequest,
    ChatbotResponse,
    ForecastDemandRequest,
    ForecastDemandResponse,
    RecommendPriceRequest,
    RecommendPriceResponse,
)
from ..services.ai_logic import chatbot_reply, forecast_demand, recommend_price

router = APIRouter(tags=["AI"])


@router.post("/recommend_price", response_model=RecommendPriceResponse)
async def recommend_price_endpoint(payload: RecommendPriceRequest) -> RecommendPriceResponse:
    return recommend_price(payload)


@router.post("/forecast_demand", response_model=ForecastDemandResponse)
async def forecast_demand_endpoint(payload: ForecastDemandRequest) -> ForecastDemandResponse:
    return forecast_demand(payload)


@router.post("/chatbot", response_model=ChatbotResponse)
async def chatbot_endpoint(payload: ChatbotRequest) -> ChatbotResponse:
    return chatbot_reply(payload)
