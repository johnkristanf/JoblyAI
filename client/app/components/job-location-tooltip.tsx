import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip'
import { Map } from 'lucide-react'

type JobLocationTooltipProps = {
    job_latitude: number
    job_longitude: number
    job_title?: string
    employer_name?: string
}

export function JobLocationTooltip({
    job_latitude,
    job_longitude,
    job_title,
    employer_name,
}: JobLocationTooltipProps) {
    const params = new URLSearchParams({
        lat: String(job_latitude),
        lng: String(job_longitude),
        ...(job_title ? { title: job_title } : {}),
        ...(employer_name ? { employer: employer_name } : {}),
    })

    const locationUrl = `/job/location?${params.toString()}`

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <a
                    href={locationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="View job location on interactive map"
                >
                    <Map className="size-5 text-gray-600 hover:cursor-pointer hover:opacity-75" />
                </a>
            </TooltipTrigger>
            <TooltipContent>
                <p>View job location on map</p>
            </TooltipContent>
        </Tooltip>
    )
}
