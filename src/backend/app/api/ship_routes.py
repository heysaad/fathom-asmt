from fastapi import APIRouter

router = APIRouter()

@router.get("/", summary="Get ship routes")
def get_ship_routes():
    return [{"message": "List of ship routes"}]