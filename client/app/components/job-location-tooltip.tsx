import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip'
import { Globe } from 'lucide-react'

type JobLocationTooltipProps = {
    job_latitude: number
    job_longitude: number
}

export function JobLocationTooltip({ job_latitude, job_longitude }: JobLocationTooltipProps) {
    const mapsUrl = `https://www.google.com/maps?q=${job_latitude},${job_longitude}`

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Open job location in Google Maps"
                >
                    <Globe className="size-5 text-gray-600 hover:cursor-pointer hover:opacity-75" />
                </a>
            </TooltipTrigger>
            <TooltipContent>
                <p>View job location on map</p>
            </TooltipContent>
        </Tooltip>
    )
}
