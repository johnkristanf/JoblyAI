import React, { useMemo } from 'react'

type DescriptionSectionProps = {
    description?: string | null
    label?: string
}

// Helper function to estimate line count
function getDescriptionLineCount(description: string): number {
    if (!description) return 0
    // count newlines, or count bullets if present
    if (description.includes('- ')) {
        return description.split('\n').filter(l => l.trim()).length
    }
    // assume every 80 chars is approx one line (fallback)
    return Math.ceil(description.length / 80)
}

function getHeightClass(lineCount: number): string {
    if (lineCount <= 8)  return "min-h-[6rem]"
    if (lineCount <= 15) return "min-h-[10rem]"
    if (lineCount <= 30) return "min-h-[15rem]"
    return "min-h-[20rem]"
}

export function DescriptionSection({ description, label = 'Job Summary:' }: DescriptionSectionProps) {
    if (!description) {
        return null
    }

    // Estimate line count and map to a min/max height
    const lineCount = useMemo(() => getDescriptionLineCount(description), [description])

    // Dynamic height rules
    // e.g., 1-8 lines: 6rem. 9-15: 10rem. 16-30: 15rem. Above 30: 20rem.
    const heightClass = getHeightClass(lineCount)

    return (
        <div className={`mb-2 ${heightClass} max-h-80 overflow-y-auto `}>
            <span className="font-semibold text-gray-800 ">{label}</span>
            <div className="text-gray-700 text-sm whitespace-pre-line">
                {description.includes('- ') ? (
                    description.split('\n').map((line, idx) =>
                        line.trim().startsWith('- ')
                            ? (
                                <div key={idx}>
                                    <span className="inline-block pl-4 mt-3">• {line.trim().slice(2)}</span>
                                </div>
                            ) : (
                                <div key={idx}>{line}</div>
                            )
                    )
                ) : (
                    description
                )}
            </div>
        </div>
    )
}
