
from fastapi import APIRouter


def group(prefix, *routers):
    group_router = APIRouter(prefix=prefix)
    for router, router_prefix, tags in routers:
        group_router.include_router(router, prefix=router_prefix, tags=tags)
    return group_router
