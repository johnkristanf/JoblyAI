import json
from langchain_core.tools import tool
from src.job.service import JobsService

@tool("search_jsearch_job")
async def search_jsearch_job_tool(job_title: str, country: str = "us", date_posted: str = "all", page: str = "3") -> str:
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

@tool("search_linkedin_job")
async def search_linkedin_job_tool(title_filter: str, location_filter: str = "United States", limit: str = "10") -> str:
    """
    Search for active jobs specifically on LinkedIn using the LinkedIn Job Search RapidAPI.
    
    Args:
        title_filter (str): The job title to search for (e.g. 'Data Engineer').
        location_filter (str): The location to search in (e.g. 'United States' or 'United Kingdom').
        limit (str): The number of jobs to retrieve. Default is '10'.
    
    Returns:
        A JSON string containing the list of jobs found from LinkedIn, or an error message.
    """
    service = JobsService()
    try:
        response = await service.search_rapidapi_linkedin_jobs(
            title_filter=title_filter,
            location_filter=location_filter,
            limit=limit
        )
        
        # The API usually returns a list of dictionaries if successful
        if response and isinstance(response, list) and len(response) > 0:
            # We can map or truncate if needed, for now just return the JSON string directly
            # You might want to filter out huge description texts if token limits are an issue
            return json.dumps({"jobs": response})
        elif response and isinstance(response, dict) and "data" in response:
            return json.dumps({"jobs": response["data"]})
        else:
            return json.dumps({"jobs": [], "message": "No jobs found for this query on LinkedIn."})
    except Exception as e:
        return json.dumps({"error": f"Failed to execute LinkedIn job search: {str(e)}"})
