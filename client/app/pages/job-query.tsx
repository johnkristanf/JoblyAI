import { useState } from 'react'
import { Search, Sparkles } from 'lucide-react'
import { PageHeader } from '~/components/ui/page-header'

const JobQueryPage = () => {
    const [query, setQuery] = useState('')
    const [isFocused, setIsFocused] = useState(false)

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!query.trim()) return
        // TODO: wire up to backend search
        console.log('Searching for:', query)
    }

    const suggestions = [
        'Senior frontend engineer, remote, React',
        'Data scientist role in New York with Python',
        'Product manager at a startup, hybrid',
        'Junior backend developer, entry level, Node.js',
    ]

    return (
        <div className="w-full min-h-screen flex flex-col p-10">
            <PageHeader
                title={
                    <>
                        <Sparkles className="size-6 text-blue-500" />
                        Query Jobs
                    </>
                }
                subtitle="Describe the job you're looking for in plain language — our AI will find the best matches."
                className="mb-12 shrink-0"
            />

            {/* Centered search area */}
            <div className="flex-1 flex flex-col items-center justify-start pt-10">
                <div className="w-full max-w-2xl space-y-6">
                    {/* Search input */}
                    <form onSubmit={handleSubmit} className="relative">
                        <div
                            className={`relative flex items-center rounded-2xl border-2 bg-white shadow-lg transition-all duration-300 ${
                                isFocused
                                    ? 'border-blue-500 shadow-blue-100 shadow-xl'
                                    : 'border-gray-200 shadow-gray-100'
                            }`}
                        >
                            <Search
                                className={`absolute left-4 size-5 transition-colors duration-200 ${
                                    isFocused ? 'text-blue-500' : 'text-gray-400'
                                }`}
                            />
                            <input
                                id="job-query-input"
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onFocus={() => setIsFocused(true)}
                                onBlur={() => setIsFocused(false)}
                                placeholder="e.g. Senior React engineer, remote, fintech startup..."
                                className="w-full py-4 pl-12 pr-32 text-gray-800 placeholder-gray-400 bg-transparent rounded-2xl outline-none text-base"
                            />
                            <button
                                type="submit"
                                disabled={!query.trim()}
                                className="absolute right-3 px-4 py-2 rounded-xl bg-blue-500 text-white text-sm font-semibold transition-all duration-200 hover:bg-blue-600 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-blue-500"
                            >
                                Search
                            </button>
                        </div>
                    </form>

                    {/* Suggestion chips */}
                    <div className="space-y-3">
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider text-center">
                            Try searching for
                        </p>
                        <div className="flex flex-wrap justify-center gap-2">
                            {suggestions.map((suggestion) => (
                                <button
                                    key={suggestion}
                                    type="button"
                                    onClick={() => setQuery(suggestion)}
                                    className="px-3 py-1.5 rounded-full border border-blue-100 bg-blue-50 text-blue-600 text-xs font-medium hover:bg-blue-100 hover:border-blue-300 transition-all duration-150 cursor-pointer"
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default JobQueryPage
