from fastapi import Depends, HTTPException, status
from fastapi.concurrency import run_in_threadpool
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError

from src.config.runtime import params

# from src.config import settings

security = HTTPBearer()


async def verify_user_from_token(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    """
    Verify the JWT token sent by the client.
    This function decodes the token and validates it using Supabase's JWT secret.
    """
    token = credentials.credentials

    try:
        # Decode the JWT token
        payload = await run_in_threadpool(jwt.decode,
            token,
            params["SUPABASE_JWT_SECRET"],
            algorithms=["HS256"],
            audience="authenticated",  # Supabase uses 'authenticated' as audience
        )

        # Extract user information from payload
        user_id = payload.get("sub")
        email = payload.get("email")

        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing user ID",
            )

        return {"id": user_id, "email": email}

    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Invalid token: {str(e)}"
        )
