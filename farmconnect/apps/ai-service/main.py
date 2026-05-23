import uvicorn
from src.config import get_settings

if __name__ == "__main__":
    settings = get_settings()
    uvicorn.run(
        "src.app:app",
        host=settings.host,
        port=settings.port,
        reload=settings.app_env == "development",
        log_level=settings.log_level.lower(),
    )
