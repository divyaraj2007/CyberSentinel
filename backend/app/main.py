import logging
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.database import engine, Base
from app.core.ws_manager import ws_manager
from app.seed import seed_database
from app.monitoring.traffic_monitor import traffic_monitor

# Routers
from app.api.v1.auth import router as auth_router
from app.api.v1.networks import router as networks_router
from app.api.v1.devices import router as devices_router
from app.api.v1.scans import router as scans_router
from app.api.v1.traffic import router as traffic_router
from app.api.v1.ids import router as ids_router
from app.api.v1.vulnerabilities import router as vulns_router
from app.api.v1.threat_intel import router as threat_intel_router
from app.api.v1.cisco import router as cisco_router
from app.api.v1.topology import router as topology_router
from app.api.v1.incidents import router as incidents_router
from app.api.v1.forensics import router as forensics_router
from app.api.v1.response import router as response_router
from app.api.v1.health import router as health_router
from app.api.v1.reports import router as reports_router
from app.api.v1.ai import router as ai_router
from app.api.v1.integrations import router as integrations_router
from app.api.v1.dashboard import router as dashboard_router

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("cybersentinel")

# Background task to pulse live traffic packets periodically
async def live_traffic_background_worker():
    while True:
        try:
            await asyncio.sleep(4.0)
            if ws_manager.active_connections:
                pkt = traffic_monitor.generate_live_packet()
                await ws_manager.broadcast({
                    "type": "NEW_PACKET",
                    "packet": pkt
                })
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.debug(f"Background traffic pulse exception: {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing CyberSentinel Backend...")
    # Seed database if needed
    try:
        seed_database()
    except Exception as e:
        logger.error(f"Error seeding database: {e}")

    # Launch background traffic worker
    traffic_task = asyncio.create_task(live_traffic_background_worker())
    yield
    traffic_task.cancel()
    logger.info("CyberSentinel Backend shutdown cleanly.")

app = FastAPI(
    title="CyberSentinel",
    description="All-in-One Network Security Monitoring & Vulnerability Assessment Platform",
    version=settings.VERSION,
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# WebSocket Endpoint
@app.websocket("/api/ws")
async def websocket_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        # Send initial welcome & connection confirmation
        await websocket.send_json({
            "type": "CONNECTION_ESTABLISHED",
            "message": "Connected to CyberSentinel Real-Time Telemetry Bus",
            "timestamp": "now"
        })
        while True:
            data = await websocket.receive_text()
            # Echo or process client ping
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception as e:
        logger.warning(f"WebSocket client error: {e}")
        ws_manager.disconnect(websocket)

# Include All API v1 Subrouters
api_prefix = settings.API_V1_STR
app.include_router(auth_router, prefix=api_prefix)
app.include_router(dashboard_router, prefix=api_prefix)
app.include_router(networks_router, prefix=api_prefix)
app.include_router(devices_router, prefix=api_prefix)
app.include_router(scans_router, prefix=api_prefix)
app.include_router(traffic_router, prefix=api_prefix)
app.include_router(ids_router, prefix=api_prefix)
app.include_router(vulns_router, prefix=api_prefix)
app.include_router(threat_intel_router, prefix=api_prefix)
app.include_router(cisco_router, prefix=api_prefix)
app.include_router(topology_router, prefix=api_prefix)
app.include_router(incidents_router, prefix=api_prefix)
app.include_router(forensics_router, prefix=api_prefix)
app.include_router(response_router, prefix=api_prefix)
app.include_router(health_router, prefix=api_prefix)
app.include_router(reports_router, prefix=api_prefix)
app.include_router(ai_router, prefix=api_prefix)
app.include_router(integrations_router, prefix=api_prefix)

@app.get("/")
def root():
    return {
        "platform": "CyberSentinel",
        "tagline": "Discover. Monitor. Detect. Defend.",
        "status": "OPERATIONAL",
        "version": settings.VERSION,
        "docs_url": "/docs"
    }

@app.get("/api/health")
def api_health():
    return {"status": "ok", "service": "CyberSentinel Backend API"}
