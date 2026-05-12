import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import CORS_ORIGINS, LOG_LEVEL, LOG_FORMAT
from app.routers import prediction, history, health

logging.basicConfig(level=LOG_LEVEL, format=LOG_FORMAT)

app = FastAPI(title="Aura Predictive Financial Engine", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(prediction.router)
app.include_router(history.router)
app.include_router(health.router)
