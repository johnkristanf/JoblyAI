import { MailCheck } from 'lucide-react'
import { Link, useSearchParams } from 'react-router'
import { useState, useEffect } from 'react'
import { supabase } from '~/lib/supabase/client'

export default function EmailVerificationPage() {
    const [searchParams] = useSearchParams()
    const email = searchParams.get('email')

    const [timer, setTimer] = useState(0)
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

    useEffect(() => {
        if (timer > 0) {
            const interval = setInterval(() => setTimer((prev) => prev - 1), 1000)
            return () => clearInterval(interval)
        }
    }, [timer])

    const handleResend = async () => {
        if (!email) {
            setMessage({ type: 'error', text: 'Email address not found. Please sign up again.' })
            return
        }

        setLoading(true)
        setMessage(null)

        const { error } = await supabase.auth.resend({
            type: 'signup',
            email,
        })

        setLoading(false)

        if (error) {
            // Check for rate limit error
            if (error.status === 429) {
                setMessage({ type: 'error', text: 'Please wait before requesting another email.' })
                setTimer(60) // Supabase rate limit is typically 60 seconds
            } else {
                setMessage({ type: 'error', text: error.message })
            }
        } else {
            setMessage({ type: 'success', text: 'Verification email resent successfully!' })
            setTimer(60) // Start 60s cooldown after successful resend
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 px-4">
            <div className="w-full max-w-md p-8 rounded-xl shadow-lg bg-white dark:bg-zinc-900 text-center">
                <MailCheck className="mx-auto mb-4 w-14 h-14 text-primary" />
                <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
                    Check your email
                </h1>
                <p className="mb-6 text-gray-700 dark:text-gray-300">
                    We've sent you a verification link. Please check your inbox and click the link
                    to verify your email address.
                </p>

                {message && (
                    <div
                        className={`mb-6 p-3 rounded-lg border text-sm ${
                            message.type === 'success'
                                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-600 dark:text-green-400'
                                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400'
                        }`}
                    >
                        {message.text}
                    </div>
                )}

                <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
                    Didn't receive the email? Check your spam folder or{' '}
                    <button
                        onClick={handleResend}
                        disabled={timer > 0 || loading || !email}
                        className="text-primary underline hover:text-blue-700 disabled:opacity-50 hover:cursor-pointer disabled:no-underline disabled:cursor-not-allowed transition-colors"
                    >
                        {loading ? 'resending...' : timer > 0 ? `resend in ${timer}s` : 'resend it'}
                    </button>
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








