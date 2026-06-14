import { Briefcase, Code2, Users } from "lucide-react";
import type { InterviewType } from "~/types/interview";

export const statusLabel: Record<typeof status, string> = {
    connecting: 'Connecting…',
    listening: 'Listening…',
    thinking: 'Thinking…',
    speaking: 'Speaking',
    ended: 'Session ended',
    error: 'Error',
}

export const INTERVIEW_TYPES: { id: InterviewType; title: string; icon: any }[] = [
    { id: 'HR_SCREENING', title: 'HR Screening', icon: Briefcase },
    { id: 'TECHNICAL', title: 'Technical', icon: Code2 },
    { id: 'BEHAVIORAL', title: 'Behavioral', icon: Users },
]

export const RESULT_CONFIG: Record<string, { label: string; classes: string }> = {
    EXCELLENT:        { label: 'Excellent',         classes: 'bg-emerald-100 text-emerald-700' },
    PASSED:           { label: 'Passed',             classes: 'bg-green-100 text-green-700' },
    BORDERLINE:       { label: 'Borderline',         classes: 'bg-yellow-100 text-yellow-700' },
    NEEDS_IMPROVEMENT:{ label: 'Needs Improvement',  classes: 'bg-orange-100 text-orange-700' },
    FAILED:           { label: 'Failed',             classes: 'bg-red-100 text-red-700' },
    INCOMPLETE:       { label: 'Incomplete',         classes: 'bg-gray-100 text-gray-500' },
}
