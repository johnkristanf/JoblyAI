import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Telescope } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip'
import { EmployerInsightsModal } from './employer-insights-modal'
import { generateEmployerInsights } from '~/lib/api/post'
import { toast } from 'sonner'

type EmployerInsightsBtnProps = {
    employerName?: string | null
    employerWebsite: string
}

export function EmployerInsightsBtn({ employerName, employerWebsite }: EmployerInsightsBtnProps) {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [insightsText, setInsightsText] = useState<string | null>(null)

    const mutation = useMutation({
        mutationFn: () => generateEmployerInsights(employerWebsite),
        onSuccess: (data) => {
            setInsightsText(data.insights)
        },
        onError: () => {
            toast.error('Failed to generate employer insights. Please try again.')
            setIsModalOpen(false)
        },
    })

    const handleClick = () => {
        setInsightsText(null)
        setIsModalOpen(true)
        mutation.mutate()
    }

    return (
        <>
            <Tooltip>
                <TooltipTrigger asChild>
                    <button
                        onClick={handleClick}
                        aria-label="View Employer Insights"
                        className="hover:cursor-pointer hover:opacity-75 transition-opacity ml-2 focus:outline-none"
                    >
                        <Telescope className="size-4 text-indigo-500" />
                    </button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>View Employer Insights</p>
                </TooltipContent>
            </Tooltip>

            <EmployerInsightsModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                insights={insightsText}
                isLoading={mutation.isPending}
                employerName={employerName}
            />
        </>
    )
}
