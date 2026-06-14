import { useQuery } from '@tanstack/react-query'
export const meta = () => [{ title: 'Mock Interviews – JoblyAI' }]
import { getInterviews } from '~/lib/api/get'
import type { InterviewRecord, InterviewType } from '~/types/interview'
import { PageHeader } from '~/components/ui/page-header'
import FullScreenLoader from '~/components/full-screen-loader'
import { InterviewCard } from '~/components/interview/interview-card'

// ─── Page ─────────────────────────────────────────────────────────────────────

function InterviewsPage() {
    const { data: interviews = [], isLoading, error } = useQuery<InterviewRecord[]>({
        queryKey: ['interviews'],
        queryFn: getInterviews,
    })

    if (isLoading) return <FullScreenLoader message="Loading interviews…" />

    if (error) {
        return (
            <div className="w-full min-h-screen flex items-center justify-center">
                <div className="text-red-500">Failed to load interviews.</div>
            </div>
        )
    }

    return (
        <div className="w-full min-h-screen flex flex-col p-10">
            <PageHeader
                title="Mock Interviews"
                subtitle="All your AI mock interview sessions"
                className="mb-6 shrink-0"
            />

            {interviews.length === 0 ? (
                <div className="mt-8 bg-blue-50 border-l-4 border-blue-400 p-6 rounded-lg max-w-lg">
                    <p className="text-blue-800 font-medium">No interviews yet.</p>
                    <p className="text-blue-700 text-sm mt-1">
                        Start a mock interview from any matched job to see your history here.
                    </p>
                </div>
            ) : (
                <div className="max-h-[600px] overflow-y-auto flex flex-col gap-4 pr-1">
                    {interviews.map((interview) => (
                        <InterviewCard key={interview.id} interview={interview} />
                    ))}
                </div>
            )}
        </div>
    )
}

export default InterviewsPage
