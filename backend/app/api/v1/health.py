from fastapi import APIRouter, Depends
from app.core.security import get_current_user
from app.models.models import User
from app.monitoring.health_monitor import health_monitor

router = APIRouter(prefix="/health", tags=["Network Health Center"])

@router.get("/metrics")
def get_health_metrics(current_user: User = Depends(get_current_user)):
    return health_monitor.calculate_health_metrics()
