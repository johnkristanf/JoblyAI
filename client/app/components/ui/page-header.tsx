import React from 'react'

interface PageHeaderProps {
    title: React.ReactNode
    subtitle?: React.ReactNode
    className?: string
    titleClassName?: string
    subtitleClassName?: string
}

export function PageHeader({
    title,
    subtitle,
    className = 'mb-6 shrink-0',
    titleClassName = 'text-2xl font-bold text-gray-900 flex items-center gap-2',
    subtitleClassName = 'text-md text-blue-600 font-normal mt-1'
}: PageHeaderProps) {
    return (
        <div className={className}>
            <h1 className={titleClassName}>{title}</h1>
            {subtitle && <div className={subtitleClassName}>{subtitle}</div>}
        </div>
    )
}
