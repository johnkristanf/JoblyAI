import React from 'react'

type SalarySectionProps = {
    jobCountry?: string | null
    minSalary?: number | null
    maxSalary?: number | null
    salaryPeriod?: string | null
}

export function SalarySection({
    jobCountry,
    minSalary,
    maxSalary,
    salaryPeriod,
}: SalarySectionProps) {
    let salaryStr = 'amount not specified'

    // Format as currency (default to USD, no currency symbol for generic-ness)
    const formatNumber = (value: number) =>
        value.toLocaleString('en-US', {
            maximumFractionDigits: 0,
        })

    if (typeof minSalary === 'number' && typeof maxSalary === 'number') {
        salaryStr = `${formatNumber(minSalary)} to ${formatNumber(maxSalary)}`
    } else if (typeof minSalary === 'number') {
        salaryStr = `${formatNumber(minSalary)}`
    } else if (typeof maxSalary === 'number') {
        salaryStr = `${formatNumber(maxSalary)}`
    }

    let periodStr: React.ReactNode = null
    if (salaryPeriod) {
        periodStr = (
            <span className="ml-2 text-xs inline-block bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">
                {salaryPeriod === 'YEAR' && 'Yearly'}
                {salaryPeriod === 'MONTH' && 'Monthly'}
                {salaryPeriod === 'HOUR' && 'Hourly'}
                {salaryPeriod !== 'YEAR' &&
                    salaryPeriod !== 'MONTH' &&
                    salaryPeriod !== 'HOUR' &&
                    salaryPeriod}
            </span>
        )
    }

    return (
        <div className="mb-4">
            <span className="font-semibold text-gray-800 flex items-center gap-1">
                Salary <p className="text-xs text-gray-500">(currency varies by country)</p>:
            </span>{' '}
            <span className="text-gray-700 text-sm"> - {salaryStr}</span>
            {jobCountry && (
                <span className="inline-block bg-yellow-100 text-yellow-900 font-semibold px-2 py-0.5 rounded text-xs border border-yellow-400 shadow-sm ml-2">
                    {jobCountry}
                </span>
            )}
            {periodStr}
        </div>
    )
}
