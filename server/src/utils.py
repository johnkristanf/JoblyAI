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



async def extract_all_listing_from_batching(listings, batch_size=10):
    batches = list(chunk_list(listings, batch_size))

    print(f"Total listings: {len(listings)}")
    print(f"Processing {len(batches)} batches...")

    tasks = []
    for i, batch in enumerate(batches):
        print(f"Scheduling batch {i+1}/{len(batches)}...")
        tasks.append(
            retry(lambda b=batch: extract_batch(b))
        )

    results = await asyncio.gather(*tasks)

    # Each result is a dict like {"listings": [...]}
    flattened = []
    for result in results:
        # supports either {"listings": [...]} or a raw list
        if "listings" in result:
            flattened.extend(result["listings"])
        else:
            flattened.extend(result)

    return flattened
