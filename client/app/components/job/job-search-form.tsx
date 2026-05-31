import React, { useRef, useState } from 'react'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { toast } from 'sonner'
import type { JobSearchForm as JobSearchFormType } from '~/types/resume_matching'
import type { ResumeData, SelectedResume } from '~/types/resume'
import { validateResumeFile } from '~/lib/utils'
import { ResumeSection } from '../resume/resume-section'
import { JobPlatform } from './job-platform'

interface JobSearchFormProps {
    onSubmitForm: (formData: FormData) => void
    isPending: boolean
    resumesData?: ResumeData[]
    resumesLoading: boolean
    resumesError: any
    onSetResumeObjectKey: (objectKey: string) => void
}

export function JobSearchForm({
    onSubmitForm,
    isPending,
    resumesData,
    resumesLoading,
    resumesError,
    onSetResumeObjectKey
}: JobSearchFormProps) {
    const { register, setValue, handleSubmit, formState: { errors } } = useForm<JobSearchFormType>({
        defaultValues: { job_platform: 'all' }
    })

    const [selectedJobPlatform, setSelectedJobPlatform] = useState<'all' | 'linkedin'>('all')
    const [selectedResumeMode, setSelectedResumeMode] = useState<'upload' | 'select'>('upload')
    const [selectedExistingResume, setSelectedExistingResume] = useState<SelectedResume | null>(null)
    const [resumeName, setResumeName] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const triggerFileInput = () => {
        if (fileInputRef.current) fileInputRef.current.click()
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.length) {
            setResumeName(e.target.files[0].name)
            setSelectedExistingResume(null)
        } else {
            setResumeName(null)
        }
    }

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        const files = e.dataTransfer.files
        if (fileInputRef.current && files.length) {
            const dt = new DataTransfer()
            Array.from(files).forEach((file) => dt.items.add(file))
            fileInputRef.current.files = dt.files

            const event = new Event('change', { bubbles: true })
            fileInputRef.current.dispatchEvent(event)

            setResumeName(files[0].name)
            setSelectedExistingResume(null)
        }
    }

    const handleExistingResumeSelect = (resumeId: string, objectKey: string) => {
        setSelectedExistingResume({ resume_id: resumeId, object_key: objectKey })
        onSetResumeObjectKey(objectKey)
        setResumeName(null)
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    const onSubmit: SubmitHandler<JobSearchFormType> = (data) => {
        const formData = new FormData()

        Object.entries(data).forEach(([key, value]) => {
            if (key !== 'resume' && value !== undefined && value !== null) {
                formData.append(key, value as string)
            }
        })

        if (selectedResumeMode === 'upload') {
            if (
                fileInputRef.current &&
                fileInputRef.current.files &&
                fileInputRef.current.files.length > 0
            ) {
                const file = fileInputRef.current.files[0]
                const validation = validateResumeFile(file)

                if (!validation.isValid) {
                    toast.error(validation.error)
                    return
                }

                formData.append('new_resume', file)
            }
        } else if (selectedResumeMode === 'select' && selectedExistingResume) {
            formData.append('existing_resume', JSON.stringify(selectedExistingResume))
        }

        onSubmitForm(formData)
    }

    return (
        <form
            className="mb-8 bg-white rounded-lg shadow p-6 space-y-6"
            onSubmit={handleSubmit(onSubmit)}
        >
            <div className="grid grid-cols-1 gap-6">
                {/* Job Platform */}
                <JobPlatform
                    isPending={isPending}
                    selectedJobPlatform={selectedJobPlatform}
                    setSelectedJobPlatform={setSelectedJobPlatform}
                    setValue={setValue}
                />

                {/* Job Title */}
                <div className="flex flex-col">
                    <label className="mb-1 text-gray-700 font-medium">Job Title</label>
                    <input
                        type="text"
                        placeholder="e.g. Software Engineer"
                        className="rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        {...register('job_title')}
                        disabled={isPending}
                    />
                </div>

                {/* Date Posted */}
                <div className="flex flex-col">
                    <label className="mb-1 text-gray-700 font-medium">
                        Date Posted
                    </label>
                    <select
                        className="rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        defaultValue=""
                        {...register('date_posted')}
                        disabled={isPending}
                    >
                        <option value="" disabled>
                            Select date posted
                        </option>
                        <option value="all">Anytime</option>
                        <option value="today">Last 24 hours</option>
                        <option value="3days">Last 3 days</option>
                        <option value="week">A week ago</option>
                        <option value="month">A month ago</option>
                    </select>
                </div>

                {/* Country */}
                <div className="flex flex-col">
                    <label className="mb-1 text-gray-700 font-medium">Country</label>
                    <select
                        className="rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        defaultValue=""
                        {...register('country')}
                        disabled={isPending}
                    >
                        <option value="" disabled>
                            Select country
                        </option>
                        <option value="us">United States</option>
                        <option value="gb">United Kingdom</option>
                        <option value="ca">Canada</option>
                        <option value="de">Germany</option>
                        <option value="ph">Philippines</option>
                        <option value="sg">Singapore</option>
                        <option value="au">Australia</option>
                    </select>
                </div>
            </div>

            <ResumeSection
                isPending={isPending}
                selectedResumeMode={selectedResumeMode}
                setSelectedResumeMode={setSelectedResumeMode}
                triggerFileInput={triggerFileInput}
                handleDrop={handleDrop}
                fileInputRef={fileInputRef}
                register={register}
                handleFileChange={handleFileChange}
                resumeName={resumeName}
                resumesLoading={resumesLoading}
                resumesError={resumesError}
                resumesData={resumesData}
                selectedExistingResume={selectedExistingResume}
                handleExistingResumeSelect={handleExistingResumeSelect}
            />

            <div className="flex justify-end">
                <button
                    type="submit"
                    className={`${isPending
                        ? 'bg-gray-400 cursor-not-allowed opacity-70'
                        : 'bg-blue-600 hover:cursor-pointer hover:opacity-75'
                        } text-white rounded px-6 py-2 font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400`}
                    disabled={isPending}
                >
                    {isPending ? 'Submitting...' : 'Submit'}
                </button>
            </div>
        </form>
    )
}
