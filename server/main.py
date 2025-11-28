import requests



def search_adzuna_jobs(query, location, app_id, app_key, country="us"):
    """
    Searches Adzuna jobs API for the given query and location.

    Args:
        query (str): The job search query.
        location (str): The job location.
        app_id (str): Your Adzuna application ID.
        app_key (str): Your Adzuna application Key.
        country (str): The country code for the search ("us" or "gb" or others). Defaults to "us".

    Returns:
        dict: The JSON response from the Adzuna API.
    """

    url = f"https://api.adzuna.com/v1/api/jobs/{country}/search/1"
    params = {
        'app_id': app_id,
        'app_key': app_key,
        'what': query,
        'where': location,
        'results_per_page': 20
    }

    response = requests.get(url, params=params)
    if response.status_code == 401:
        print("Authorization failed: Please check your app_id and app_key.")
        print("If you do not have valid credentials, register for free at https://developer.adzuna.com/ to get them.")
        return None
    elif response.status_code != 200:
        print(f"Error: Received status code {response.status_code}")
        print(response.text)
        return None

    return response.json()


def search_rapidapi_jobs_jsearch(query, location, page=1):
    """
    Free tier: 150 requests/month
    API: https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch
    """
    
    url = "https://jsearch.p.rapidapi.com/search"
    
    querystring = {
        "query": f"{query} in {location}",
        "page": str(page),
        "num_pages": "1",
        "date_posted": "all"  # all, today, 3days, week, month
    }
    
    headers = {
        "X-RapidAPI-Key": "0b09a2fbc4mshc34b40d03bc72efp1b01d5jsndadc4344e635",
        "X-RapidAPI-Host": "jsearch.p.rapidapi.com"
    }
    
    response = requests.get(url, headers=headers, params=querystring)
    return response.json()


YOUR_APP_ID = "d3278aef"
YOUR_APP_KEY = "35af211fe044de09ff1960ca035cf78c"

jobs = search_adzuna_jobs(
    query="data analyst",
    location="New York",
    app_id=YOUR_APP_ID,
    app_key=YOUR_APP_KEY,
    country="us"  # Use "us" for United States, "gb" for United Kingdom, etc.
)

jobs = search_rapidapi_jobs_jsearch("software engineer", "San Francisco")
print(f"jobs {jobs}")

# Process results
for job in jobs['data']:
    print(f"Title: {job['job_title']}")
    print(f"Company: {job['employer_name']}")
    print(f"Location: {job['job_city']}, {job['job_country']}")
    print(f"Posted: {job['job_posted_at_datetime_utc']}")
    print(f"Link: {job['job_apply_link']}")
    print(f"Description: {job['job_description'][:200]}...")
    print("---\n")
    

# If jobs data was returned, process it:
# if jobs and "results" in jobs:
#     for job in jobs['results']:
#         print(f"Title: {job['title']}")
#         print(f"Company: {job['company']['display_name']}")
#         print(f"Location: {job['location']['display_name']}")
#         print(f"Salary: {job.get('salary_min', 'Not specified')}")
#         print("---")