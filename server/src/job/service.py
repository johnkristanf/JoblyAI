import requests
from src.config import settings


def search_adzuna_jobs(self, query, location, country="us"):
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
        "app_id": settings.ADZUNA_APP_ID,
        "app_key": settings.ADZUNA_APP_KEY,
        "what": query,
        "where": location,
        "results_per_page": 20,
    }

    response = requests.get(url, params=params)
    if response.status_code == 401:
        print("Authorization failed: Please check your app_id and app_key.")
        print(
            "If you do not have valid credentials, register for free at https://developer.adzuna.com/ to get them."
        )
        return None
    elif response.status_code != 200:
        print(f"Error: Received status code {response.status_code}")
        print(response.text)
        return None

    return response.json()

def search_rapidapi_jobs_jsearch(job_title, country, date_posted, page):
    """
    Free tier: 150 requests/month
    API: https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch
    """

    url = "https://jsearch.p.rapidapi.com/search"

    querystring = {
        "query": f"{job_title} ",
        "country": country,
        "page": page,
        "num_pages": page,
        "date_posted": date_posted,
    }

    headers = {
        "X-RapidAPI-Key": settings.RAPID_API_KEY,
        "X-RapidAPI-Host": settings.RAPID_API_HOST,
    }

    response = requests.get(url, headers=headers, params=querystring)
    return response.json()
