import { MailCheck } from 'lucide-react'
import { Link } from 'react-router'

export default function EmailVerificationPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
            <div className="w-full max-w-md p-8 rounded-xl shadow-lg bg-white dark:bg-zinc-900 text-center">
                <MailCheck className="mx-auto mb-4 w-14 h-14 text-primary" />
                <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
                    Check your email
                </h1>
                <p className="mb-6 text-gray-700 dark:text-gray-300">
                    We've sent you a verification link. Please check your inbox and click the link
                    to verify your email address.
                </p>
                <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                    Didn't receive the email? Check your spam folder or{' '}
                    <Link to="/resend-verification" className="text-primary underline">
                        resend it
                    </Link>
                </p>
                <Link to="/">
                    <button className="w-full py-2 px-4 rounded bg-blue-600 text-white font-medium hover:cursor-pointer hover:opacity-75 transition">
                        Back to Home
                    </button>
                </Link>
            </div>
        </div>
    )
}








