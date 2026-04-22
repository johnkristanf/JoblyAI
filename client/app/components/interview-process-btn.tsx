import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { BrainCircuit } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip'
import { InterviewProcessModal } from './interview-process-modal'
import { generateInterviewProcess } from '~/lib/api/post'
import type { JobMatch } from '~/types/job_search'
import { toast } from 'sonner'

type InterviewProcessBtnProps = {
    job: JobMatch
}

export function InterviewProcessBtn({ job }: InterviewProcessBtnProps) {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [processText, setProcessText] = useState<string | null>(null)

    const mutation = useMutation({
        mutationFn: () => generateInterviewProcess(job),
        onSuccess: (data) => {
            setProcessText(data.process)
        },
        onError: () => {
            toast.error('Failed to generate interview guide. Please try again.')
            setIsModalOpen(false)
        },
    })

    const handleClick = () => {
        setProcessText(null)
        setIsModalOpen(true)
        mutation.mutate()
    }

    return (
        <>
            <Tooltip>
                <TooltipTrigger asChild>
                    <button
                        onClick={handleClick}
                        aria-label="How to pass this interview"
                        className="hover:cursor-pointer hover:opacity-75 transition-opacity"
                    >
                        <BrainCircuit className="size-5 text-indigo-500" />
                    </button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>How to pass this interview</p>
                </TooltipContent>
            </Tooltip>

            <InterviewProcessModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                process={processText}
                isLoading={mutation.isPending}
                jobTitle={job.job_title}
            />
        </>
    )
}
