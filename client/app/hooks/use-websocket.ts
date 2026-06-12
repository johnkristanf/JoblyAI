import { useEffect, useRef, useCallback } from 'react'

export interface UseWebSocketProps {
    url: string | null
    onOpen?: (event: Event, ws: WebSocket) => void
    onMessage?: (event: MessageEvent, ws: WebSocket) => void
    onClose?: (event: CloseEvent, ws: WebSocket) => void
    onError?: (event: Event, ws: WebSocket) => void
}

export function useWebSocket({
    url,
    onOpen,
    onMessage,
    onClose,
    onError,
}: UseWebSocketProps) {
    const wsRef = useRef<WebSocket | null>(null)
    
    // Store latest callbacks to avoid reconnecting when callbacks change
    const callbacksRef = useRef({ onOpen, onMessage, onClose, onError })

    useEffect(() => {
        callbacksRef.current = { onOpen, onMessage, onClose, onError }
    })

    useEffect(() => {
        if (!url) return

        const ws = new WebSocket(url)
        ws.binaryType = 'arraybuffer'
        wsRef.current = ws

        ws.onopen = (e) => callbacksRef.current.onOpen?.(e, ws)
        ws.onmessage = (e) => callbacksRef.current.onMessage?.(e, ws)
        ws.onclose = (e) => callbacksRef.current.onClose?.(e, ws)
        ws.onerror = (e) => callbacksRef.current.onError?.(e, ws)

        return () => {
            ws.close()
            wsRef.current = null
        }
    }, [url])

    const send = useCallback((data: string | ArrayBuffer) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(data)
        }
    }, [])

    const close = useCallback(() => {
        if (wsRef.current) {
            wsRef.current.close()
        }
    }, [])

    return { wsRef, send, close }
}
