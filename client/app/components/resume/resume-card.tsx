import { Calendar, Trash2 } from 'lucide-react'
import { formatDate, getFileIcon } from '~/lib/utils'
import type { ResumeData } from '~/types/resume'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { removeResume } from '~/lib/api/post'
import FullScreenLoader from '../full-screen-loader'
import { ResumeViewerDrawer } from './resume-viewer-drawer'
import * as React from 'react'
import { Suspense, lazy } from 'react'

const ResumeThumbnail = lazy(() => import('./resume-thumbnail').then(m => ({ default: m.ResumeThumbnail })))

// Shadcn components for dialog confirmation
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogFooter,
    DialogTitle,
    DialogDescription,
    DialogClose,
} from '~/components/ui/dialog'

export function ResumeCard({
    resume,
}: {
    resume: ResumeData
}) {
    const queryClient = useQueryClient()
    const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)

    const mutation = useMutation({
        mutationFn: removeResume,
        onSuccess: () => {
            toast.success('Resume deleted successfully!')
            queryClient.invalidateQueries({ queryKey: ['resumes', 'all'] })
            setDeleteDialogOpen(false)
        },
        onError: () => {
            toast.error('Error deleting resume, please try again later')
            setDeleteDialogOpen(false)
        },
    })

    const handleDelete = () => {
        mutation.mutate({ id: resume.id, object_key: resume.objectKey })
    }

    return (
        <div className="relative border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white hover:shadow-md transition-shadow flex flex-col h-full group">
            {/* Glimpse / Thumbnail */}
            <Suspense fallback={
                <div className="w-full h-64 bg-gray-100 flex flex-col items-center justify-center border-b border-gray-200 animate-pulse">
                    <span className="text-xs text-gray-400">Loading preview...</span>
                </div>
            }>
                <ResumeThumbnail url={resume.url} fileName={resume.name} />
            </Suspense>
            
            {/* Card Content */}
            <div className="flex-1 flex flex-col p-5">
                <h2 className="text-base font-semibold text-gray-800 line-clamp-2 mb-2 group-hover:text-blue-700 transition-colors">
                    {resume.name}
                </h2>
                {resume.upload_date && (
                    <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-4">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Uploaded {formatDate(resume.upload_date)}</span>
                    </div>
                )}
            </div>
            
            <div className="flex gap-2 mt-auto px-5 pb-5">
                <ResumeViewerDrawer objectKey={resume.objectKey} resumeName={resume.name}>
                    <button
                        className="w-full px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors cursor-pointer"
                    >
                        Preview
                    </button>
                </ResumeViewerDrawer>
                {/* Delete confirmation using shadcn dialog */}
                <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                    <DialogTrigger asChild>
                        <button
                            className="absolute top-1 right-1 flex items-center justify-center px-3 py-2 rounded-lg  text-red-600 hover:cursor-pointer hover:opacity-75 transition-colors"
                            title="Delete Resume"
                            aria-label="Delete Resume"
                            onClick={() => setDeleteDialogOpen(true)}
                            disabled={mutation.isPending}
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Delete this resume?</DialogTitle>
                            <DialogDescription>
                                This action cannot be undone.
                                <br />
                                Are you sure you want to permanently delete{' '}
                                <span className="font-semibold">{resume.name}</span>?
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="mt-4">
                            <DialogClose asChild>
                                <button
                                    type="button"
                                    className="px-4 py-2 rounded-md text-sm bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium"
                                    disabled={mutation.isPending}
                                >
                                    Cancel
                                </button>
                            </DialogClose>
                            <button
                                type="button"
                                onClick={handleDelete}
                                className="px-4 py-2 rounded-md text-sm bg-red-600 hover:bg-red-700 text-white font-medium ml-2 disabled:opacity-60"
                                disabled={mutation.isPending}
                            >
                                {mutation.isPending ? 'Deleting...' : 'Delete'}
                            </button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    )
}
