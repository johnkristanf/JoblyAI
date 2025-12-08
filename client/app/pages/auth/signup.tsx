import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router'
import { supabase } from '~/lib/supabase/client'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
    title: 'Sign Up – JoblyAI',
    description: 'Create your JoblyAI account',
}

const SignupPage = () => {
    const [fullName, setFullName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const navigate = useNavigate()

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setSuccess(false)

        // Validate full name
        if (!fullName.trim()) {
            setError('Full name is required')
            return
        }

        // Validate passwords match
        if (password !== confirmPassword) {
            setError('Passwords do not match')
            return
        }

        // Validate password length
        if (password.length < 6) {
            setError('Password must be at least 6 characters long')
            return
        }

        setLoading(true)

        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                        avatar_url: null,
                    },
                },
            })

            if (error) {
                console.log('SIGNUP ERROR: ', error)

                setError(error.message)
                setLoading(false)
                return
            }

            if (data.user) {
                setSuccess(true)
                // Redirect to verification page
                setTimeout(() => {
                    navigate('/email/verification')
                }, 2000)
            }
        } catch (err) {
            console.log('SIGNUP ERROR: ', err)

            setError('An unexpected error occurred. Please try again.')
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 px-4">
            <h1 className="absolute top-4 left-3">
                <a
                    href="/"
                    className="inline-flex items-center px-3 py-2  hover:cursor-pointer hover:opacity-75 text-gray-900 "
                >
                    <ArrowLeft className="size-6 mr-1" />
                    Back to landing page
                </a>
            </h1>
            <div className="w-full max-w-md">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-blue-200 dark:border-blue-800">
                    {/* Logo/Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                            JoblyAI
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">Create your account</p>
                    </div>

                    {/* Success Message */}
                    {success && (
                        <div className="mb-6 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                            <p className="text-sm text-green-600 dark:text-green-400">
                                Account created successfully! Redirecting...
                            </p>
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                        </div>
                    )}

                    {/* Signup Form */}
                    <form onSubmit={handleSignup} className="space-y-6">
                        <div>
                            <label
                                htmlFor="fullName"
                                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                            >
                                Full Name
                            </label>
                            <Input
                                id="fullName"
                                type="text"
                                placeholder="Your full name"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required
                                className="w-full border-blue-300 dark:border-blue-700 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400"
                                disabled={loading}
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="email"
                                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                            >
                                Email
                            </label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full border-blue-300 dark:border-blue-700 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400"
                                disabled={loading}
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="password"
                                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                            >
                                Password
                            </label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full border-blue-300 dark:border-blue-700 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400"
                                disabled={loading}
                            />
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                Must be at least 6 characters
                            </p>
                        </div>

                        <div>
                            <label
                                htmlFor="confirmPassword"
                                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                            >
                                Confirm Password
                            </label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                placeholder="Confirm your password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                className="w-full border-blue-300 dark:border-blue-700 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400"
                                disabled={loading}
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Creating account...' : 'Sign Up'}
                        </Button>
                    </form>

                    {/* Login Link */}
                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Already have an account?{' '}
                            <NavLink
                                to="/auth/login"
                                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
                            >
                                Sign in
                            </NavLink>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default SignupPage
