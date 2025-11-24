from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.endpoints import stocks

# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    description="Backend API for Indian stock portfolio analytics",
    version=settings.VERSION
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(stocks.router)

# Health check endpoints


@app.get("/")
async def root():
    return {"message": "Portfolio Visualizer API is running", "status": "healthy"}


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "portfolio-backend"}
