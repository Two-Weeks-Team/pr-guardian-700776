from fastapi import FastAPI
from routes import router as api_router

app = FastAPI(title="PR Guardian API", version="0.1.0")

app.include_router(api_router)


@app.get("/health")
async def health() -> dict:
    return {"status": "ok", "service": "pr-guardian-api"}
