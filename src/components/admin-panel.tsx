'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Users, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  MapPin,
  Plus,
  Edit,
  Trash2,
  Send,
  Activity,
  Settings
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

interface AdminPanelProps {
  incidents: Incident[]
  safeZones: SafeZone[]
  onIncidentsUpdate: (incidents: Incident[]) => void
  onSafeZonesUpdate: (safeZones: SafeZone[]) => void
}

export function AdminPanel({ incidents, safeZones, onIncidentsUpdate, onSafeZonesUpdate }: AdminPanelProps) {
  const [selectedIncident, setSelectedIncident] = useState<string | null>(null)
  const [broadcastMessage, setBroadcastMessage] = useState('')
  const [newSafeZone, setNewSafeZone] = useState({
    name: '',
    type: 'shelter' as const,
    capacity: 100,
    location: { lat: 40.7128, lng: -74.0060 }
  })

  const updateIncidentStatus = (incidentId: string, status: Incident['status']) => {
    const updatedIncidents = incidents.map(incident =>
      incident.id === incidentId ? { ...incident, status } : incident
    )
    onIncidentsUpdate(updatedIncidents)
    if (typeof window !== 'undefined') {
      localStorage.setItem('incidents', JSON.stringify(updatedIncidents))
    }
  }

  const deleteIncident = (incidentId: string) => {
    const updatedIncidents = incidents.filter(incident => incident.id !== incidentId)
    onIncidentsUpdate(updatedIncidents)
    if (typeof window !== 'undefined') {
      localStorage.setItem('incidents', JSON.stringify(updatedIncidents))
    }
  }

  const addSafeZone = () => {
    if (!newSafeZone.name) return

    const zone: SafeZone = {
      id: `ZONE-${Date.now()}`,
      ...newSafeZone,
      currentOccupancy: 0
    }

    const updatedSafeZones = [...safeZones, zone]
    onSafeZonesUpdate(updatedSafeZones)
    if (typeof window !== 'undefined') {
      localStorage.setItem('safeZones', JSON.stringify(updatedSafeZones))
    }

    setNewSafeZone({
      name: '',
      type: 'shelter',
      capacity: 100,
      location: { lat: 40.7128, lng: -74.0060 }
    })
  }

  const deleteSafeZone = (zoneId: string) => {
    const updatedSafeZones = safeZones.filter(zone => zone.id !== zoneId)
    onSafeZonesUpdate(updatedSafeZones)
    if (typeof window !== 'undefined') {
      localStorage.setItem('safeZones', JSON.stringify(updatedSafeZones))
    }
  }

  const sendBroadcast = () => {
    if (!broadcastMessage.trim()) return

    // Store broadcast in localStorage
    if (typeof window !== 'undefined') {
      const broadcasts = JSON.parse(localStorage.getItem('broadcasts') || '[]')
      const newBroadcast = {
        id: `BROADCAST-${Date.now()}`,
        message: broadcastMessage,
        timestamp: new Date().toISOString(),
        type: 'emergency'
      }
      broadcasts.push(newBroadcast)
      localStorage.setItem('broadcasts', JSON.stringify(broadcasts))

      // Show browser notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Emergency Broadcast', {
          body: broadcastMessage,
          icon: '/favicon.ico'
        })
      }
    }

    setBroadcastMessage('')
  }

  const getIncidentStats = () => {
    const pending = incidents.filter(i => i.status === 'pending').length
    const inProgress = incidents.filter(i => i.status === 'in_progress').length
    const resolved = incidents.filter(i => i.status === 'resolved').length
    const critical = incidents.filter(i => i.severity === 'critical' && i.status !== 'resolved').length

    return { pending, inProgress, resolved, critical }
  }

  const stats = getIncidentStats()

  return (
    <div className="space-y-6">
      {/* Admin Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Awaiting response</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{stats.inProgress}</div>
            <p className="text-xs text-muted-foreground">Being handled</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{stats.critical}</div>
            <p className="text-xs text-muted-foreground">Need immediate attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.resolved}</div>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="incidents" className="space-y-4">
        <TabsList>
          <TabsTrigger value="incidents">Incidents</TabsTrigger>
          <TabsTrigger value="safezones">Safe Zones</TabsTrigger>
          <TabsTrigger value="broadcast">Broadcast</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
        </TabsList>

        <TabsContent value="incidents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Incident Management</CardTitle>
              <CardDescription>Review and manage all reported incidents</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {incidents.map((incident) => (
                  <div key={incident.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-medium">{incident.id}</span>
                        <Badge variant={
                          incident.severity === 'critical' ? 'destructive' :
                          incident.severity === 'high' ? 'default' : 'secondary'
                        }>
                          {incident.severity}
                        </Badge>
                        <Badge variant="outline">{incident.type}</Badge>
                        <Badge variant={
                          incident.status === 'resolved' ? 'default' :
                          incident.status === 'in_progress' ? 'secondary' : 'outline'
                        }>
                          {incident.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">{incident.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {incident.location.address} • {new Date(incident.timestamp).toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Reported by: {incident.reportedBy.name} • Score: {incident.verificationScore}%
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {incident.status === 'pending' && (
                        <Button
                          size="sm"
                          onClick={() => updateIncidentStatus(incident.id, 'in_progress')}
                        >
                          Start
                        </Button>
                      )}
                      {incident.status === 'in_progress' && (
                        <Button
                          size="sm"
                          onClick={() => updateIncidentStatus(incident.id, 'resolved')}
                        >
                          Resolve
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedIncident(incident.id)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteIncident(incident.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {incidents.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">No incidents reported</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="safezones" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Add Safe Zone</CardTitle>
                <CardDescription>Add new shelter, hospital, or aid center</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Name</Label>
                  <Input
                    value={newSafeZone.name}
                    onChange={(e) => setNewSafeZone(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter safe zone name"
                  />
                </div>
                <div>
                  <Label>Type</Label>
                  <Select value={newSafeZone.type} onValueChange={(value: any) => setNewSafeZone(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="shelter">Shelter</SelectItem>
                      <SelectItem value="hospital">Hospital</SelectItem>
                      <SelectItem value="aid_center">Aid Center</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Capacity</Label>
                  <Input
                    type="number"
                    value={newSafeZone.capacity}
                    onChange={(e) => setNewSafeZone(prev => ({ ...prev, capacity: parseInt(e.target.value) }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>Latitude</Label>
                    <Input
                      type="number"
                      step="0.000001"
                      value={newSafeZone.location.lat}
                      onChange={(e) => setNewSafeZone(prev => ({
                        ...prev,
                        location: { ...prev.location, lat: parseFloat(e.target.value) }
                      }))}
                    />
                  </div>
                  <div>
                    <Label>Longitude</Label>
                    <Input
                      type="number"
                      step="0.000001"
                      value={newSafeZone.location.lng}
                      onChange={(e) => setNewSafeZone(prev => ({
                        ...prev,
                        location: { ...prev.location, lng: parseFloat(e.target.value) }
                      }))}
                    />
                  </div>
                </div>
                <Button onClick={addSafeZone} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Safe Zone
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Existing Safe Zones</CardTitle>
                <CardDescription>Manage current safe zones</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {safeZones.map((zone) => (
                    <div key={zone.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{zone.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {zone.type} • {zone.currentOccupancy}/{zone.capacity}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteSafeZone(zone.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {safeZones.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">No safe zones</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="broadcast" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Emergency Broadcast</CardTitle>
              <CardDescription>
                Send urgent messages to all users in the system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Message</Label>
                <Textarea
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  placeholder="Enter your emergency message..."
                  rows={4}
                />
              </div>
              <Button onClick={sendBroadcast} className="w-full">
                <Send className="h-4 w-4 mr-2" />
                Send Emergency Broadcast
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Broadcasts</CardTitle>
            </CardHeader>
            <CardContent>
              {typeof window !== 'undefined' && JSON.parse(localStorage.getItem('broadcasts') || '[]').length > 0 ? (
                <div className="space-y-3">
                  {JSON.parse(localStorage.getItem('broadcasts') || '[]')
                    .slice(0, 5)
                    .map((broadcast: any) => (
                      <div key={broadcast.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            {new Date(broadcast.timestamp).toLocaleString()}
                          </span>
                          <Badge variant="destructive">Emergency</Badge>
                        </div>
                        <p className="text-sm mt-1">{broadcast.message}</p>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No broadcasts sent yet
                </p>
              )}
              {typeof window !== 'undefined' && JSON.parse(localStorage.getItem('broadcasts') || '[]').length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No broadcasts sent yet
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resources" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Ambulances</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Available</span>
                    <Badge variant="secondary">8</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Deployed</span>
                    <Badge variant="default">4</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Maintenance</span>
                    <Badge variant="outline">2</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Rescue Teams</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Available</span>
                    <Badge variant="secondary">5</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Deployed</span>
                    <Badge variant="default">3</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Standby</span>
                    <Badge variant="outline">2</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Medical Supplies</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>First Aid</span>
                    <Badge variant="secondary">85%</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Emergency Kit</span>
                    <Badge variant="default">60%</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Oxygen</span>
                    <Badge variant="outline">92%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}