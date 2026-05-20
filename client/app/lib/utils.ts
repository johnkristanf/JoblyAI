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
    const allowedTypes = ['application/pdf']
    const allowedExtensions = ['pdf']
    const fileTypeValid = allowedTypes.includes(file.type)
    const ext = file.name.split('.').pop()?.toLowerCase()
    const extValid = ext ? allowedExtensions.includes(ext) : false

    if (!fileTypeValid && !extValid) {
        return { isValid: false, error: 'Invalid file type. Only PDF files are allowed.' }
    }
    
    return { isValid: true }
}
