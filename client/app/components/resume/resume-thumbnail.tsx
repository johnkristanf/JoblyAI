import { useState, useEffect, useRef } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import { Loader2, FileText } from 'lucide-react'
import { isDocxFile } from '~/lib/utils'
import { renderAsync } from 'docx-preview'

// Set up the worker using CDN, but only on the client side to avoid SSR DOMMatrix errors
if (typeof window !== 'undefined') {
    pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`
}

function DocxThumbnailView({ url }: { url: string }) {
    const containerRef = useRef<HTMLDivElement>(null)
    const [status, setStatus] = useState<'loading' | 'done' | 'error'>('loading')

    useEffect(() => {
        if (!containerRef.current || !url) return

        let cancelled = false
        setStatus('loading')

        ;(async () => {
            try {
                const res = await fetch(url)
                if (!res.ok) throw new Error('Failed to fetch')
                const blob = await res.blob()

                if (cancelled || !containerRef.current) return

                await renderAsync(blob, containerRef.current, undefined, {
                    className: 'docx-preview-thumbnail',
                    inWrapper: true,
                    ignoreWidth: false,
                    ignoreHeight: false,
                    ignoreFonts: false,
                    breakPages: true,
                    ignoreLastRenderedPageBreak: true,
                    experimental: false,
                    trimXmlDeclaration: true,
                    useBase64URL: false,
                    renderChanges: false,
                    renderHeaders: false,
                    renderFooters: false,
                    renderFootnotes: false,
                    renderEndnotes: false,
                    renderComments: false,
                    debug: false,
                })

                if (!cancelled) setStatus('done')
            } catch (err) {
                if (!cancelled) setStatus('error')
            }
        })()

        return () => { cancelled = true }
    }, [url])

    return (
        <div className="w-full h-full relative overflow-hidden bg-gray-50 flex justify-center">
            {status === 'loading' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-gray-400 z-20 bg-gray-50">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
                </div>
            )}
            {status === 'error' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-red-400 z-20 bg-red-50">
                    <FileText className="w-8 h-8" />
                    <span className="text-xs">Preview unavailable</span>
                </div>
            )}
            {/* 
              Wrap the docx-preview container in a scaled wrapper. 
              An A4 page is ~800px wide. We scale it down to fit in the card. 
            */}
            <div className="w-[800px] h-[1131px] origin-top transform scale-[0.4] sm:scale-[0.45] pointer-events-none select-none shadow-sm bg-white overflow-hidden">
                <div ref={containerRef} className="w-full h-full overflow-hidden [&_.docx-wrapper]:bg-white [&_.docx-wrapper]:p-0" />
            </div>
        </div>
    )
}

interface ResumeThumbnailProps {
    url: string
    fileName: string
}

export function ResumeThumbnail({ url, fileName }: ResumeThumbnailProps) {
    const isDocx = isDocxFile(fileName)
    const [isHovered, setIsHovered] = useState(false)

    return (
        <div 
            className="w-full h-64 bg-gray-100 flex items-start justify-center overflow-hidden border-b border-gray-200 relative group"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className={`w-full h-full transition-transform duration-500 origin-top ${isHovered ? 'scale-105' : 'scale-100'}`}>
                {isDocx && url ? (
                    <DocxThumbnailView url={url} />
                ) : (
                    <Document
                        file={url}
                        loading={
                            <div className="flex flex-col items-center justify-center h-full w-full gap-2 text-gray-400 absolute inset-0 bg-gray-50 z-10">
                                <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
                            </div>
                        }
                        error={
                            <div className="flex flex-col items-center justify-center h-full w-full gap-2 text-red-400 absolute inset-0 bg-red-50 z-10">
                                <FileText className="w-8 h-8" />
                                <span className="text-xs">Preview unavailable</span>
                            </div>
                        }
                        className="flex justify-center"
                    >
                        <Page
                            pageNumber={1}
                            width={400} // Set a fixed width that works well for a thumbnail
                            renderAnnotationLayer={false}
                            renderTextLayer={false}
                            className="shadow-sm bg-white"
                        />
                    </Document>
                )}
            </div>
            
            {/* Soft overlay gradient to make it look like a thumbnail */}
            <div className="absolute inset-0 bg-gradient-to-t from-white/40 to-transparent pointer-events-none z-20" />
        </div>
    )
}
