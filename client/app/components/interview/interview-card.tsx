import type { InterviewRecord, InterviewType } from '~/types/interview'
import { INTERVIEW_TYPES, RESULT_CONFIG } from '~/constants/interview'
import { BrainCircuit, CalendarDays, Building2, Briefcase } from 'lucide-react'

// ─── Result badge ─────────────────────────────────────────────────────────────

export function ResultBadge({ result }: { result?: string }) {
    if (!result) {
        return (
            <span className="inline-block bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full text-xs font-medium">
                Pending review
            </span>
        )
    }
    const cfg = RESULT_CONFIG[result] ?? { label: result, classes: 'bg-gray-100 text-gray-600' }
    return (
        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${cfg.classes}`}>
            {cfg.label}
        </span>
    )
}

// ─── Type badge ───────────────────────────────────────────────────────────────

export function TypeBadge({ type }: { type: InterviewType }) {
    const cfg = INTERVIEW_TYPES.find((t) => t.id === type)
    const Icon = cfg?.icon ?? Briefcase
    return (
        <span className="inline-flex items-center gap-1 bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-xs font-medium">
            <Icon size={11} />
            {cfg?.title ?? type}
        </span>
    )
}

// ─── Card ─────────────────────────────────────────────────────────────────────

export function InterviewCard({ interview }: { interview: InterviewRecord }) {
    const date = new Date(interview.created_at).toLocaleDateString(undefined, {
        year: 'numeric', month: 'short', day: 'numeric',
    })

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col gap-4">

            {/* TOP ROW: Icon + Info */}
            <div className="flex items-start gap-4">
                {/* Avatar icon */}
                <div className="shrink-0 h-12 w-12 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                    <BrainCircuit className="text-indigo-500" size={24} />
                </div>

                {/* Title + Company */}
                <div className="flex-1 min-w-0">
                    <div className="font-bold text-indigo-700 text-base leading-snug">
                        {interview.job_title ?? 'Mock Interview'}
                    </div>
                    {interview.employer && (
                        <div className="flex items-center gap-1 text-gray-600 text-sm mt-0.5">
                            <Building2 size={13} className="shrink-0" />
                            {interview.employer}
                        </div>
                    )}
                </div>

                {/* Date */}
                <div className="shrink-0 flex items-center gap-1 text-gray-400 text-xs">
                    <CalendarDays size={13} />
                    {date}
                </div>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2">
                <TypeBadge type={interview.type} />
                <ResultBadge result={interview.result} />
            </div>

            {/* Feedback */}
            {interview.feedback && (
                <div className="bg-gray-50 border border-gray-100 rounded-lg p-3">
                    <p className="text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
                        AI Feedback
                    </p>
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {interview.feedback}
                    </p>
                </div>
            )}
        </div>
    )
}
