import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router'
import { supabase } from '~/lib/supabase/client'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
    title: 'Login – JoblyAI',
    description: 'Sign in to your JoblyAI account',
}

const LoginPage = () => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const navigate = useNavigate()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setLoading(true)

        try {
            const { data, error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (signInError) {
                setError(signInError.message)
                setLoading(false)
                return
            }

            if (data.user) {
                // Redirect to job search page after successful login
                navigate('/job/search')
            }
        } catch (err) {
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
                        <p className="text-gray-600 dark:text-gray-400">Sign in to your account</p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                        </div>
                    )}

                    {/* Login Form */}
                    <form onSubmit={handleLogin} className="space-y-6">
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
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Signing in...' : 'Sign In'}
                        </Button>
                    </form>

                    {/* Sign Up Link */}
                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Don't have an account?{' '}
                            <NavLink
                                to="/auth/signup"
                                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
                            >
                                Sign up
                            </NavLink>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default LoginPage
