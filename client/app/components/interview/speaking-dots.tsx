export function SpeakingDots() {
    return (
        <span className="flex items-end gap-[3px] h-3">
            {[0, 0.15, 0.3].map((delay, i) => (
                <span
                    key={i}
                    className="w-1 rounded-full bg-blue-400 animate-bounce"
                    style={{
                        height: '10px',
                        animationDelay: `${delay}s`,
                        animationDuration: '0.8s',
                    }}
                />
            ))}
        </span>
    )
}
