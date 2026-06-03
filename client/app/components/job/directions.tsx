import { useEffect } from 'react'
import { useMap, useMapsLibrary } from '@vis.gl/react-google-maps'

type Coords = { lat: number; lng: number }

interface DirectionsProps {
    origin: Coords
    destination: Coords
    onResult: (distanceKm: number) => void
}

// ─── Directions renderer ─────────────────────────────────────────────────────
// Inner component (must live inside <Map>) that uses the Google Maps
// Directions Service to draw a driving-route polyline and report the distance.
export function Directions({ origin, destination, onResult }: DirectionsProps) {
    const map       = useMap()
    const routesLib = useMapsLibrary('routes')

    useEffect(() => {
        if (!map || !routesLib) return

        const service  = new routesLib.DirectionsService()
        const renderer = new routesLib.DirectionsRenderer({
            map,
            suppressMarkers: true,
            polylineOptions: { strokeColor: '#3b82f6', strokeWeight: 4, strokeOpacity: 0.85 },
        })

        service.route(
            {
                origin:      { lat: origin.lat,      lng: origin.lng      },
                destination: { lat: destination.lat, lng: destination.lng },
                travelMode:  routesLib.TravelMode.DRIVING,
            },
            (result, status) => {
                if (status === 'OK' && result) {
                    renderer.setDirections(result)
                    const meters = result.routes[0]?.legs[0]?.distance?.value ?? 0
                    onResult(meters / 1000)
                }
            },
        )

        return () => renderer.setMap(null)
    }, [map, routesLib, origin.lat, origin.lng, destination.lat, destination.lng, onResult])

    return null
}
