import json
from fastapi import APIRouter


def json_serialize_llm_response(response):
    try:
        json_data = json.loads(response)
        return json_data
    except Exception:
        json_data = {
            "error": "Could not parse response as JSON.",
            "response": response,
        }
        return json_data


def group(prefix, *routers):
    group_router = APIRouter(prefix=prefix)
    for router, router_prefix, tags in routers:
        group_router.include_router(router, prefix=router_prefix, tags=tags)
    return group_router
