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
            <span className="font-semibold text-gray-800 ">Description:</span>
            <div className="text-gray-700 text-sm line-clamp-5">{description}</div>
        </div>
    )
}
