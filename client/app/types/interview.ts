export type InterviewStatus =
    | 'connecting'
    | 'listening'
    | 'thinking'
    | 'speaking'
    | 'ended'
    | 'error'

export interface Transcript {
    role: 'user' | 'ai'
    text: string
    id: number
}

export type InterviewType = 'TECHNICAL' | 'BEHAVIORAL' | 'HR_SCREENING'

export interface InterviewRecord {
    id: string
    type: InterviewType
    job_title?: string
    employer?: string
    result?: string
    feedback?: string
    transcripts?: Transcript[]
    created_at: string
}

export interface CreateInterviewPayload {
    type: InterviewType
    job_title?: string | null
    employer?: string | null
    resume_object_key?: string | null
}