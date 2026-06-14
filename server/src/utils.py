import asyncio
import io
import json
from fastapi import APIRouter
import pymupdf
from docx import Document
import logging

logger = logging.getLogger("utils")


def json_decode(response):
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
        return await retry(fn, retries - 1, delay)


async def extract_data_from_batch_tasks(list_data, awaitable, params, batch_size=10):
    batches = list(chunk_list(list_data, batch_size))

    logger.info(f"Total list_data: {len(list_data)}")
    logger.info(f"Processing {len(batches)} batches...")

    tasks = []
    for i, batch in enumerate(batches):
        logger.info(f"Scheduling batch {i+1}/{len(batches)}...")
        tasks.append(retry(lambda b=batch: awaitable(b, params)))

    results = await asyncio.gather(*tasks)

    flattened = []
    for result in results:
        if isinstance(result, dict):
            if "error" in result:
                logger.warning(f"Skipping failed batch result: {result.get('error')}")
                continue
            if "listings" in result:
                flattened.extend(result["listings"])
        elif isinstance(result, list):
            flattened.extend(item for item in result if isinstance(item, dict))
        else:
            logger.warning(f"Skipping unexpected batch result type: {type(result)}")

    return flattened


def read_return_pdf_content_stream(stream_content):
    extracted_content_text = ""
    doc = pymupdf.open(stream=stream_content, filetype="pdf")
    for page in doc:
        extracted_content_text += page.get_text()

    return extracted_content_text


def get_file_extension(filename: str) -> str:
    """Returns the lowercase file extension without the dot, or an empty string."""
    return filename.rsplit(".", 1)[-1].lower() if "." in filename else ""


ALLOWED_RESUME_CONTENT_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
}
ALLOWED_RESUME_EXTENSIONS = {"pdf", "doc", "docx"}


def is_valid_resume_file(filename: str, content_type: str) -> bool:
    ext = (filename.rsplit(".", 1)[-1].lower()) if "." in filename else ""
    return (
        content_type in ALLOWED_RESUME_CONTENT_TYPES
        or ext in ALLOWED_RESUME_EXTENSIONS
    )


def read_return_docx_content(stream_content: bytes) -> str:
    """Extract plain text from a .docx file byte stream."""
    doc = Document(io.BytesIO(stream_content))
    return "\n".join(paragraph.text for paragraph in doc.paragraphs)


def clean_markdown_json(json_str: str) -> str:
    """Removes markdown formatting blocks from a JSON string."""
    cleaned = json_str.strip()
    if "```" in cleaned:
        cleaned = cleaned.split("```")[1]
        if cleaned.strip().startswith("json"):
            cleaned = cleaned.strip()[4:]
    return cleaned.strip()
