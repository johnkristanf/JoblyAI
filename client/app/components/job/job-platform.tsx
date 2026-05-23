import React from 'react'
import { Globe, Linkedin } from 'lucide-react'

interface JobPlatformProps {
    isPending: boolean
    selectedJobPlatform: 'all' | 'linkedin'
    setSelectedJobPlatform: (platform: 'all' | 'linkedin') => void
    setValue: any
}

export function JobPlatform({
    isPending,
    selectedJobPlatform,
    setSelectedJobPlatform,
    setValue
}: JobPlatformProps) {
    return (
        <div className="flex flex-col">
            <label className="mb-1 text-gray-700 font-medium">
                Job Platform
            </label>
            <div className="flex gap-2 mt-1 w-3/4">
                <button
                    type="button"
                    onClick={() => {
                        setSelectedJobPlatform('all')
                        setValue('job_platform', 'all')
                    }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-medium transition-all ${
                        selectedJobPlatform === 'all'
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    disabled={isPending}
                >
                    <Globe className="w-4 h-4" />
                    All Platforms
                </button>
                <button
                    type="button"
                    onClick={() => {
                        setSelectedJobPlatform('linkedin')
                        setValue('job_platform', 'linkedin')
                    }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-medium transition-all ${
                        selectedJobPlatform === 'linkedin'
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    disabled={isPending}
                >
                    <Linkedin className="w-4 h-4" />
                    LinkedIn Only
                </button>
            </div>
        </div>
    )
}
