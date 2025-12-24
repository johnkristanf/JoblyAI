export type ResumeFile = {
    id: number
    fileName: string
    file: File
    previewUrl: string
}

export type ResumeData = {
    id: string
    name: string
    upload_date: string | null
    url: string
    objectKey: string
}

export type SelectedResume = {
    resume_id: string
    resume_source_url: string
}

export type RemoveResumeData = {
    id: string
    object_key: string
}
