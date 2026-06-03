import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'react-router'
import { APIProvider, Map, AdvancedMarker, useMap } from '@vis.gl/react-google-maps'
import { MapPin, Navigation, Briefcase, Loader2, AlertTriangle } from 'lucide-react'
import { Directions } from '~/components/job/directions'
import { distanceMeters } from '~/lib/utils'

export const meta = () => [
    { title: 'Job Location – JoblyAI' },
    { name: 'description', content: 'View the job location and travel route from your current position.' },
]

const API_KEY = import.meta.env.VITE_GOOGLE_MAP_API_KEY as string

type Coords = { lat: number; lng: number }



// ─── Street View tracker – lifts pegman position up to parent ────────────────
// Listens to the map's built-in StreetViewPanorama and calls onNearby whenever
// the panorama activates/moves near a known marker.
const PROXIMITY_M = 120 // metres – treat as "on top of" a marker

function StreetViewTracker({ jobCoords, userCoords, onNearby }: {
    jobCoords: Coords
    userCoords: Coords | null
    onNearby: (target: 'job' | 'user' | null) => void
}) {
    const map = useMap()

    useEffect(() => {
        if (!map) return
        const sv = map.getStreetView()

        function check() {
            if (!sv.getVisible()) { onNearby(null); return }
            const pos = sv.getPosition()
            if (!pos) return
            const svCoords: Coords = { lat: pos.lat(), lng: pos.lng() }

            if (distanceMeters(svCoords, jobCoords) < PROXIMITY_M) {
                onNearby('job')
            } else if (userCoords && distanceMeters(svCoords, userCoords) < PROXIMITY_M) {
                onNearby('user')
            } else {
                onNearby(null)
            }
        }

        const visListener = sv.addListener('visible_changed', check)
        const posListener = sv.addListener('position_changed', check)

        return () => {
            visListener.remove()
            posListener.remove()
        }
    }, [map, jobCoords, userCoords, onNearby])

    return null
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function JobLocationPage() {
    const [searchParams] = useSearchParams()

    const jobLat   = parseFloat(searchParams.get('lat')      ?? '')
    const jobLng   = parseFloat(searchParams.get('lng')      ?? '')
    const jobTitle = searchParams.get('title')    ?? 'Job Location'
    const employer = searchParams.get('employer') ?? ''

    const validJob = !isNaN(jobLat) && !isNaN(jobLng)

    const [userCoords,  setUserCoords]  = useState<Coords | null>(null)
    const [geoError,    setGeoError]    = useState<string | null>(null)
    const [geoLoading,  setGeoLoading]  = useState(true)
    const [distanceKm,  setDistanceKm]  = useState<number | null>(null)
    // which marker (if any) is below the dropped pegman
    const [elevated,    setElevated]    = useState<'job' | 'user' | null>(null)

    // Geolocation
    useEffect(() => {
        if (!validJob) { setGeoLoading(false); return }
        if (!navigator.geolocation) {
            setGeoError('Geolocation is not supported by your browser.')
            setGeoLoading(false)
            return
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
                setGeoLoading(false)
            },
            (err) => { setGeoError(err.message); setGeoLoading(false) },
            { timeout: 10000 },
        )
    }, [validJob])

    const handleDistance = useCallback((km: number) => setDistanceKm(km), [])
    const handleNearby   = useCallback((t: 'job' | 'user' | null) => setElevated(t), [])

    const center      = validJob ? { lat: jobLat, lng: jobLng } : { lat: 20, lng: 0 }
    const jobCoords   = { lat: jobLat, lng: jobLng }

    // shared transition style applied to all markers; elevated ones shift up
    const markerStyle = (key: 'job' | 'user') => ({
        transition: 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
        transform:  elevated === key ? 'translateY(-52px)' : 'translateY(0)',
    })

    return (
        <div className="flex flex-col h-dvh bg-white overflow-hidden font-sans">

            {/* ── header ── */}
            <header className="flex items-center justify-between gap-4 px-5 py-3 bg-blue-500 shadow-md shrink-0 flex-wrap">
                <div className="flex items-center gap-2.5 min-w-0">
                    <Briefcase size={18} className="text-white shrink-0" />
                    <div className="min-w-0">
                        <p className="text-sm font-bold text-white truncate">{jobTitle}</p>
                        {employer && <p className="text-xs text-blue-100 truncate mt-0.5">{employer}</p>}
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    {distanceKm !== null && (
                        <span className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-white/20 text-white border border-white/30">
                            <MapPin size={13} /> {distanceKm.toFixed(1)} km
                        </span>
                    )}
                    {geoLoading && (
                        <span className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-white/20 text-white border border-white/30">
                            <Loader2 size={13} className="animate-spin" /> Locating you…
                        </span>
                    )}
                    {geoError && (
                        <span className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-red-100/20 text-red-100 border border-red-200/40">
                            <AlertTriangle size={13} /> {geoError}
                        </span>
                    )}
                    {!geoLoading && !geoError && userCoords && (
                        <span className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-green-100/20 text-green-100 border border-green-200/40">
                            <Navigation size={13} /> Route ready
                        </span>
                    )}
                </div>
            </header>

            {/* ── legend ── */}
            <div className="flex items-center gap-5 px-5 py-1.5 bg-slate-50 border-b border-slate-200 shrink-0 flex-wrap">
                <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_5px_rgba(34,211,238,0.6)] shrink-0" />
                    Your location
                </span>
                <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_5px_rgba(59,130,246,0.6)] shrink-0" />
                    Job location
                </span>
                <span className="flex items-center gap-1.5 text-xs font-medium text-slate-400 italic">
                    💡 Drag the <span className="mx-1 not-italic">🧍</span> icon onto the map to enter Street View
                </span>
            </div>

            {/* ── map ── */}
            <div className="flex-1 relative overflow-hidden">
                {!validJob ? (
                    <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-400 text-sm">
                        <MapPin size={48} className="text-slate-300" />
                        <p>No valid coordinates were provided.</p>
                    </div>
                ) : (
                    <APIProvider apiKey={API_KEY}>
                        <Map
                            mapId="joblyai-map"
                            defaultCenter={center}
                            defaultZoom={13}
                            style={{ width: '100%', height: '100%' }}
                            streetViewControl={true}
                            fullscreenControl={false}
                            mapTypeControl={false}
                            zoomControl={true}
                            gestureHandling="greedy"
                        >
                            {/* Driving route */}
                            {userCoords && (
                                <Directions
                                    origin={userCoords}
                                    destination={jobCoords}
                                    onResult={handleDistance}
                                />
                            )}

                            {/* Street View tracker – elevates markers when Pegman lands near them */}
                            <StreetViewTracker
                                jobCoords={jobCoords}
                                userCoords={userCoords}
                                onNearby={handleNearby}
                            />

                            {/* Job pin */}
                            <AdvancedMarker
                                position={jobCoords}
                                title={jobTitle}
                                style={markerStyle('job')}
                            >
                                <div className="flex items-center justify-center w-10 h-10 rounded-[50%_50%_50%_0] -rotate-45 bg-blue-500 text-white border-2 border-blue-300 shadow-lg hover:scale-110 cursor-default"
                                    style={{ transition: 'transform 0.2s ease' }}>
                                    <Briefcase size={17} className="rotate-45" />
                                </div>
                            </AdvancedMarker>

                            {/* User pin */}
                            {userCoords && (
                                <AdvancedMarker
                                    position={userCoords}
                                    title="Your location"
                                    style={markerStyle('user')}
                                >
                                    <div className="flex items-center justify-center w-10 h-10 rounded-[50%_50%_50%_0] -rotate-45 bg-cyan-400 text-white border-2 border-cyan-200 shadow-lg hover:scale-110 cursor-default"
                                        style={{ transition: 'transform 0.2s ease' }}>
                                        <Navigation size={17} className="rotate-45" />
                                    </div>
                                </AdvancedMarker>
                            )}
                        </Map>
                    </APIProvider>
                )}
            </div>
        </div>
    )
}
