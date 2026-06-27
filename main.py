

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from api.endpoints import router as api_router

app = FastAPI(
    title="ZCare Medical Report Analyzer API",
    description="API for processing medical reports and extracting health insights using Vision LLMs.",
    version="1.0.0"
)

# Allow frontend to communicate with backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to your specific frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the endpoints from our API router
app.include_router(api_router, prefix="/api")
# Serve the frontend static files (index.html, script.js, style.css)
app.mount("/", StaticFiles(directory="frontend", html=True), name="frontend")

# Add this root endpoint

if __name__ == "__main__":
    import uvicorn
    # Run the development server
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)