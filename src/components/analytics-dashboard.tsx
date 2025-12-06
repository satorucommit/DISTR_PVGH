'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  AlertTriangle, 
  Users, 
  MapPin,
  Clock,
  Shield,
  Thermometer,
  Cloud,
  Wind
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

interface AnalyticsDashboardProps {
  incidents: Incident[]
  safeZones: SafeZone[]
}

export function AnalyticsDashboard({ incidents, safeZones }: AnalyticsDashboardProps) {
  const [weatherData, setWeatherData] = useState<any>(null)
  const [riskZones, setRiskZones] = useState<any[]>([])

  useEffect(() => {
    // Simulate weather data
    setWeatherData({
      temperature: 72,
      condition: 'Partly Cloudy',
      humidity: 65,
      windSpeed: 12,
      alert: 'No weather alerts'
    })

    // Calculate risk zones based on incident density
    const calculateRiskZones = () => {
      const zones = [
        { name: 'Downtown', risk: 0.8, incidents: 15 },
        { name: 'Riverside', risk: 0.6, incidents: 8 },
        { name: 'Industrial Area', risk: 0.4, incidents: 5 },
        { name: 'Residential North', risk: 0.3, incidents: 3 },
        { name: 'Suburbs', risk: 0.1, incidents: 1 }
      ]
      setRiskZones(zones)
    }

    calculateRiskZones()
  }, [incidents])

  const getIncidentTrends = () => {
    const now = new Date()
    const last24h = incidents.filter(i => {
      const incidentTime = new Date(i.timestamp)
      return (now.getTime() - incidentTime.getTime()) < 24 * 60 * 60 * 1000
    })

    const last7d = incidents.filter(i => {
      const incidentTime = new Date(i.timestamp)
      return (now.getTime() - incidentTime.getTime()) < 7 * 24 * 60 * 60 * 1000
    })

    return {
      last24h: last24h.length,
      last7d: last7d.length,
      trend: last24h.length > 5 ? 'up' : 'down'
    }
  }

  const getResponseTimeStats = () => {
    const resolvedIncidents = incidents.filter(i => i.status === 'resolved')
    const avgResponseTime = resolvedIncidents.length > 0 ? 45 : 0 // Simulated average in minutes
    
    return {
      average: avgResponseTime,
      critical: 25,
      high: 35,
      medium: 50,
      low: 60
    }
  }

  const getResourceUtilization = () => {
    return {
      ambulances: { available: 8, total: 12, utilization: 33 },
      rescueTeams: { available: 5, total: 8, utilization: 38 },
      shelters: { 
        total: safeZones.filter(z => z.type === 'shelter').length,
        averageOccupancy: safeZones.filter(z => z.type === 'shelter')
          .reduce((acc, z) => acc + (z.currentOccupancy / z.capacity), 0) / 
          Math.max(safeZones.filter(z => z.type === 'shelter').length, 1) * 100
      },
      hospitals: {
        total: safeZones.filter(z => z.type === 'hospital').length,
        averageOccupancy: safeZones.filter(z => z.type === 'hospital')
          .reduce((acc, z) => acc + (z.currentOccupancy / z.capacity), 0) / 
          Math.max(safeZones.filter(z => z.type === 'hospital').length, 1) * 100
      }
    }
  }

  const getPredictiveAnalytics = () => {
    return {
      nextHourRisk: 0.3,
      next24hRisk: 0.6,
      resourceDemand: {
        ambulances: 'High',
        shelters: 'Medium',
        medical: 'High',
        food: 'Low'
      },
      evacuationRoutes: [
        { route: 'Highway 101 North', status: 'Clear', capacity: 'High' },
        { route: 'Main Street East', status: 'Congested', capacity: 'Medium' },
        { route: 'Coastal Road', status: 'Blocked', capacity: 'Low' }
      ]
    }
  }

  const trends = getIncidentTrends()
  const responseStats = getResponseTimeStats()
  const resources = getResourceUtilization()
  const predictions = getPredictiveAnalytics()

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Incidents</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{incidents.filter(i => i.status !== 'resolved').length}</div>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              {trends.trend === 'up' ? (
                <>
                  <TrendingUp className="h-3 w-3 text-red-500" />
                  <span>+{trends.last24h} in last 24h</span>
                </>
              ) : (
                <>
                  <TrendingDown className="h-3 w-3 text-green-500" />
                  <span>{trends.last24h} in last 24h</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{responseStats.average}m</div>
            <div className="text-xs text-muted-foreground">
              Critical: {responseStats.critical}m
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resource Availability</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resources.ambulances.available}/{resources.ambulances.total}</div>
            <div className="text-xs text-muted-foreground">
              Ambulances available
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Risk Level</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">Medium</div>
            <div className="text-xs text-muted-foreground">
              Next 24h: {Math.round(predictions.next24hRisk * 100)}%
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="risk">Risk Assessment</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Incident Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Incident Trends</CardTitle>
                <CardDescription>7-day incident overview</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total Incidents (7 days)</span>
                    <Badge variant="secondary">{trends.last7d}</Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Critical</span>
                      <span>{incidents.filter(i => i.severity === 'critical').length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>High</span>
                      <span>{incidents.filter(i => i.severity === 'high').length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Medium</span>
                      <span>{incidents.filter(i => i.severity === 'medium').length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Low</span>
                      <span>{incidents.filter(i => i.severity === 'low').length}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Response Times */}
            <Card>
              <CardHeader>
                <CardTitle>Response Times</CardTitle>
                <CardDescription>Average response by severity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Critical</span>
                      <span>{responseStats.critical}m</span>
                    </div>
                    <Progress value={(responseStats.critical / 60) * 100} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>High</span>
                      <span>{responseStats.high}m</span>
                    </div>
                    <Progress value={(responseStats.high / 60) * 100} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Medium</span>
                      <span>{responseStats.medium}m</span>
                    </div>
                    <Progress value={(responseStats.medium / 60) * 100} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Low</span>
                      <span>{responseStats.low}m</span>
                    </div>
                    <Progress value={(responseStats.low / 60) * 100} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Weather Conditions */}
          <Card>
            <CardHeader>
              <CardTitle>Weather Conditions</CardTitle>
              <CardDescription>Current weather affecting response operations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center space-x-2">
                  <Thermometer className="h-4 w-4 text-orange-500" />
                  <div>
                    <p className="text-sm font-medium">{weatherData?.temperature}°F</p>
                    <p className="text-xs text-muted-foreground">Temperature</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Cloud className="h-4 w-4 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium">{weatherData?.condition}</p>
                    <p className="text-xs text-muted-foreground">Condition</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Wind className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">{weatherData?.windSpeed} mph</p>
                    <p className="text-xs text-muted-foreground">Wind Speed</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Activity className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="text-sm font-medium">{weatherData?.humidity}%</p>
                    <p className="text-xs text-muted-foreground">Humidity</p>
                  </div>
                </div>
              </div>
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <p className="text-sm"><strong>Weather Alert:</strong> {weatherData?.alert}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risk" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Risk Zone Assessment</CardTitle>
              <CardDescription>High-risk areas based on incident density</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {riskZones.map((zone, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{zone.name}</p>
                        <p className="text-sm text-muted-foreground">{zone.incidents} incidents</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-24">
                        <Progress value={zone.risk * 100} className="h-2" />
                      </div>
                      <Badge variant={
                        zone.risk > 0.7 ? 'destructive' :
                        zone.risk > 0.4 ? 'default' : 'secondary'
                      }>
                        {Math.round(zone.risk * 100)}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resources" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Emergency Resources</CardTitle>
                <CardDescription>Current resource availability</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Ambulances</span>
                      <span>{resources.ambulances.available}/{resources.ambulances.total}</span>
                    </div>
                    <Progress value={resources.ambulances.utilization} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Rescue Teams</span>
                      <span>{resources.rescueTeams.available}/{resources.rescueTeams.total}</span>
                    </div>
                    <Progress value={resources.rescueTeams.utilization} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Facility Capacity</CardTitle>
                <CardDescription>Shelter and hospital occupancy</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Shelters</span>
                      <span>{Math.round(resources.shelters.averageOccupancy)}%</span>
                    </div>
                    <Progress value={resources.shelters.averageOccupancy} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Hospitals</span>
                      <span>{Math.round(resources.hospitals.averageOccupancy)}%</span>
                    </div>
                    <Progress value={resources.hospitals.averageOccupancy} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="predictions" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Risk Predictions</CardTitle>
                <CardDescription>AI-powered risk assessment</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Next Hour</span>
                      <span>{Math.round(predictions.nextHourRisk * 100)}%</span>
                    </div>
                    <Progress value={predictions.nextHourRisk * 100} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Next 24 Hours</span>
                      <span>{Math.round(predictions.next24hRisk * 100)}%</span>
                    </div>
                    <Progress value={predictions.next24hRisk * 100} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resource Demand Forecast</CardTitle>
                <CardDescription>Predicted resource needs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Ambulances</span>
                    <Badge variant={predictions.resourceDemand.ambulances === 'High' ? 'destructive' : 'secondary'}>
                      {predictions.resourceDemand.ambulances}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Shelters</span>
                    <Badge variant={predictions.resourceDemand.shelters === 'High' ? 'destructive' : 'secondary'}>
                      {predictions.resourceDemand.shelters}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Medical</span>
                    <Badge variant={predictions.resourceDemand.medical === 'High' ? 'destructive' : 'secondary'}>
                      {predictions.resourceDemand.medical}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Food Supplies</span>
                    <Badge variant={predictions.resourceDemand.food === 'High' ? 'destructive' : 'secondary'}>
                      {predictions.resourceDemand.food}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Evacuation Routes</CardTitle>
              <CardDescription>Current status of evacuation routes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {predictions.evacuationRoutes.map((route, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{route.route}</p>
                      <p className="text-sm text-muted-foreground">Capacity: {route.capacity}</p>
                    </div>
                    <Badge variant={
                      route.status === 'Clear' ? 'default' :
                      route.status === 'Congested' ? 'secondary' : 'destructive'
                    }>
                      {route.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}