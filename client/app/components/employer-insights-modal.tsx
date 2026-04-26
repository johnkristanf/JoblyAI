import ReactMarkdown from 'react-markdown'
import { X } from 'lucide-react'

type EmployerInsightsModalProps = {
    isOpen: boolean
    onClose: () => void
    insights: string | null
    isLoading: boolean
    employerName?: string | null
}

const mdComponents: React.ComponentProps<typeof ReactMarkdown>['components'] = {
    h2: ({ children }) => (
        <h2 className="text-base font-bold text-indigo-700 mt-5 mb-1.5">{children}</h2>
    ),
    h3: ({ children }) => (
        <h3 className="text-sm font-semibold text-gray-800 mt-4 mb-1">{children}</h3>
    ),
    p: ({ children }) => <p className="text-sm text-gray-700 mb-2 leading-relaxed">{children}</p>,
    ul: ({ children }) => (
        <ul className="list-disc list-inside text-sm text-gray-700 mb-2 space-y-1">{children}</ul>
    ),
    li: ({ children }) => <li className="leading-relaxed">{children}</li>,
    strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
}

export function EmployerInsightsModal({
    isOpen,
    onClose,
    insights,
    isLoading,
    employerName,
}: EmployerInsightsModalProps) {
    if (!isOpen) return null

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <div
                className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-gray-100">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">
                            Employer Insights
                        </h2>
                        {employerName && (
                            <p className="text-sm text-indigo-600 mt-0.5 font-medium">{employerName}</p>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="ml-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                        aria-label="Close modal"
                    >
                        <X className="size-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="overflow-y-auto px-6 py-5 flex-1">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-4">
                            <svg
                                className="animate-spin h-10 w-10 text-indigo-500"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                            >
                                <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                />
                                <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                                />
                            </svg>
                            <p className="text-gray-500 text-sm font-medium">
                                Scraping website and generating insights…
                            </p>
                        </div>
                    ) : insights ? (
                        <ReactMarkdown components={mdComponents}>{insights}</ReactMarkdown>
                    ) : null}
                </div>
            </div>
        </div>
    )
}
