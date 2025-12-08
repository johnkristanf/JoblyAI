import { Mail } from 'lucide-react'
import React from 'react'
import { Link } from 'react-router'

const EmailChangeConfirm = () => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
            <div className="w-full max-w-md p-8 rounded-xl shadow-lg bg-white dark:bg-zinc-900 text-center">
                <Mail className="mx-auto mb-4 w-14 h-14 text-primary" />
                <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
                    Confirm Your Email Change
                </h1>
                <p className="mb-6 text-gray-700 dark:text-gray-300">
                    To complete your email change, you must confirm from your old email address.
                    <br />
                    We've sent a confirmation link to your old email. Please check your inbox and
                    follow the instructions.
                </p>
                <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                    Didn&apos;t receive the email? Check your spam folder or contact support.
                </p>

                <a
                    href="/"
                    className="w-full py-2 px-4 rounded bg-blue-600 text-white font-medium hover:cursor-pointer hover:opacity-75 transition"
                >
                    Back to Home
                </a>
            </div>
        </div>
    )
}

export default EmailChangeConfirm
