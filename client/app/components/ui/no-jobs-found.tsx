export default function NoJobsFound({ searchAnotherHandler }: { searchAnotherHandler: () => void }) {
    return (
        <div className="mt-8 flex flex-col items-center">
            <div className="text-gray-500 text-lg font-medium">No jobs found.</div>
            <div className="text-gray-400 text-sm">Try adjusting your search criteria above.</div>

            {/* SEARCH ANOTHER */}
            <div className="mt-3">
                <button
                    onClick={searchAnotherHandler}
                    className="bg-blue-600 hover:cursor-pointer hover:opacity-75 text-white rounded px-6 py-2 font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                    Search another
                </button>
            </div>
        </div>
    )
}
