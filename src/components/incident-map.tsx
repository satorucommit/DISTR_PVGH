'use client'

import { useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { 
  MapPin, 
  Filter, 
  Layers, 
  Maximize2, 
  Navigation,
  Activity,
  Shield,
  Hospital,
  Home
} from 'lucide-react'

interface Incident {
  id: string
  type: string
  location: { lat: number; lng: number; address: string }
  severity: 'critical' | 'high' | 'medium' | 'low'
  description: string
  media: string[]
  timestamp: string
  status: 'pending' | 'in_progress' | 'resolved'
  reportedBy: { name: string; phone: string; email: string }
  verificationScore: number
}

interface SafeZone {
  id: string
  name: string
  location: { lat: number; lng: number }
  capacity: number
  currentOccupancy: number
  type: 'shelter' | 'hospital' | 'aid_center'
}

interface IncidentMapProps {
  incidents: Incident[]
  safeZones: SafeZone[]
  userLocation: { lat: number; lng: number } | null
  onIncidentSelect: (incident: Incident) => void
}

declare global {
  interface Window {
    L: any
  }
}

export function IncidentMap({ incidents, safeZones, userLocation, onIncidentSelect }: IncidentMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const [filterType, setFilterType] = useState('all')
  const [showHeatmap, setShowHeatmap] = useState(false)
  const [showClusters, setShowClusters] = useState(true)
  const [mapLayer, setMapLayer] = useState('street')

  useEffect(() => {
    // Load Leaflet CSS and JS
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    document.head.appendChild(link)

    const script = document.createElement('script')
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.onload = () => {
      initializeMap()
    }
    document.head.appendChild(script)

    return () => {
      if (link.parentNode) link.parentNode.removeChild(link)
      if (script.parentNode) script.parentNode.removeChild(script)
    }
  }, [])

  useEffect(() => {
    if (mapInstanceRef.current) {
      updateMarkers()
    }
  }, [incidents, safeZones, filterType, showClusters])

  const initializeMap = () => {
    if (!mapRef.current || !window.L) return

    const L = window.L
    
    // Initialize map centered on user location or default
    const center = userLocation || { lat: 40.7128, lng: -74.0060 }
    
    const map = L.map(mapRef.current).setView([center.lat, center.lng], 13)

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map)

    mapInstanceRef.current = map

    // Add user location marker
    if (userLocation) {
      const userIcon = L.divIcon({
        html: `<div class="flex items-center justify-center w-8 h-8 bg-blue-500 rounded-full border-2 border-white shadow-lg">
          <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/>
          </svg>
        </div>`,
        className: 'user-location-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 32]
      })

      L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
        .addTo(map)
        .bindPopup('Your Location')
    }

    updateMarkers()
  }

  const updateMarkers = () => {
    if (!mapInstanceRef.current || !window.L) return

    const L = window.L
    const map = mapInstanceRef.current

    // Clear existing markers
    markersRef.current.forEach(marker => map.removeLayer(marker))
    markersRef.current = []

    // Filter incidents
    const filteredIncidents = filterType === 'all' 
      ? incidents 
      : incidents.filter(incident => incident.severity === filterType)

    // Add incident markers
    filteredIncidents.forEach(incident => {
      if (incident.status === 'resolved') return

      const color = incident.severity === 'critical' ? '#ef4444' :
                   incident.severity === 'high' ? '#f97316' :
                   incident.severity === 'medium' ? '#eab308' : '#22c55e'

      const icon = L.divIcon({
        html: `<div class="flex items-center justify-center w-6 h-6 rounded-full border-2 border-white shadow-lg" style="background-color: ${color}">
          <div class="w-2 h-2 bg-white rounded-full"></div>
        </div>`,
        className: 'incident-marker',
        iconSize: [24, 24],
        iconAnchor: [12, 24]
      })

      const marker = L.marker([incident.location.lat, incident.location.lng], { icon })
        .addTo(map)
        .bindPopup(`
          <div class="p-2">
            <h3 class="font-bold">${incident.id}</h3>
            <p class="text-sm">${incident.type}</p>
            <p class="text-xs">${incident.description.substring(0, 100)}...</p>
            <p class="text-xs font-medium">Status: ${incident.status.replace('_', ' ')}</p>
            <button onclick="window.selectIncident('${incident.id}')" class="mt-2 px-2 py-1 bg-blue-500 text-white text-xs rounded">
              View Details
            </button>
          </div>
        `)

      markersRef.current.push(marker)
    })

    // Add safe zone markers
    safeZones.forEach(zone => {
      const color = zone.type === 'hospital' ? '#ef4444' :
                   zone.type === 'shelter' ? '#3b82f6' : '#10b981'

      const icon = zone.type === 'hospital' ? '🏥' :
                   zone.type === 'shelter' ? '🏠' : '🎯'

      const zoneIcon = L.divIcon({
        html: `<div class="flex items-center justify-center w-8 h-8 rounded-full border-2 border-white shadow-lg" style="background-color: ${color}">
          <span class="text-sm">${icon}</span>
        </div>`,
        className: 'safe-zone-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 32]
      })

      const marker = L.marker([zone.location.lat, zone.location.lng], { icon: zoneIcon })
        .addTo(map)
        .bindPopup(`
          <div class="p-2">
            <h3 class="font-bold">${zone.name}</h3>
            <p class="text-sm">Type: ${zone.type}</p>
            <p class="text-sm">Capacity: ${zone.currentOccupancy}/${zone.capacity}</p>
            <p class="text-sm">Availability: ${Math.round((1 - zone.currentOccupancy/zone.capacity) * 100)}%</p>
          </div>
        `)

      markersRef.current.push(marker)
    })

    // Add heatmap simulation (circles for high-density areas)
    if (showHeatmap) {
      const hotspots = [
        { lat: 40.7128, lng: -74.0060, intensity: 0.8 },
        { lat: 40.7580, lng: -73.9855, intensity: 0.6 },
        { lat: 40.7489, lng: -73.9680, intensity: 0.4 }
      ]

      hotspots.forEach(spot => {
        const circle = L.circle([spot.lat, spot.lng], {
          color: 'red',
          fillColor: '#f03',
          fillOpacity: spot.intensity * 0.3,
          radius: 1000
        }).addTo(map)

        markersRef.current.push(circle)
      })
    }
  }

  // Global function for popup buttons
  useEffect(() => {
    (window as any).selectIncident = (incidentId: string) => {
      const incident = incidents.find(i => i.id === incidentId)
      if (incident) onIncidentSelect(incident)
    }
  }, [incidents, onIncidentSelect])

  const getFilteredStats = () => {
    const filtered = filterType === 'all' 
      ? incidents 
      : incidents.filter(incident => incident.severity === filterType)

    return {
      total: filtered.filter(i => i.status !== 'resolved').length,
      critical: filtered.filter(i => i.severity === 'critical' && i.status !== 'resolved').length,
      high: filtered.filter(i => i.severity === 'high' && i.status !== 'resolved').length,
      medium: filtered.filter(i => i.severity === 'medium' && i.status !== 'resolved').length,
      low: filtered.filter(i => i.severity === 'low' && i.status !== 'resolved').length
    }
  }

  const stats = getFilteredStats()

  return (
    <div className="space-y-4">
      {/* Map Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <MapPin className="h-5 w-5" />
              <span>Live Incident Map</span>
            </span>
            <div className="flex items-center space-x-2">
              <Badge variant="outline">
                {stats.total} Active Incidents
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (mapInstanceRef.current && userLocation) {
                    mapInstanceRef.current.setView([userLocation.lat, userLocation.lng], 15)
                  }
                }}
              >
                <Navigation className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (mapRef.current) {
                    mapRef.current.requestFullscreen()
                  }
                }}
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4 mb-4">
            {/* Filter */}
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4" />
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Heatmap Toggle */}
            <div className="flex items-center space-x-2">
              <Switch
                id="heatmap"
                checked={showHeatmap}
                onCheckedChange={setShowHeatmap}
              />
              <Label htmlFor="heatmap">Heatmap</Label>
            </div>

            {/* Clusters Toggle */}
            <div className="flex items-center space-x-2">
              <Switch
                id="clusters"
                checked={showClusters}
                onCheckedChange={setShowClusters}
              />
              <Label htmlFor="clusters">Clusters</Label>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 mb-4 p-3 bg-muted rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-sm">Critical ({stats.critical})</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <span className="text-sm">High ({stats.high})</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span className="text-sm">Medium ({stats.medium})</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm">Low ({stats.low})</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm">🏥</span>
              <span className="text-sm">Hospitals</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm">🏠</span>
              <span className="text-sm">Shelters</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm">🎯</span>
              <span className="text-sm">Aid Centers</span>
            </div>
          </div>

          {/* Map Container */}
          <div 
            ref={mapRef} 
            className="w-full h-96 rounded-lg border"
            style={{ minHeight: '500px' }}
          ></div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Activity className="h-4 w-4 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{stats.critical}</p>
                <p className="text-xs text-muted-foreground">Critical</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{stats.high}</p>
                <p className="text-xs text-muted-foreground">High Priority</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Hospital className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{safeZones.filter(z => z.type === 'hospital').length}</p>
                <p className="text-xs text-muted-foreground">Hospitals</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Home className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{safeZones.filter(z => z.type === 'shelter').length}</p>
                <p className="text-xs text-muted-foreground">Shelters</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}