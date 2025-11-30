import type { JobSearchResponse } from '~/types/job_search'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { OtherJobListCard } from './other-job-list-card'

type OtherJobListingsDialogProps = {
    jobSearchResponse: JobSearchResponse
}

export function OtherJobListingsDialog({ jobSearchResponse }: OtherJobListingsDialogProps) {
    console.log("jobSearchResponse: ", jobSearchResponse);
    
    return (
        <Dialog>
            <DialogTrigger asChild>
                <button className="bg-blue-600 hover:cursor-pointer hover:opacity-75 text-white text-sm rounded px-4 py-2 font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors">
                    Show Other Job Postings
                </button>
            </DialogTrigger>
            <DialogContent className="h-[90%] max-w-5xl! overflow-y-auto">
                <OtherJobListCard jobSearchResponse={jobSearchResponse} />
            </DialogContent>
        </Dialog>
    )
}
