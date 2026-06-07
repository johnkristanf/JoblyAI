import type React from 'react'

export function ControlBtn({
    active,
    onToggle,
    iconOn,
    iconOff,
    label,
}: {
    active: boolean
    onToggle: () => void
    iconOn: React.ReactNode
    iconOff: React.ReactNode
    label: string
}) {
    return (
        <button
            onClick={onToggle}
            aria-label={label}
            title={label}
            className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95"
            style={{
                background: active ? 'rgba(255,255,255,0.12)' : '#ea4335',
                color: '#ffffff',
            }}
        >
            {active ? iconOn : iconOff}
        </button>
    )
}
