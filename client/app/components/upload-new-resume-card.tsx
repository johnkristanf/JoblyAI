import { Plus } from 'lucide-react'

export function UploadNewResumeCard({
    onClick,
    inputRef,
    onChange,
}: {
    onClick: () => void
    inputRef: React.RefObject<HTMLInputElement | null>
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}) {
    return (
        <div
            role="button"
            tabIndex={0}
            onClick={onClick}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    onClick()
                }
            }}
            className="border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:bg-blue-50 hover:border-blue-400 cursor-pointer p-6 transition-all flex flex-col items-center justify-center h-full min-h-[240px]"
            aria-label="Upload new resume"
        >
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Plus className="w-10 h-10 text-blue-600" />
            </div>
            <span className="text-blue-600 font-semibold text-lg mb-1">Add Resume</span>
            <span className="text-gray-500 text-sm">PDF, DOC, or DOCX</span>
            <input
                type="file"
                accept="application/pdf,.doc,.docx"
                multiple
                ref={inputRef}
                onChange={onChange}
                className="hidden"
                tabIndex={-1}
                aria-label="Upload resume file input"
            />
        </div>
    )
}
