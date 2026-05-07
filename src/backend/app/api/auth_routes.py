from fastapi import APIRouter, Depends
from app.infra.auth.users import auth_backend, get_current_user, fastapi_users

from fastapi_users import schemas

from app.infra.data.models.User import User
from app.schemas import UserRead, UserCreate, UserUpdate

router = APIRouter()

router.include_router(
    fastapi_users.get_auth_router(auth_backend), prefix="/jwt", tags=["auth"]
)

router.include_router(
    fastapi_users.get_register_router(UserRead, UserCreate),
    tags=["auth"],
)
router.include_router(
    fastapi_users.get_reset_password_router(),
    tags=["auth"],
)
router.include_router(
    fastapi_users.get_verify_router(UserRead),
    tags=["auth"],
)
router.include_router(
    fastapi_users.get_users_router(UserRead, UserUpdate),
    prefix="/users",
    tags=["users"],
)

@router.get("/authenticated-route")
async def authenticated_route(user: User = Depends(get_current_user)):
    return {"message": f"Hello {user.email}!"}