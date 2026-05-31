interface MatchScoreRingProps {
    /** Score from 0 to 100 */
    score: number
    /** Short label shown below the ring, e.g. "Skills" */
    label: string
    /** Diameter of the SVG in px (default 56) */
    size?: number
    /** Stroke thickness in px (default 5) */
    strokeWidth?: number
    /** Optional tailwind class for the label */
    labelClassName?: string
}

export function MatchScoreRing({
    score,
    label,
    size = 56,
    strokeWidth = 5,
    labelClassName = 'text-gray-400',
}: MatchScoreRingProps) {
    const radius = (size - strokeWidth) / 2
    const circumference = 2 * Math.PI * radius
    const progress = Math.min(Math.max(score, 0), 100)
    const offset = circumference - (progress / 100) * circumference

    const color =
        progress >= 75 ? '#16a34a' :  // green-600
        progress >= 50 ? '#ca8a04' :  // yellow-600
        '#dc2626'                      // red-600

    return (
        <div className="flex flex-col items-center gap-0.5">
            <div
                className="relative flex items-center justify-center shrink-0"
                style={{ width: size, height: size }}
            >
                <svg width={size} height={size} className="-rotate-90">
                    {/* Track */}
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="none"
                        stroke="#e5e7eb"
                        strokeWidth={strokeWidth}
                    />
                    {/* Progress arc */}
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="none"
                        stroke={color}
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                    />
                </svg>
                <span
                    className="absolute text-xs font-bold leading-none"
                    style={{ color }}
                >
                    {progress}
                </span>
            </div>
            <span className={`text-[10px] font-medium text-center leading-tight ${labelClassName}`}>
                {label}
            </span>
        </div>
    )
}
