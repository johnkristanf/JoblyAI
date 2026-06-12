# Resume Matching Feature - Technical Flow

This document outlines the architecture and technical flow of the Resume Matching feature. This feature evaluates a user's resume against a set of job listings to determine suitability, utilizing background processing for heavy LLM operations.

## Overview
The resume matching process is initiated via a REST API endpoint and heavily relies on background task workers (Celery) to perform the actual matching against job descriptions using Large Language Models (LLMs) without blocking the client.

## API Endpoint: `POST /match-resume`

The entry point for this feature accepts form data specifying the job search criteria and the user's resume (either as a new file upload or an existing reference).

**Input Parameters (Form Data):**
*   `job_title`: The title of the job to search for.
*   `date_posted`: Timeframe for the job posting.
*   `country`: Location of the jobs.
*   `job_platform`: The target platform to search on (defaults to "all").
*   `new_resume`: (Optional) An uploaded file representing a new resume.
*   `existing_resume`: (Optional) An identifier/key for an already uploaded resume.

## Execution Flow

1.  **Job Search Retrieval:**
    *   The server uses the provided search criteria (`job_title`, `country`, `date_posted`, `job_platform`) to query an external job aggregation service or internal database via `jobs_service.get_job_search_results`.
    *   A limited number of jobs (e.g., top 3 pages) are fetched for evaluation.

2.  **Resume Processing & Storage:**
    *   The system processes the provided resume via `resume_service.process_resume_for_job_search`.
    *   If a `new_resume` file is uploaded, a background task is typically spawned to upload it to cloud storage (e.g., AWS S3).
    *   The raw text of the resume is extracted and returned along with relevant tracking IDs (`upload_task_id` and `existing_resume_object_key`).

3.  **Data Pre-processing (Token Optimization):**
    *   **Job Listings:** The raw job listings returned from the search are passed through `jobs_service.truncate_job_listing_properties`. This step removes unnecessary or overly verbose fields (like full HTML descriptions) to fit within LLM context limits and reduce token costs.
    *   **Resume Extraction:** The raw `resume_text` is passed to `jobs_service.extract_resume_fields`. This step structure the raw text into a standard format (e.g., JSON representation of skills, experience, and education). This is done synchronously (inline) using Redis for potential caching before the background task starts.

4.  **Asynchronous Job Matching (Celery Worker):**
    *   The pre-processed `job_listings` and the `extracted_resume_fields` are dispatched to a background Celery task: `job_matching.delay()`.
    *   This background worker is responsible for running the heavy LLM prompts that compare the structured resume data against each job listing to generate match scores and tailored feedback.

5.  **Immediate Client Response:**
    *   The API endpoint does not wait for the LLM evaluation to finish. It immediately returns a JSON response to the client containing:
        *   `message`: Success confirmation.
        *   `job_matching_task_id`: The Celery task ID for the job matching process, which the client can use to poll for progress or completion via WebSockets or polling.
        *   `resume_upload_task_id`: The task ID for the resume upload process (if a new resume was provided).
        *   `existing_resume_object_key`: The storage key of the resume used.

## Asynchronous Architecture
By offloading the actual LLM comparison to a Celery worker, the main FastAPI application remains responsive. The client is expected to use the returned `job_matching_task_id` to listen for updates (often via a separate WebSocket connection or status polling endpoint) as the worker evaluates each job listing.
