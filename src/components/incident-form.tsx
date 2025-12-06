'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Camera, MapPin, Phone, User, CheckCircle, AlertTriangle, Upload } from 'lucide-react'

export interface IncidentFormData {
  type: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  description: string
  location: { lat: number; lng: number; address: string }
  reportedBy: { name: string; phone: string; email: string }
  media: string[]
}

interface IncidentFormProps {
  onSubmit: (incident: Omit<IncidentFormData, 'media'>) => void
  userLocation: { lat: number; lng: number } | null
}

const incidentTypes = [
  { value: 'blocked_road', label: 'Blocked Road', icon: '🚧' },
  { value: 'missing_person', label: 'Missing Person', icon: '👤' },
  { value: 'fire', label: 'Fire', icon: '🔥' },
  { value: 'flood', label: 'Flood', icon: '🌊' },
  { value: 'medical_emergency', label: 'Medical Emergency', icon: '🚑' },
  { value: 'shelter_needed', label: 'Shelter Needed', icon: '🏠' },
  { value: 'building_collapse', label: 'Building Collapse', icon: '🏢' },
  { value: 'power_outage', label: 'Power Outage', icon: '⚡' },
  { value: 'gas_leak', label: 'Gas Leak', icon: '💨' },
  { value: 'other', label: 'Other', icon: '⚠️' }
]

const severityLevels = [
  { value: 'critical', label: 'Critical - Life Threatening', color: 'bg-red-500' },
  { value: 'high', label: 'High - Urgent', color: 'bg-orange-500' },
  { value: 'medium', label: 'Medium - Important', color: 'bg-yellow-500' },
  { value: 'low', label: 'Low - Information', color: 'bg-green-500' }
]

