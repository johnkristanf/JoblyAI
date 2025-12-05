import React from 'react'

type DescriptionSectionProps = {
    description?: string | null
}

export function DescriptionSection({ description }: DescriptionSectionProps) {
    if (!description) {
        return null
    }

    return (
        <div className="mb-2">
            <span className="font-semibold text-gray-800 ">Job Summary:</span>
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
