import type { JobMatch } from '~/types/job_search'
import { SaveJobBtn } from './ui/save-job-btn'

export function JobPublisherHeader({ job }: { job: JobMatch }) {
    return (
        <div
            className={`flex items-center mt-3 ${job.job_publisher ? 'justify-between' : 'justify-end'}`}
        >
            {job.job_publisher && (
                <div className="w-[30%] text-center bg-blue-200 border-2 border-blue-500 text-sm text-blue-900 mb-2  px-2 py-0.5 rounded z-10">
                    {job.job_publisher}
                </div>
            )}

            {/* ACTIONS */}

            <div className="flex items-center justify-end gap-4">
                <SaveJobBtn job={job} />
                <a
                    href={job.job_apply_link ?? ''}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-blue-600 hover:cursor-pointer hover:opacity-75 text-white text-sm rounded px-4 py-2 font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors"
                >
                    Apply
                </a>
            </div>
        </div>
    )
}
