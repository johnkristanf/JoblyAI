import { useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Loader2, AlertCircle } from 'lucide-react'

// Set up the worker using CDN
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

export default function PdfViewer({ url }: { url: string }) {
    const [numPages, setNumPages] = useState<number>()
    const [pageNumber, setPageNumber] = useState<number>(1)
    const [scale, setScale] = useState(1.0)

    function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
        setNumPages(numPages)
        setPageNumber(1)
    }

    return (
        <div className="flex flex-col h-full w-full bg-[#f3f4f6]">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-200 shadow-sm z-10 shrink-0">
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => setPageNumber(p => Math.max(1, p - 1))}
                        disabled={pageNumber <= 1}
                        className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-50 transition-colors"
                        title="Previous page"
                    >
                        <ChevronLeft className="w-4 h-4 text-gray-700" />
                    </button>
                    <span className="text-xs font-medium text-gray-600 min-w-12 text-center">
                        {pageNumber} / {numPages || '-'}
                    </span>
                    <button 
                        onClick={() => setPageNumber(p => Math.min(numPages || 1, p + 1))}
                        disabled={pageNumber >= (numPages || 1)}
                        className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-50 transition-colors"
                        title="Next page"
                    >
                        <ChevronRight className="w-4 h-4 text-gray-700" />
                    </button>
                </div>
                <div className="flex items-center gap-1">
                    <button 
                        onClick={() => setScale(s => Math.max(0.5, s - 0.2))}
                        className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                        title="Zoom out"
                    >
                        <ZoomOut className="w-4 h-4 text-gray-700" />
                    </button>
                    <span className="text-xs font-medium text-gray-600 w-12 text-center">
                        {Math.round(scale * 100)}%
                    </span>
                    <button 
                        onClick={() => setScale(s => Math.min(2.5, s + 0.2))}
                        className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                        title="Zoom in"
                    >
                        <ZoomIn className="w-4 h-4 text-gray-700" />
                    </button>
                </div>
            </div>

            {/* PDF Canvas */}
            <div className="flex-1 overflow-auto p-4 flex justify-center items-start">
                <Document
                    file={url}
                    onLoadSuccess={onDocumentLoadSuccess}
                    loading={
                        <div className="flex flex-col items-center justify-center gap-3 text-gray-500 mt-20">
                            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                            <p className="text-xs font-medium">Loading document…</p>
                        </div>
                    }
                    error={
                        <div className="flex flex-col items-center justify-center gap-2 text-red-500 mt-20">
                            <AlertCircle className="w-6 h-6" />
                            <p className="text-xs font-medium">Failed to load document. CORS or network error.</p>
                        </div>
                    }
                    className="flex flex-col items-center shadow-md bg-white"
                >
                    <Page 
                        pageNumber={pageNumber} 
                        scale={scale} 
                        className="transition-transform duration-200"
                        renderAnnotationLayer={false}
                        renderTextLayer={false}
                    />
                </Document>
            </div>
        </div>
    )
}
