import { Calendar, Trash2 } from 'lucide-react'
import { formatDate, getFileIcon } from '~/lib/utils'
import type { ResumeData } from '~/types/resume'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { removeResume } from '~/lib/api/post'
import FullScreenLoader from './full-screen-loader'
import * as React from 'react'

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
    onPreview,
}: {
    resume: ResumeData
    onPreview: (previewUrl: string, name: string) => void
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
        <div className="relative border border-gray-200 rounded-lg p-6 shadow-sm bg-white hover:shadow-md transition-shadow flex flex-col h-full">
            <div className="flex-1 flex flex-col items-center justify-center mb-4">
                <div className="w-20 h-20 bg-linear-to-br from-blue-50 to-indigo-100 rounded-full flex items-center justify-center mb-4">
                    <span className="text-4xl">{getFileIcon(resume.name)}</span>
                </div>
                <h2 className="text-base font-semibold text-gray-800 text-center line-clamp-2 mb-2">
                    {resume.name}
                </h2>
                {resume.upload_date && (
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(resume.upload_date)}</span>
                    </div>
                )}
            </div>
            <div className="flex gap-2 mt-auto">
                <button
                    className="w-full px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
                    onClick={() => onPreview(resume.url, resume.name)}
                >
                    Preview
                </button>
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
