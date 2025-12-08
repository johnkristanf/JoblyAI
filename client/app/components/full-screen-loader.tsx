import React from 'react'

export default function FullScreenLoader({ message = 'Loading...' }: { message?: string }) {
    return (
        <div className="fixed inset-0 bg-white bg-opacity-75 flex flex-col items-center justify-center z-50">
            <svg
                className="animate-spin h-16 w-16 text-blue-600 mb-4"
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
            <div className="text-lg text-blue-700 font-medium">{message}</div>
        </div>
    )
}
