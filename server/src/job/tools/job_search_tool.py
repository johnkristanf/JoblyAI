import json
from langchain_core.tools import tool
from src.job.service import JobsService

@tool("search_job")
async def search_job_tool(job_title: str, country: str = "us", date_posted: str = "all", page: str = "3") -> str:
    """
    Search for jobs matching the query using RapidAPI JSearch. Useful when you need to find real job listings for a user.
    
    Args:
        job_title (str): The job title or description to search for (e.g. 'Software Engineer').
        country (str): The 2-letter country code (e.g. 'us', 'gb', 'ph', 'sg'). Default is 'us'.
        date_posted (str): The date posted filter. Allowed values: 'all', 'today', '3days', 'week', 'month'. Default is 'all'.
        page (str): The number of pages to retrieve. Default is '3'.
    
    Returns:
        A JSON string containing the list of jobs found, or a message if none found.
    """
    service = JobsService()
    try:
        # RapidAPI JSearch call
        response = await service.search_rapidapi_jobs_jsearch(
            job_title=job_title,
            country=country,
            date_posted=date_posted,
            page=page
        )
        
        # Truncate properties to save token space before returning to the LLM
        if response and "data" in response and response["data"]:
            truncated_jobs = service.truncate_job_listing_properties(response["data"])
            return json.dumps({"jobs": truncated_jobs})
        else:
            return json.dumps({"jobs": [], "message": "No jobs found for this query."})
    except Exception as e:
        return json.dumps({"error": f"Failed to execute job search: {str(e)}"})
