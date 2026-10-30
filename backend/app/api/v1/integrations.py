from typing import List
from fastapi import APIRouter, Depends
from app.core.security import get_current_user
from app.models.models import User
from app.schemas.schemas import ToolIntegrationStatus
from app.integrations.status_checker import get_tool_integrations

router = APIRouter(prefix="/integrations", tags=["Integrations"])

@router.get("/status", response_model=List[ToolIntegrationStatus])
def get_status(current_user: User = Depends(get_current_user)):
    return get_tool_integrations()
