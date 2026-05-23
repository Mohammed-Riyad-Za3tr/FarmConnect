# FarmConnect AI Service

Python FastAPI microservice providing AI features for the FarmConnect platform.

## Features (Phase 10+)

- **Price recommendations** — suggest optimal pricing based on demand, season, and market data
- **Demand forecasting** — predict future demand per product category and region
- **Chatbot support** — LLM-powered buyer/producer assistant
- **Product categorization** — auto-tag and classify uploaded products

## Local Development

```bash
# Create virtual environment
python -m venv .venv
source .venv/bin/activate   # Linux/macOS
.venv\Scripts\activate      # Windows

# Install dependencies
pip install -r requirements.txt

# Copy environment variables
cp .env.example .env

# Run dev server
python main.py
```

Service is available at `http://localhost:8000`.

- OpenAPI docs: `http://localhost:8000/docs`
- Health check: `GET http://localhost:8000/api/health`

## Production

```bash
docker build -t farmconnect-ai .
docker run -p 8000:8000 --env-file .env farmconnect-ai
```

## Architecture

```
src/
├── app.py           FastAPI application factory
├── config.py        Pydantic settings (env-based)
├── api/             Route handlers (one file per feature)
├── services/        Business logic and ML orchestration
├── models/          Trained model loaders
├── training/        Training scripts and pipelines
├── data/            Data utilities and loaders
├── clients/         HTTP clients for external APIs
├── utils/           Logger and shared utilities
└── contracts/       Shared Pydantic schemas (mirrors packages/shared)
```
