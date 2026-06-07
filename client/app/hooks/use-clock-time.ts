import { useEffect, useState } from 'react'

export function useClockTime() {
    const fmt = () =>
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const [time, setTime] = useState(fmt)
    useEffect(() => {
        const id = setInterval(() => setTime(fmt()), 1000)
        return () => clearInterval(id)
    }, [])
    return time
}
