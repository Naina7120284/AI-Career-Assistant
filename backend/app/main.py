from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.services.realtime_voice import router as realtime_voice_router
import time
import logging
import sys
from app.config import Config
from app.routes import resume, chat
from app.routes import image
from app.routes import web_search

# Windows terminals often default to a legacy codepage (cp1252, etc.).
# If any route prints Unicode (emojis, Hindi, etc.), stdout/stderr can crash
# with "charmap codec can't encode character". Force UTF-8 to prevent that.
try:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    # If reconfigure isn't supported, we still want the app to run.
    pass

# Initialize Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="AI Career Assistant API", 
    version="1.0.0",
    description="Backend API for AI-powered career coaching and resume analysis"
)

# 1. CORS Middleware - Fixed for WebSocket Handshakes
# We define the origins clearly to ensure the 403 error is resolved
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:8001",
    "https://ai-career-assistant-1-9nbp.onrender.com",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. Global Middleware for Logging
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    logger.info(f"Path: {request.url.path} | Time: {process_time:.4f}s")
    return response

# 3. Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global error caught: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={"message": "An internal server error occurred.", "details": str(exc)},
    )

# 4. Register routes
# Note: voice_websocket usually handles its own security in the route file
app.include_router(resume.router)
app.include_router(chat.router, prefix="/api/v1")
app.include_router(realtime_voice_router) 
app.include_router(image.router)
app.include_router(web_search.router)

@app.get("/")
async def root():
    return {
        "project": "AI Career Assistant",
        "status": "Online",
        "docs": "/docs"
    }

@app.get("/health")
async def health():
    return {"status": "healthy", "timestamp": time.time()}

if __name__ == "__main__":
    import uvicorn
    # Make sure to use the string path "app.main:app" for reload to work
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)