import { useEffect, useRef, useState } from 'react'
import { renderAsync } from 'docx-preview'
import { Loader2, AlertCircle } from 'lucide-react'

export default function DocxViewer({ url }: { url: string }) {
    const containerRef = useRef<HTMLDivElement>(null)
    const [status, setStatus] = useState<'loading' | 'done' | 'error'>('loading')
    const [errorMsg, setErrorMsg] = useState('')

    useEffect(() => {
        if (!containerRef.current) return

        let cancelled = false
        setStatus('loading')
        setErrorMsg('')

        ;(async () => {
            try {
                const res = await fetch(url)
                if (!res.ok) throw new Error(`Failed to fetch document (${res.status})`)
                const blob = await res.blob()

                if (cancelled || !containerRef.current) return

                await renderAsync(blob, containerRef.current, undefined, {
                    className: 'docx-preview',
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
                    renderHeaders: true,
                    renderFooters: true,
                    renderFootnotes: true,
                    renderEndnotes: true,
                    renderComments: false,
                    debug: false,
                })

                if (!cancelled) setStatus('done')
            } catch (err: any) {
                if (!cancelled) {
                    setErrorMsg(err?.message || 'Failed to render document')
                    setStatus('error')
                }
            }
        })()

        return () => { cancelled = true }
    }, [url])

    return (
        <div className="flex flex-col h-full w-full bg-[#f3f4f6]">
            {status === 'loading' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-gray-500 z-10 pointer-events-none">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                    <p className="text-xs font-medium">Loading document…</p>
                </div>
            )}

            {status === 'error' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-red-500 px-8 z-10">
                    <AlertCircle className="w-8 h-8" />
                    <p className="text-sm font-medium text-center">{errorMsg}</p>
                </div>
            )}

            <div
                ref={containerRef}
                className="flex-1 overflow-auto p-4"
                style={{ visibility: status === 'done' ? 'visible' : 'hidden' }}
            />
        </div>
    )
}
