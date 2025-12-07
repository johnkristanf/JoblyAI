import asyncio
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


def chunk_list(items, size):
    for i in range(0, len(items), size):
        yield items[i : i + size]
       
async def retry(fn, retries=3, delay=0.5):
    try:
        return await fn()
    except Exception:
        if retries <= 0:
            raise
        await asyncio.sleep(delay)
        return await retry(fn, retries-1, delay)


async def extract_data_from_batch_tasks(list_data, awaitable, params, batch_size=10):
    batches = list(chunk_list(list_data, batch_size))

    print(f"Total list_data: {len(list_data)}")
    print(f"Processing {len(batches)} batches...")

    tasks = []
    for i, batch in enumerate(batches):
        print(f"Scheduling batch {i+1}/{len(batches)}...")
        tasks.append(
            retry(lambda b=batch: awaitable(b, params))
        )

    results = await asyncio.gather(*tasks)
    
    print(f"results: {results}")

    # Each result is a dict like {"listings": [...]}
    flattened = []
    for result in results:
        # supports either {"listings": [...]} or a raw list
        if "listings" in result:
            flattened.extend(result["listings"])
        else:
            flattened.extend(result)
    
    print(f"flattened: {flattened}")
    return flattened
