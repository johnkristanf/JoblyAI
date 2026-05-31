export type JobSearchForm = {
    job_title: string
    experience_level: string
    date_posted: string
    country: string
    professional_summary: string
    job_platform: 'all' | 'linkedin'
}

export type JobMatch = {
    job_title: string
    job_description: string
    job_employment_type: string
    job_apply_link: string
    job_apply_is_direct: boolean
    job_country: string
    job_is_remote: boolean
    job_publisher: string

    job_latitude: number
    job_longitude: number

    employer_name: string
    employer_logo: string | null
    employer_website: string | null

    job_min_salary: number | null
    job_max_salary: number | null
    job_salary_period: string | null

    job_posted_at: string
    extraction_note: string
    skills_score: number
    experience_score: number
    overall_score: number
    match_insights?: {
        relevant_experience: string | null
        seniority: string | null
        skills: string | null
        education: string | null
    } | null
}

export type ResumeMatchingResponse = {
    jobs_matched: JobMatch[]
    resume_upload_task_id?: string
}

export type SavedJobs = {
    id: number
    job_title: string | null
    job_description: string | null
    job_employment_type: string | null
    job_apply_link: string | null
    job_apply_is_direct: boolean | null
    job_country: string
    job_publisher: string

    job_latitude: number
    job_longitude: number

    employer_name: string | null
    employer_logo: string | null
    employer_website: string | null

    job_min_salary: number | null
    job_max_salary: number | null
    job_salary_period: string | null

    extraction_note: string | null
    job_is_remote: boolean | null
}
