import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    APP_NAME: str = "Portfolio Visualizer API"
    VERSION: str = "1.0.0"
    PORT: int = int(os.getenv("PORT", 8000))
    HOST: str = os.getenv("HOST", "0.0.0.0")
    CORS_ORIGINS: list = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:5173").split(",")

settings = Settings()