import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Loader2, X } from 'lucide-react'
import { toast } from 'sonner'
import { autoApply, type AutoApplyPayload, type UserProfile } from '~/lib/api/post'
import type { JobMatch } from '~/types/job_search'
import { SaveJobBtn } from './ui/save-job-btn'

const EMPTY_PROFILE: UserProfile = {
    full_name: '',
    email: '',
    phone: '',
    location: '',
    linkedin_url: '',
    years_of_experience: undefined,
    highest_education: '',
    current_role: '',
}

export function JobPublisherAndApply({ job }: { job: JobMatch }) {
    const [showProfileModal, setShowProfileModal] = useState(false)
    const [profile, setProfile] = useState<UserProfile>(EMPTY_PROFILE)

    const autoApplyMutation = useMutation({
        mutationFn: (payload: AutoApplyPayload) => autoApply(payload),
        onSuccess: (data) => {
            toast.success(data.message ?? 'Auto-apply agent completed!')
        },
        onError: (err: any) => {
            toast.error(err.message ?? 'Auto-apply failed. Please try again.')
        },
    })

    const handleOpenModal = () => {
        if (!job.job_apply_link) {
            toast.error('No apply link available for this job.')
            return
        }
        setShowProfileModal(true)
    }

    const handleSubmitProfile = (e: React.FormEvent) => {
        e.preventDefault()
        setShowProfileModal(false)
        autoApplyMutation.mutate({
            job_apply_link: job.job_apply_link ?? '',
            job_title: job.job_title ?? undefined,
            employer_name: job.employer_name ?? undefined,
            user_profile: profile,
        })
    }

    const set = (field: keyof UserProfile) =>
        (e: React.ChangeEvent<HTMLInputElement>) =>
            setProfile((prev) => ({
                ...prev,
                [field]: field === 'years_of_experience'
                    ? (e.target.value === '' ? undefined : Number(e.target.value))
                    : e.target.value,
            }))

    return (
        <>
            <div
                className={`flex items-center mt-3 ${job.job_publisher ? 'justify-between' : 'justify-end'}`}
            >
                {job.job_publisher && (
                    <div className="w-[30%] text-center bg-blue-200 border-2 border-blue-500 text-sm text-blue-900 mb-2 px-2 py-0.5 rounded z-10">
                        {job.job_publisher}
                    </div>
                )}

                {/* ACTIONS */}
                <div className="flex items-center justify-end gap-2">
                    <SaveJobBtn job={job} />

                    {/* MANUAL APPLY */}
                    <a
                        href={job.job_apply_link ?? '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-disabled={!job.job_apply_link}
                        className={`inline-flex items-center gap-1.5 text-sm rounded px-4 py-2 font-semibold shadow-sm border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 ${!job.job_apply_link
                                ? 'border-gray-300 text-gray-400 cursor-not-allowed pointer-events-none opacity-60'
                                : 'border-blue-600 text-blue-600 bg-white hover:bg-blue-50 hover:cursor-pointer'
                            }`}
                    >
                        Apply
                    </a>

                    {/* AUTO APPLY (LLM + Playwright) */}
                    <button
                        onClick={handleOpenModal}
                        disabled={autoApplyMutation.isPending || !job.job_apply_link}
                        className={`inline-flex items-center gap-1.5 text-white text-sm rounded px-4 py-2 font-semibold shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 ${autoApplyMutation.isPending || !job.job_apply_link
                                ? 'bg-gray-400 cursor-not-allowed opacity-70'
                                : 'bg-blue-600 hover:cursor-pointer hover:opacity-75'
                            }`}
                    >
                        {autoApplyMutation.isPending ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Applying...
                            </>
                        ) : (
                            'Auto Apply'
                        )}
                    </button>
                </div>
            </div>

            {/* PROFILE FORM MODAL */}
            {showProfileModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6 relative max-h-[90vh] overflow-y-auto">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Your Application Profile</h2>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    The AI will use this info to fill the application form
                                </p>
                            </div>
                            <button
                                onClick={() => setShowProfileModal(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmitProfile} className="space-y-4">
                            {/* Required fields */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="flex flex-col col-span-2">
                                    <label className="text-xs font-semibold text-gray-700 mb-1">
                                        Full Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        required
                                        value={profile.full_name}
                                        onChange={set('full_name')}
                                        placeholder="Jane Doe"
                                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                                    />
                                </div>

                                <div className="flex flex-col col-span-2">
                                    <label className="text-xs font-semibold text-gray-700 mb-1">
                                        Email <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        required
                                        type="email"
                                        value={profile.email}
                                        onChange={set('email')}
                                        placeholder="jane@example.com"
                                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                                    />
                                </div>

                                <div className="flex flex-col">
                                    <label className="text-xs font-semibold text-gray-700 mb-1">Phone</label>
                                    <input
                                        value={profile.phone ?? ''}
                                        onChange={set('phone')}
                                        placeholder="+1 555 000 0000"
                                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                                    />
                                </div>

                                <div className="flex flex-col">
                                    <label className="text-xs font-semibold text-gray-700 mb-1">Location</label>
                                    <input
                                        value={profile.location ?? ''}
                                        onChange={set('location')}
                                        placeholder="City, Country"
                                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                                    />
                                </div>

                                <div className="flex flex-col">
                                    <label className="text-xs font-semibold text-gray-700 mb-1">Current Role</label>
                                    <input
                                        value={profile.current_role ?? ''}
                                        onChange={set('current_role')}
                                        placeholder="Software Engineer"
                                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                                    />
                                </div>

                                <div className="flex flex-col">
                                    <label className="text-xs font-semibold text-gray-700 mb-1">Years of Experience</label>
                                    <input
                                        type="number"
                                        min={0}
                                        value={profile.years_of_experience ?? ''}
                                        onChange={set('years_of_experience')}
                                        placeholder="3"
                                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                                    />
                                </div>

                                <div className="flex flex-col col-span-2">
                                    <label className="text-xs font-semibold text-gray-700 mb-1">Highest Education</label>
                                    <input
                                        value={profile.highest_education ?? ''}
                                        onChange={set('highest_education')}
                                        placeholder="Bachelor's in Computer Science"
                                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                                    />
                                </div>

                                <div className="flex flex-col col-span-2">
                                    <label className="text-xs font-semibold text-gray-700 mb-1">LinkedIn URL</label>
                                    <input
                                        value={profile.linkedin_url ?? ''}
                                        onChange={set('linkedin_url')}
                                        placeholder="https://linkedin.com/in/yourprofile"
                                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                                    />
                                </div>
                            </div>

                            {/* Job context (read-only) */}
                            <div className="bg-blue-50 rounded-lg px-4 py-3 text-xs text-blue-700 space-y-0.5">
                                <p className="font-semibold text-blue-800 mb-1">Applying for:</p>
                                <p>{job.job_title ?? 'Unknown position'} {job.employer_name ? `at ${job.employer_name}` : ''}</p>
                                <p className="text-blue-500 truncate">{job.job_apply_link}</p>
                            </div>

                            <div className="flex gap-3 pt-1">
                                <button
                                    type="button"
                                    onClick={() => setShowProfileModal(false)}
                                    className="flex-1 py-2 rounded-lg border border-gray-300 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:opacity-80 transition-opacity"
                                >
                                    Start Auto Apply
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}
