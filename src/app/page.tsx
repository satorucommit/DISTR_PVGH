'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MapPin, Phone, Camera, AlertTriangle, CheckCircle, Users, Shield, Activity, Bell, Settings } from 'lucide-react'
import { IncidentForm } from '@/components/incident-form'
import { IncidentMap } from '@/components/incident-map'
import { AdminPanel } from '@/components/admin-panel'
import { AnalyticsDashboard } from '@/components/analytics-dashboard'
import { aiEngine } from '@/lib/ai-engine'
import { notificationManager } from '@/lib/notifications'
import type { IncidentFormData } from '@/components/incident-form'

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

export default function Home() {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [safeZones, setSafeZones] = useState<SafeZone[]>([])
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [activeTab, setActiveTab] = useState('report')
  const [showNotifications, setShowNotifications] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    // Set isClient to true to indicate we're in the browser
    setIsClient(true)
    
    // Get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
        },
        (error) => {
          console.error('Error getting location:', error)
        }
      )
    }
  }, [])

  useEffect(() => {
    // Only run localStorage operations in the browser
    if (typeof window !== 'undefined' && isClient) {
      // Load data from localStorage
      const storedIncidents = localStorage.getItem('incidents')
      const storedSafeZones = localStorage.getItem('safeZones')
      
      if (storedIncidents) {
        setIncidents(JSON.parse(storedIncidents))
      }
      
      if (storedSafeZones) {
        setSafeZones(JSON.parse(storedSafeZones))
      } else {
        // Initialize with sample safe zones
        const initialSafeZones: SafeZone[] = [
          {
            id: '1',
            name: 'Central Community Shelter',
            location: { lat: 40.7128, lng: -74.0060 },
            capacity: 500,
            currentOccupancy: 125,
            type: 'shelter'
          },
          {
            id: '2',
            name: 'City General Hospital',
            location: { lat: 40.7580, lng: -73.9855 },
            capacity: 300,
            currentOccupancy: 200,
            type: 'hospital'
          }
        ]
        setSafeZones(initialSafeZones)
        localStorage.setItem('safeZones', JSON.stringify(initialSafeZones))
      }

      // Check admin status
      const adminStatus = localStorage.getItem('isAdmin')
      setIsAdmin(adminStatus === 'true')

      // Start notification monitoring
      notificationManager.startMonitoring(incidents, userLocation || undefined)
    }
  }, [isClient, incidents, userLocation])

  useEffect(() => {
    // Only run localStorage operations in the browser
    if (typeof window !== 'undefined' && isClient) {
      // Update unread count periodically
      const updateUnreadCount = () => {
        setUnreadCount(notificationManager.getUnreadCount())
      }
      
      updateUnreadCount()
      const interval = setInterval(updateUnreadCount, 5000)
      
      return () => clearInterval(interval)
    }
  }, [isClient])

  useEffect(() => {
    // Only request notification permission in the browser
    if (typeof window !== 'undefined' && isClient) {
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission()
      }
    }
  }, [isClient])

  const handleIncidentSubmit = (incidentData: Omit<IncidentFormData, 'media'>) => {
    // Convert the form data to our internal Incident type
    const newIncidentData: Omit<Incident, 'id' | 'timestamp' | 'status' | 'verificationScore' | 'media'> = {
      type: incidentData.type,
      severity: incidentData.severity,
      description: incidentData.description,
      location: incidentData.location,
      reportedBy: incidentData.reportedBy
    }
    
    // Analyze incident with AI
    const analysis = aiEngine.analyzeIncident(newIncidentData as Incident, incidents)
    
    const newIncident: Incident = {
      ...newIncidentData,
      media: [],
      severity: analysis.detectedSeverity,
      verificationScore: analysis.verificationScore,
      id: `INC-${Date.now()}`,
      timestamp: new Date().toISOString(),
      status: analysis.isSpam ? 'resolved' : 'pending'
    }

    const updatedIncidents = [...incidents, newIncident]
    setIncidents(updatedIncidents)
    if (typeof window !== 'undefined') {
      localStorage.setItem('incidents', JSON.stringify(updatedIncidents))
    }

    // Send notification
    notificationManager.notifyNewIncident(newIncident, userLocation || undefined)

    // Show confirmation notification
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification('Incident Reported', {
        body: `Your incident ${newIncident.id} has been submitted successfully. Verification score: ${analysis.verificationScore}%`,
        icon: '/favicon.ico'
      })
    }
  }

  const requestNotificationPermission = () => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }

  useEffect(() => {
    requestNotificationPermission()
  }, [])

  const getIncidentStats = () => {
    const critical = incidents.filter(i => i.severity === 'critical' && i.status !== 'resolved').length
    const high = incidents.filter(i => i.severity === 'high' && i.status !== 'resolved').length
    const medium = incidents.filter(i => i.severity === 'medium' && i.status !== 'resolved').length
    const total = incidents.filter(i => i.status !== 'resolved').length

    return { critical, high, medium, total }
  }

  const stats = getIncidentStats()

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold">Disaster Response Platform</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm">
                <Activity className="h-4 w-4 text-green-500" />
                <span>System Active</span>
              </div>
              
              {/* Notifications */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative"
                >
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs">
                      {unreadCount}
                    </Badge>
                  )}
                </Button>
                
                {showNotifications && (
                  <Card className="absolute right-0 top-10 w-80 z-50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Notifications</CardTitle>
                    </CardHeader>
                    <CardContent className="max-h-64 overflow-y-auto">
                      {notificationManager.getNotifications().slice(0, 5).map((notification) => (
                        <div key={notification.id} className="mb-2 p-2 border rounded">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{notification.title}</span>
                            <Badge variant={notification.read ? 'secondary' : 'default'}>
                              {notification.read ? 'Read' : 'New'}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{notification.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(notification.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      ))}
                      {notificationManager.getNotifications().length === 0 && (
                        <p className="text-center text-muted-foreground text-sm py-4">No notifications</p>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
              
              {/* Admin Toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const newAdminStatus = !isAdmin
                  setIsAdmin(newAdminStatus)
                  localStorage.setItem('isAdmin', newAdminStatus.toString())
                }}
              >
                <Settings className="h-4 w-4" />
              </Button>
              
              {isAdmin && (
                <Badge variant="secondary">Admin Mode</Badge>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="bg-muted/50 border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <div className="h-3 w-3 bg-red-500 rounded-full"></div>
                <span className="text-sm font-medium">Critical: {stats.critical}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="h-3 w-3 bg-orange-500 rounded-full"></div>
                <span className="text-sm font-medium">High: {stats.high}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="h-3 w-3 bg-yellow-500 rounded-full"></div>
                <span className="text-sm font-medium">Medium: {stats.medium}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="h-3 w-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium">Total Active: {stats.total}</span>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              {userLocation ? 'Location detected' : 'Location unavailable'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="report" className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4" />
              <span>Report Incident</span>
            </TabsTrigger>
            <TabsTrigger value="map" className="flex items-center space-x-2">
              <MapPin className="h-4 w-4" />
              <span>Live Map</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center space-x-2">
              <Activity className="h-4 w-4" />
              <span>Analytics</span>
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="admin" className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>Admin Panel</span>
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="report" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                <IncidentForm 
                  onSubmit={handleIncidentSubmit}
                  userLocation={userLocation}
                />
              </div>
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Reports</CardTitle>
                    <CardDescription>Latest incidents in your area</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {incidents.slice(-5).reverse().map((incident) => (
                        <div key={incident.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className={`h-2 w-2 rounded-full ${
                              incident.severity === 'critical' ? 'bg-red-500' :
                              incident.severity === 'high' ? 'bg-orange-500' :
                              incident.severity === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                            }`}></div>
                            <div>
                              <p className="font-medium text-sm">{incident.id}</p>
                              <p className="text-xs text-muted-foreground">{incident.type}</p>
                            </div>
                          </div>
                          <Badge variant={incident.status === 'resolved' ? 'default' : 'secondary'}>
                            {incident.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      ))}
                      {incidents.length === 0 && (
                        <p className="text-center text-muted-foreground py-8">No incidents reported yet</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Nearby Safe Zones</CardTitle>
                    <CardDescription>Shelters and medical facilities</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {safeZones.slice(0, 3).map((zone) => (
                        <div key={zone.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                              zone.type === 'hospital' ? 'bg-red-100' :
                              zone.type === 'shelter' ? 'bg-blue-100' : 'bg-green-100'
                            }`}>
                              {zone.type === 'hospital' ? '🏥' : 
                               zone.type === 'shelter' ? '🏠' : '🎯'}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{zone.name}</p>
                              <p className="text-xs text-muted-foreground">
                                Capacity: {zone.currentOccupancy}/{zone.capacity}
                              </p>
                            </div>
                          </div>
                          <Button size="sm" variant="outline">Navigate</Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="map">
            <IncidentMap 
              incidents={incidents}
              safeZones={safeZones}
              userLocation={userLocation}
              onIncidentSelect={setSelectedIncident}
            />
          </TabsContent>

          <TabsContent value="analytics">
            <AnalyticsDashboard 
              incidents={incidents}
              safeZones={safeZones}
            />
          </TabsContent>

          {isAdmin && (
            <TabsContent value="admin">
              <AdminPanel 
                incidents={incidents}
                safeZones={safeZones}
                onIncidentsUpdate={setIncidents}
                onSafeZonesUpdate={setSafeZones}
              />
            </TabsContent>
          )}
        </Tabs>
      </main>

      {/* Selected Incident Modal */}
      {selectedIncident && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {selectedIncident.id}
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setSelectedIncident(null)}
                >
                  ×
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Type</Label>
                <p className="text-sm">{selectedIncident.type}</p>
              </div>
              <div>
                <Label>Severity</Label>
                <Badge variant={
                  selectedIncident.severity === 'critical' ? 'destructive' :
                  selectedIncident.severity === 'high' ? 'default' : 'secondary'
                }>
                  {selectedIncident.severity}
                </Badge>
              </div>
              <div>
                <Label>Description</Label>
                <p className="text-sm">{selectedIncident.description}</p>
              </div>
              <div>
                <Label>Location</Label>
                <p className="text-sm">{selectedIncident.location.address}</p>
              </div>
              <div>
                <Label>Reported By</Label>
                <p className="text-sm">{selectedIncident.reportedBy.name}</p>
                <p className="text-sm">{selectedIncident.reportedBy.phone}</p>
              </div>
              <div>
                <Label>Verification Score</Label>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full"
                      style={{ width: `${selectedIncident.verificationScore}%` }}
                    ></div>
                  </div>
                  <span className="text-sm">{selectedIncident.verificationScore}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}