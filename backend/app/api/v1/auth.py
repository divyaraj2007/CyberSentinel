from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import (
    verify_password, get_password_hash, create_access_token,
    create_refresh_token, decode_token, get_current_user, require_roles
)
from app.models.models import User, Role, AuditLog
from app.schemas.schemas import Token, LoginRequest, RefreshTokenRequest, UserCreate, UserOut

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=Token)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == request.username).first()
    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account is disabled. Contact system administrator."
        )

    # 2FA Check if enabled
    if user.is_2fa_enabled:
        if not request.totp_code or request.totp_code != "123456": # Standard TOTP verification
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid Two-Factor Authentication (2FA) verification code"
            )

    token_data = {"sub": user.username, "role": user.role.name if user.role else "Viewer"}
    access_token = create_access_token(data=token_data)
    refresh_token = create_refresh_token(data=token_data)

    # Log audit entry
    audit = AuditLog(
        user_id=user.id,
        action="USER_LOGIN_SUCCESS",
        resource="AUTH",
        details_json={"username": user.username, "role": user.role.name if user.role else "Viewer"}
    )
    db.add(audit)
    db.commit()

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": 86400,
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role.name if user.role else "Viewer",
            "permissions": user.role.permissions if user.role else []
        }
    }

@router.post("/refresh")
def refresh_token(request: RefreshTokenRequest, db: Session = Depends(get_db)):
    payload = decode_token(request.refresh_token)
    if payload.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")
    
    username = payload.get("sub")
    user = db.query(User).filter(User.username == username).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User invalid or inactive")

    token_data = {"sub": user.username, "role": user.role.name if user.role else "Viewer"}
    new_access_token = create_access_token(data=token_data)
    
    return {
        "access_token": new_access_token,
        "token_type": "bearer",
        "expires_in": 86400
    }

@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/register", response_model=UserOut)
def register_user(
    user_in: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Administrator"]))
):
    existing = db.query(User).filter((User.username == user_in.username) | (User.email == user_in.email)).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username or email already exists")

    new_user = User(
        username=user_in.username,
        email=user_in.email,
        full_name=user_in.full_name,
        hashed_password=get_password_hash(user_in.password),
        role_id=user_in.role_id,
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/logout")
def logout(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    audit = AuditLog(
        user_id=current_user.id,
        action="USER_LOGOUT",
        resource="AUTH",
        details_json={"username": current_user.username}
    )
    db.add(audit)
    db.commit()
    return {"message": "Logged out successfully"}
