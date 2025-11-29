export type JobSearchForm = {
    job_title: string
    experience_level: string
    date_posted: string
    country: string
    professional_summary: string
}

export type JobMatch = {
    job_title: string
    job_description: string
    job_employment_type: string
    job_apply_link: string
    job_apply_is_direct: boolean
    employer_name: string
    employer_logo: string | null
    employer_website: string | null
    job_min_salary: number | null
    job_max_salary: number | null
    job_salary_period: string | null
    job_posted_at: string
    extraction_note: string
    job_is_remote: boolean
}

export type JobSearchResponse = {
    job_listings: JobMatch[]
    jobs_matched: JobMatch[]
}
