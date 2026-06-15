import httpx
import logging

from fastapi import Depends, HTTPException, status
from fastapi.concurrency import run_in_threadpool
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError

from src.config.runtime import params

security = HTTPBearer()

# Simple in-memory cache for the JWKS response.
# Keys rotate rarely, so a single-process cache is sufficient.
_jwks_cache: dict | None = None
logger = logging.getLogger("auth")


async def get_jwks() -> dict:
    """Fetch and cache the public JWKS from Supabase."""
    global _jwks_cache
    if _jwks_cache is not None:
        return _jwks_cache

    url = f"{params['SUPABASE_URL']}/auth/v1/.well-known/jwks.json"
    async with httpx.AsyncClient() as client:
        response = await client.get(url)
        response.raise_for_status()
        _jwks_cache = response.json()
    return _jwks_cache


async def decode_supabase_token(token: str) -> dict:
    """
    Decode and verify a Supabase-issued JWT using the project's public JWKS.
    Supports RS256 (new signing keys) and falls back to HS256 (legacy secret)
    so the app keeps working during the dashboard migration window.
    """
    jwks = await get_jwks()

    logger.info(
        "Authentication token",
        extra={
            "token": token,
        },
    )

    print(f"JWKS: {jwks}")

    # Determine which algorithms the current JWKS advertises.
    # After dashboard migration the JWKS will contain RSA keys; before
    # migration it returns an empty key set, so we fall back to HS256.
    has_asymmetric_keys = bool(jwks.get("keys"))

    try:
        if has_asymmetric_keys:
            payload = await run_in_threadpool(
                jwt.decode,
                token,
                jwks,
                algorithms=["RS256", "ES256"],
                audience="authenticated",
            )
        else:
            # Legacy path: JWKS not yet enabled, use the shared secret.
            payload = await run_in_threadpool(
                jwt.decode,
                token,
                params["SUPABASE_JWT_SECRET"],
                algorithms=["HS256"],
                audience="authenticated",
            )
    except JWTError as exc:
        raise exc  # let callers convert to HTTP/WS errors

    return payload


async def verify_user_from_token(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    """
    FastAPI dependency: verify the JWT in the Authorization header.
    """
    token = credentials.credentials
    try:
        payload = await decode_supabase_token(token)
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {exc}",
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token: missing user ID",
        )

    return {"id": user_id, "email": payload.get("email")}
