import React from 'react'

interface InlineLoaderProps {
    message: string
}

export default function InlineLoader({ message }: InlineLoaderProps) {
    return (
        <div className="flex flex-col items-center justify-center py-12">
            <svg
                className="animate-spin h-8 w-8 text-blue-500 mb-3"
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
            <span className="text-gray-700 text-md font-medium">
                {message}
            </span>
        </div>
    )
}
