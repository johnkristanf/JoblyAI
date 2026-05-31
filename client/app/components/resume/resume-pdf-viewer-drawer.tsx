import { useState, lazy, Suspense } from 'react'
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from '~/components/ui/drawer'
import { Eye, Loader2 } from 'lucide-react'
const PdfViewer = lazy(() => import('~/components/pdf-viewer'))
import { getResumePresignedUrl } from '~/lib/api/get'
import { useQuery } from '@tanstack/react-query'

interface ResumePdfViewerDrawerProps {
    objectKey: string
    resumeName: string
}

export function ResumePdfViewerDrawer({ objectKey, resumeName }: ResumePdfViewerDrawerProps) {
    const [open, setOpen] = useState(false)

    const {
        data: presignedUrl,
        isLoading,
        isError,
    } = useQuery({
        queryKey: ['resume-presigned-url', objectKey],
        queryFn: () => getResumePresignedUrl(objectKey),
        staleTime: 1000 * 60 * 25,
        enabled: open, // Only fetch when the drawer is open
    })

    return (
        <Drawer open={open} onOpenChange={setOpen} direction='right'>
            <DrawerTrigger asChild>
                <button
                    type="button"
                    title="View Resume"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                    onClick={(e) => {
                        e.stopPropagation() // Prevent triggering the row selection
                    }}
                >
                    <Eye className="w-4 h-4" />
                    View
                </button>
            </DrawerTrigger>
            <DrawerContent className="h-full w-[95vw] sm:w-[85vw] md:w-[75vw] lg:w-[60vw] !max-w-xl right-0 flex flex-col rounded-none sm:rounded-l-2xl border-l">
                <DrawerHeader>
                    <DrawerTitle className="truncate">Resume: {resumeName}</DrawerTitle>
                    <DrawerDescription>
                        PDF preview of your uploaded resume.
                    </DrawerDescription>
                </DrawerHeader>
                <div className="flex-1 w-full h-full overflow-hidden bg-gray-100 p-2 md:p-4">
                    {isLoading && (
                        <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-500">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                            <p>Loading document url...</p>
                        </div>
                    )}
                    {isError && (
                        <div className="flex flex-col items-center justify-center h-full text-red-500">
                            <p>Failed to load resume. Please try again.</p>
                        </div>
                    )}
                    {presignedUrl && (
                        <div className="w-full h-full rounded-lg overflow-hidden border border-gray-200 shadow-sm bg-white">
                            <Suspense fallback={
                                <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-500">
                                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                                    <p>Loading viewer...</p>
                                </div>
                            }>
                                <PdfViewer url={presignedUrl} />
                            </Suspense>
                        </div>
                    )}
                </div>
            </DrawerContent>
        </Drawer>
    )
}
