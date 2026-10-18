import os
import asyncio
from contextlib import asynccontextmanager
from dotenv import load_dotenv

# Load the environment variables from your .env file
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.core.config import settings

# If CPU mode is forced, disable CUDA device visibility for PyTorch to prevent GPU access/crashes
if settings.FORCE_CPU:
    os.environ["CUDA_VISIBLE_DEVICES"] = ""

from app.api.v1.router import api_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Pre-warm embedder and ChromaDB collection in background so uploads are instant
    if settings.RAG_ENABLED:
        def _warmup():
            try:
                from app.services.rag import vector_store
                vector_store._get_collection()
                vector_store._get_embedder()
            except Exception as e:
                pass
        asyncio.get_event_loop().run_in_executor(None, _warmup)
    yield

app = FastAPI(title=settings.PROJECT_NAME, lifespan=lifespan)


# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Connect your API router
app.include_router(api_router, prefix=settings.API_V1_STR)

# --- Serve the built widget as static files ---
WIDGET_DIST = os.path.join(
    os.path.dirname(__file__),          # .../backend/app
    "..", "..",                         # up to project root
    "widget", "dist"
)

WIDGET_DIST = os.path.abspath(WIDGET_DIST)

if os.path.isdir(WIDGET_DIST):
    app.mount("/assets", StaticFiles(directory=WIDGET_DIST), name="widget-assets")

    @app.get("/chat-widget.js")
    async def serve_widget_js():
        return FileResponse(os.path.join(WIDGET_DIST, "chat-widget.js"))

    @app.get("/", response_class=FileResponse)
    async def serve_index():
        return FileResponse(os.path.join(WIDGET_DIST, "index.html"))

TEST_WEBSITE = os.path.join(
    os.path.dirname(__file__),
    "..", "..",
    "test_website.html"
)
TEST_WEBSITE = os.path.abspath(TEST_WEBSITE)

if os.path.isfile(TEST_WEBSITE):
    @app.get("/test", response_class=FileResponse)
    async def serve_test_site():
        return FileResponse(TEST_WEBSITE)