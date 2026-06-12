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