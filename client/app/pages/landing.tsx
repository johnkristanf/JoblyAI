import { useEffect, useState } from 'react'
import { MapPin, Briefcase, Users, Zap, Search, CheckCircle } from 'lucide-react'
import { useNavigate } from 'react-router'
import EmailChangeConfirm from '~/components/email-change-confirm'

const LandingPage = () => {
    const [email, setEmail] = useState('')
    const handleGetStarted = () => {
        if (email) {
            alert(`Welcome! We'll get in touch at ${email}`)
        }
    }

    const [showEmailChangeConfirm, setShowEmailChangeConfirm] = useState(false)

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const hash = window.location.hash
            console.log('hash: ', hash)

            if (
                hash.includes('Confirmation+link+accepted') ||
                hash.includes('confirm+link+sent+to+the+other+email')
            ) {
                setShowEmailChangeConfirm(true)
            }
        }
    }, [])

    if (showEmailChangeConfirm) {
        return <EmailChangeConfirm />
    }

    return (
        <div className="min-h-screen bg-white">
            {/* Navigation */}
            <nav className="border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <MapPin className="text-blue-600" size={28} />
                        <span className="text-xl font-bold text-gray-900">JoblyAI</span>
                    </div>
                    <div className="flex items-center gap-6">
                        <a
                            href="#features"
                            className="text-gray-600 hover:text-blue-600 transition"
                        >
                            Features
                        </a>
                        <a
                            href="#how-it-works"
                            className="text-gray-600 hover:text-blue-600 transition"
                        >
                            How It Works
                        </a>
                        <a
                            href="/auth/signup"
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                        >
                            Get Started
                        </a>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="max-w-7xl mx-auto px-6 py-20">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                    <div>
                        <div className="inline-block px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm font-medium mb-4">
                            AI-Powered Job Matching
                        </div>
                        <h1 className="text-5xl font-bold text-gray-900 leading-tight mb-6">
                            Discover Your Perfect Job Match Today
                        </h1>
                        <p className="text-xl text-gray-600 mb-8">
                            Get matched to opportunities that align with your skills, experience,
                            and career goals. See onsite job locations on an interactive google map.
                        </p>
                        <div className="flex gap-3 mb-6">
                            <input
                                type="email"
                                placeholder="Enter your work email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                            />
                            <button
                                onClick={handleGetStarted}
                                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition flex items-center gap-2"
                            >
                                <Search size={20} />
                                Start Matching
                            </button>
                        </div>
                        {/* <p className="text-sm text-gray-500">
              No credit card required • Free 14-day trial
            </p> */}
                    </div>

                    <div className="bg-linear-to-br from-blue-50 to-blue-100 rounded-2xl p-8 shadow-xl">
                        <div className="bg-white rounded-xl p-6 shadow-lg">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                                    <Briefcase className="text-white" size={24} />
                                </div>
                                <div>
                                    <div className="font-semibold text-gray-900">
                                        Senior Developer
                                    </div>
                                    <div className="text-sm text-gray-500">San Francisco, CA</div>
                                </div>
                            </div>
                            <div className="space-y-2 mb-4">
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <CheckCircle className="text-green-500" size={16} />
                                    <span>Strong Match</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <MapPin className="text-blue-600" size={16} />
                                    <span>Onsite - San Francisco</span>
                                </div>
                            </div>
                            <div className="h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                                <MapPin className="text-blue-600" size={48} />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="bg-gray-50 py-20">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">
                            Everything You Need to Find Your Next Role
                        </h2>
                        <p className="text-xl text-gray-600">
                            Powerful tools to help you discover opportunities that match your skills
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                                <Search className="text-blue-600" size={24} />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-3">
                                Smart Search
                            </h3>
                            <p className="text-gray-600">
                                Our AI analyzes your professional background, skills, and experience
                                to find jobs that truly fit your career path.
                            </p>
                        </div>

                        <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                                <MapPin className="text-blue-600" size={24} />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-3">
                                Location Insights
                            </h3>
                            <p className="text-gray-600">
                                View job locations on an interactive google map to find
                                opportunities near you or explore remote positions worldwide.
                            </p>
                        </div>

                        <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                                <Zap className="text-blue-600" size={24} />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-3">
                                Personalized Matching
                            </h3>
                            <p className="text-gray-600">
                                Get job recommendations tailored to your qualifications,
                                preferences, and career aspirations in real-time.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section id="how-it-works" className="py-20">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
                        <p className="text-xl text-gray-600">
                            Three simple steps to find your perfect match
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                                1
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-3">
                                Share Your Profile
                            </h3>
                            <p className="text-gray-600">
                                Tell us about your skills, experience, and what you're looking for
                                in your next role
                            </p>
                        </div>

                        <div className="text-center">
                            <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                                2
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-3">
                                Get Matched
                            </h3>
                            <p className="text-gray-600">
                                Our AI finds opportunities that align with your unique
                                qualifications and career goals
                            </p>
                        </div>

                        <div className="text-center">
                            <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                                3
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-3">
                                Explore Opportunities
                            </h3>
                            <p className="text-gray-600">
                                Browse matched jobs with detailed descriptions and location maps to
                                find your perfect fit
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="bg-blue-600 py-20">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <h2 className="text-4xl font-bold text-white mb-4">
                        Ready to Find Your Dream Job?
                    </h2>
                    <p className="text-xl text-blue-100 mb-8">
                        Join thousands of job seekers who've found their perfect match
                    </p>
                    <a
                        href="/auth/login"
                        className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold text-lg hover:bg-gray-50 transition shadow-lg"
                    >
                        <Search size={24} />
                        Start Job Search
                    </a>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-gray-100 py-12">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-2">
                            <MapPin className="text-blue-600" size={24} />
                            <span className="font-bold text-gray-900">JoblyAI</span>
                        </div>
                        <div className="flex gap-6 text-sm text-gray-600">
                            <a href="#" className="hover:text-blue-600 transition">
                                Privacy Policy
                            </a>
                            <a href="#" className="hover:text-blue-600 transition">
                                Terms of Service
                            </a>
                            <a href="#" className="hover:text-blue-600 transition">
                                Contact
                            </a>
                        </div>
                        <div className="text-sm text-gray-500">
                            © 2025 JoblyAI. All rights reserved.
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    )
}

export default LandingPage