export function IncidentForm({ onSubmit, userLocation }: IncidentFormProps) {
  const [formData, setFormData] = useState<IncidentFormData>({
    type: '',
    severity: 'medium',
    description: '',
    location: userLocation ? { 
      lat: userLocation.lat, 
      lng: userLocation.lng, 
      address: 'Current Location' 
    } : { lat: 0, lng: 0, address: '' },
    reportedBy: { name: '', phone: '', email: '' },
    media: []
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [incidentId, setIncidentId] = useState('')

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleReporterChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      reportedBy: {
        ...prev.reportedBy,
        [field]: value
      }
    }))
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      const fileArray = Array.from(files)
      const mediaUrls = fileArray.map(file => URL.createObjectURL(file))
      setFormData(prev => ({
        ...prev,
        media: [...prev.media, ...mediaUrls]
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))

    const { media, ...incidentData } = formData
    onSubmit(incidentData)
    
    setIncidentId(`INC-${Date.now()}`)
    setSubmitted(true)
    setIsSubmitting(false)

    // Reset form after 3 seconds
    setTimeout(() => {
      setSubmitted(false)
      setFormData({
        type: '',
        severity: 'medium',
        description: '',
        location: userLocation ? { 
          lat: userLocation.lat, 
          lng: userLocation.lng, 
          address: 'Current Location' 
        } : { lat: 0, lng: 0, address: '' },
        reportedBy: { name: '', phone: '', email: '' },
        media: []
      })
    }, 3000)
  }

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            location: {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              address: 'Current Location'
            }
          }))
        },
        (error) => {
          console.error('Error getting location:', error)
        }
      )
    }
  }

  if (submitted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-green-600">
            <CheckCircle className="h-6 w-6" />
            <span>Incident Reported Successfully</span>
          </CardTitle>
          <CardDescription>
            Your report has been submitted and is being processed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Incident ID:</strong> {incidentId}
            </AlertDescription>
          </Alert>
          <div className="space-y-2">
            <p className="text-sm"><strong>What happens next:</strong></p>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Your report will be verified by our AI system</li>
              <li>• Emergency services will be notified if critical</li>
              <li>• You'll receive updates on your report status</li>
              <li>• Nearby safe zones have been identified for you</li>
            </ul>
          </div>
          <div className="pt-4 border-t">
            <p className="text-sm font-medium mb-2">Nearby Safe Zones:</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-muted rounded">
                <span className="text-sm">Central Community Shelter</span>
                <Badge variant="outline">2.3 km</Badge>
              </div>
              <div className="flex items-center justify-between p-2 bg-muted rounded">
                <span className="text-sm">City General Hospital</span>
                <Badge variant="outline">3.7 km</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <AlertTriangle className="h-5 w-5" />
          <span>Report Emergency Incident</span>
        </CardTitle>
        <CardDescription>
          Provide details about the emergency situation. Your report will help coordinate response efforts.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Incident Type */}
          <div className="space-y-2">
            <Label>Incident Type *</Label>
            <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select incident type" />
              </SelectTrigger>
              <SelectContent>
                {incidentTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center space-x-2">
                      <span>{type.icon}</span>
                      <span>{type.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Severity Level */}
          <div className="space-y-2">
            <Label>Severity Level *</Label>
            <div className="grid grid-cols-2 gap-2">
              {severityLevels.map((level) => (
                <Button
                  key={level.value}
                  type="button"
                  variant={formData.severity === level.value ? "default" : "outline"}
                  className={`justify-start h-auto p-3 ${
                    formData.severity === level.value ? level.color : ''
                  }`}
                  onClick={() => handleInputChange('severity', level.value)}
                >
                  <div className="flex items-center space-x-2">
                    <div className={`h-3 w-3 rounded-full ${level.color}`}></div>
                    <span className="text-sm">{level.label}</span>
                  </div>
                </Button>
              ))}
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label>Location *</Label>
            <div className="flex space-x-2">
              <Input
                value={formData.location.address}
                onChange={(e) => handleInputChange('location', {
                  ...formData.location,
                  address: e.target.value
                })}
                placeholder="Enter address or use current location"
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={getCurrentLocation}
                className="px-3"
              >
                <MapPin className="h-4 w-4" />
              </Button>
            </div>
            {userLocation && (
              <p className="text-xs text-muted-foreground">
                GPS: {userLocation.lat.toFixed(6)}, {userLocation.lng.toFixed(6)}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Description *</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe the incident in detail. Include any immediate dangers, number of people affected, and specific needs."
              rows={4}
            />
          </div>

          {/* Media Upload */}
          <div className="space-y-2">
            <Label>Photos/Videos (Optional)</Label>
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4">
              <input
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleFileUpload}
                className="hidden"
                id="media-upload"
              />
              <label htmlFor="media-upload" className="cursor-pointer">
                <div className="flex flex-col items-center space-y-2">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Click to upload photos or videos
                  </span>
                </div>
              </label>
            </div>
            {formData.media.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.media.map((url, index) => (
                  <Badge key={index} variant="secondary">
                    Media {index + 1}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <Label>Your Contact Information *</Label>
            <div className="space-y-3">
              <div className="flex space-x-2">
                <div className="flex-1">
                  <Input
                    value={formData.reportedBy.name}
                    onChange={(e) => handleReporterChange('name', e.target.value)}
                    placeholder="Your name"
                    required
                  />
                </div>
                <div className="flex-1">
                  <Input
                    value={formData.reportedBy.phone}
                    onChange={(e) => handleReporterChange('phone', e.target.value)}
                    placeholder="Phone number"
                    required
                  />
                </div>
              </div>
              <Input
                value={formData.reportedBy.email}
                onChange={(e) => handleReporterChange('email', e.target.value)}
                placeholder="Email address (optional)"
                type="email"
              />
            </div>
          </div>

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isSubmitting || !formData.type || !formData.description}
          >
            {isSubmitting ? 'Submitting...' : 'Report Incident'}
          </Button>

          {/* Emergency Notice */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              For immediate life-threatening emergencies, call your local emergency services first.
            </AlertDescription>
          </Alert>
        </form>
      </CardContent>
    </Card>
  )
}