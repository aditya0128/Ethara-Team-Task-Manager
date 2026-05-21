"""Authentication endpoints."""
import secrets
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User, PasswordResetToken
from ..schemas import (
    RegisterIn, LoginIn, TokenOut, UserOut,
    ForgotPasswordIn, ResetPasswordIn,
)
from ..auth import hash_password, verify_password, create_access_token
from ..deps import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenOut)
def register(payload: RegisterIn, response: Response, db: Session = Depends(get_db)):
    email = payload.email.lower().strip()
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(
        email=email,
        name=payload.name.strip(),
        password_hash=hash_password(payload.password),
        role=payload.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token(user.id, user.email, user.role)
    response.set_cookie(
        key="access_token", value=token, httponly=True, secure=False,
        samesite="lax", max_age=7 * 24 * 3600, path="/",
    )
    return TokenOut(access_token=token, user=UserOut.model_validate(user))


@router.post("/login", response_model=TokenOut)
def login(payload: LoginIn, response: Response, db: Session = Depends(get_db)):
    email = payload.email.lower().strip()
    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if payload.role and user.role != payload.role:
        raise HTTPException(
            status_code=403,
            detail=f"This account is registered as {user.role}, not {payload.role}",
        )
    token = create_access_token(user.id, user.email, user.role)
    response.set_cookie(
        key="access_token", value=token, httponly=True, secure=False,
        samesite="lax", max_age=7 * 24 * 3600, path="/",
    )
    return TokenOut(access_token=token, user=UserOut.model_validate(user))


@router.post("/logout")
def logout(response: Response, _user: User = Depends(get_current_user)):
    response.delete_cookie("access_token", path="/")
    return {"ok": True}


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return UserOut.model_validate(user)


@router.post("/forgot-password")
def forgot_password(payload: ForgotPasswordIn, db: Session = Depends(get_db)):
    """Mocked: returns the reset token in the response (no email is actually sent)."""
    email = payload.email.lower().strip()
    user = db.query(User).filter(User.email == email).first()
    if not user:
        # Avoid email enumeration; still pretend it worked.
        return {"ok": True, "message": "If the email exists, a reset link has been generated.", "reset_token": None}
    token = secrets.token_urlsafe(32)
    prt = PasswordResetToken(
        token=token,
        user_id=user.id,
        expires_at=datetime.now(timezone.utc) + timedelta(hours=1),
        used=False,
    )
    db.add(prt)
    db.commit()
    return {
        "ok": True,
        "message": "Reset token generated. (Mocked - in production this is emailed.)",
        "reset_token": token,
    }


@router.post("/reset-password")
def reset_password(payload: ResetPasswordIn, db: Session = Depends(get_db)):
    prt = db.query(PasswordResetToken).filter(PasswordResetToken.token == payload.token).first()
    expires = prt.expires_at if prt and prt.expires_at and prt.expires_at.tzinfo else (
        prt.expires_at.replace(tzinfo=timezone.utc) if prt and prt.expires_at else None
    )
    if not prt or prt.used or not expires or expires < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    user = db.query(User).filter(User.id == prt.user_id).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid token")
    user.password_hash = hash_password(payload.new_password)
    prt.used = True
    db.commit()
    return {"ok": True, "message": "Password updated successfully."}
