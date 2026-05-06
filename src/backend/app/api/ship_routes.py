from fastapi import APIRouter

router = APIRouter()

@router.get("/", summary="Get ships")
def get_ship_routes():
    return [{"message": "List of ships"}]