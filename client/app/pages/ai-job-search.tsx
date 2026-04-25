import { Sparkles } from 'lucide-react'

export default function AIJobSearchPage() {
    return (
        <div className="w-full min-h-screen flex flex-col p-10">
            {/* PAGE TITLE */}
            <h1 className="text-2xl font-bold text-gray-900">AI Job Matchmaker</h1>
            <h3 className="text-md text-blue-600 font-normal">
                Describe your ideal job in natural language and let AI find the perfect match.
            </h3>

            {/* SEARCH FORM (UI ONLY) */}
            <div className="mt-8 bg-white rounded-lg shadow p-6 space-y-6">
                <div className="flex flex-col">
                    <label className="mb-2 text-gray-700 font-medium text-lg">Describe your dream job</label>
                    <p className="text-blue-600 text-sm mb-4">
                        Tell us about the role, required skills, preferred industry, location, and salary expectations.
                    </p>
                    <textarea
                        className="rounded border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400 min-h-[150px] resize-y w-full text-gray-800"
                        placeholder="e.g. I am looking for a remote senior frontend developer role using React and TypeScript. I want to work in the healthcare industry and my expected salary is around $140,000. I also have 5 years of experience with Node.js..."
                    />
                </div>

                <div className="flex justify-end mt-4">
                    <button
                        type="button"
                        className="bg-blue-600 hover:cursor-pointer hover:opacity-75 text-white rounded px-6 py-2.5 font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 flex items-center gap-2 transition-all"
                    >
                        <Sparkles className="size-5" />
                        Find Matches
                    </button>
                </div>
            </div>

            {/* EMPTY STATE RESULTS PLACEHOLDER */}
            <div className="mt-12 flex flex-col items-center justify-center text-gray-500 py-16 border-2 border-dashed border-blue-200 rounded-xl bg-blue-50/50">
                <Sparkles className="size-12 text-blue-400 mb-4 opacity-80" />
                <p className="text-xl font-medium text-gray-700">Ready to find your match</p>
                <p className="text-md mt-2 max-w-lg text-center text-gray-500">
                    Type your preferences above and our AI will deeply analyze job listings to find opportunities that perfectly align with your career goals.
                </p>
            </div>
        </div>
    )
}
