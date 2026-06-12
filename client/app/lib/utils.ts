import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase()
    if (ext === 'pdf') return '📄'
    if (ext === 'doc' || ext === 'docx') return '📝'
    return '📋'
}

export const formatDate = (dateString: string) => {
    try {
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        })
    } catch {
        return dateString
    }
}

export const validateResumeFile = (file: File): { isValid: boolean; error?: string } => {
    const allowedTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
    ]
    const allowedExtensions = ['pdf', 'doc', 'docx']
    const fileTypeValid = allowedTypes.includes(file.type)
    const ext = file.name.split('.').pop()?.toLowerCase()
    const extValid = ext ? allowedExtensions.includes(ext) : false

    if (!fileTypeValid && !extValid) {
        return {
            isValid: false,
            error: 'Invalid file type. Only PDF and Word (.doc/.docx) files are allowed.',
        }
    }

    return { isValid: true }
}

export type ResumeFileType = 'pdf' | 'docx' | 'doc' | 'unknown'

/**
 * Derives the file type from a filename or S3 object key by inspecting its extension.
 * Returns a discriminated union so callers can switch/branch without raw string comparisons.
 */
export const getFileType = (fileNameOrKey: string): ResumeFileType => {
    const ext = fileNameOrKey.split('.').pop()?.toLowerCase()
    if (ext === 'pdf') return 'pdf'
    if (ext === 'docx') return 'docx'
    if (ext === 'doc') return 'doc'
    return 'unknown'
}

/** Convenience helpers built on top of getFileType */
export const isDocxFile = (fileNameOrKey: string) => getFileType(fileNameOrKey) === 'docx'
export const isPdfFile = (fileNameOrKey: string) => getFileType(fileNameOrKey) === 'pdf'

/**
 * Haversine formula – returns the great-circle distance in **metres**
 * between two lat/lng coordinates.
 */
export function distanceMeters(
    a: { lat: number; lng: number },
    b: { lat: number; lng: number },
): number {
    const R = 6_371_000
    const dLat = (b.lat - a.lat) * (Math.PI / 180)
    const dLon = (b.lng - a.lng) * (Math.PI / 180)
    const x =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(a.lat * (Math.PI / 180)) *
            Math.cos(b.lat * (Math.PI / 180)) *
            Math.sin(dLon / 2) ** 2
    return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
}

// ── Audio Processing Utilities ──────────────────────────────────────────────

export function downsampleBuffer(
    buffer: Float32Array,
    inputSampleRate: number,
    outputSampleRate: number,
): Float32Array {
    if (inputSampleRate === outputSampleRate) return buffer
    const ratio = inputSampleRate / outputSampleRate
    const newLength = Math.round(buffer.length / ratio)
    const result = new Float32Array(newLength)
    for (let i = 0; i < newLength; i++) {
        result[i] = buffer[Math.round(i * ratio)]
    }
    return result
}

export function float32ToInt16Pcm(float32: Float32Array): Int16Array {
    const int16 = new Int16Array(float32.length)
    for (let i = 0; i < float32.length; i++) {
        int16[i] = Math.max(-32768, Math.min(32767, float32[i] * 32768))
    }
    return int16
}

export function encodePcmToBase64(int16: Int16Array): string {
    const bytes = new Uint8Array(int16.buffer)
    let binary = ''
    bytes.forEach((b) => (binary += String.fromCharCode(b)))
    return btoa(binary)
}
