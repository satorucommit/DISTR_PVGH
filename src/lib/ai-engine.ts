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

interface AIAnalysisResult {
  verificationScore: number
  detectedSeverity: 'critical' | 'high' | 'medium' | 'low'
  isSpam: boolean
  duplicateIncidents: string[]
  keywords: string[]
  imageAnalysis: {
    hasImages: boolean
    detectedObjects: string[]
    confidence: number
  }
  riskAssessment: {
    level: 'low' | 'medium' | 'high' | 'critical'
    factors: string[]
  }
}

export class AIEngine {
  private criticalKeywords = [
    'life threatening', 'emergency', 'critical', 'immediate danger', 'trapped',
    'injury', 'bleeding', 'unconscious', 'heart attack', 'stroke', 'fire',
    'building collapse', 'explosion', 'gas leak', 'electrocution', 'drowning'
  ]

  private highKeywords = [
    'injured', 'hurt', 'accident', 'blocked', 'stuck', 'stranded',
    'evacuation', 'urgent', 'need help', 'rescue', 'missing'
  ]

  private mediumKeywords = [
    'damage', 'flood', 'power outage', 'water', 'supplies', 'food',
    'shelter', 'medical', 'assistance', 'support'
  ]

  private spamIndicators = [
    'test', 'fake', 'joke', 'prank', 'drill', 'exercise', 'simulation'
  ]

  analyzeIncident(incident: Incident, allIncidents: Incident[]): AIAnalysisResult {
    const duplicateIncidents = this.detectDuplicates(incident, allIncidents)
    const isSpam = this.detectSpam(incident)
    const detectedSeverity = this.calculateSeverity(incident)
    const keywords = this.extractKeywords(incident.description)
    const imageAnalysis = this.analyzeImages(incident)
    const riskAssessment = this.assessRisk(incident, detectedSeverity, keywords)
    const verificationScore = this.calculateVerificationScore(
      incident, 
      duplicateIncidents, 
      isSpam, 
      imageAnalysis
    )

    return {
      verificationScore,
      detectedSeverity,
      isSpam,
      duplicateIncidents,
      keywords,
      imageAnalysis,
      riskAssessment
    }
  }

  private detectDuplicates(incident: Incident, allIncidents: Incident[]): string[] {
    const duplicates: string[] = []
    const incidentTime = new Date(incident.timestamp).getTime()
    const thirtyMinutes = 30 * 60 * 1000

    allIncidents.forEach(otherIncident => {
      if (otherIncident.id === incident.id) return

      const otherTime = new Date(otherIncident.timestamp).getTime()
      const timeDiff = Math.abs(incidentTime - otherTime)

      if (timeDiff > thirtyMinutes) return

      const distance = this.calculateDistance(
        incident.location.lat,
        incident.location.lng,
        otherIncident.location.lat,
        otherIncident.location.lng
      )

      if (distance < 0.5) { // 500 meters
        const similarity = this.calculateSimilarity(incident.description, otherIncident.description)
        if (similarity > 0.7) {
          duplicates.push(otherIncident.id)
        }
      }
    })

    return duplicates
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371 // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1)
    const dLng = this.toRadians(lng2 - lng1)
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180)
  }

  private calculateSimilarity(text1: string, text2: string): number {
    const words1 = text1.toLowerCase().split(/\s+/)
    const words2 = text2.toLowerCase().split(/\s+/)
    const intersection = words1.filter(word => words2.includes(word))
    const union = [...new Set([...words1, ...words2])]
    return intersection.length / union.length
  }

  private detectSpam(incident: Incident): boolean {
    const description = incident.description.toLowerCase()
    
    // Check for spam indicators
    const hasSpamKeywords = this.spamIndicators.some(indicator => 
      description.includes(indicator)
    )

    // Check for unusually short descriptions
    const isTooShort = description.length < 10

    // Check for excessive capitalization
    const excessiveCaps = (description.match(/[A-Z]/g) || []).length > description.length * 0.5

    // Check for repetitive characters
    const hasRepetitiveChars = /(.)\1{3,}/.test(description)

    return hasSpamKeywords || isTooShort || excessiveCaps || hasRepetitiveChars
  }

  private calculateSeverity(incident: Incident): 'critical' | 'high' | 'medium' | 'low' {
    const description = incident.description.toLowerCase()

    // Check for critical indicators
    if (this.criticalKeywords.some(keyword => description.includes(keyword))) {
      return 'critical'
    }

    // Check for high priority indicators
    if (this.highKeywords.some(keyword => description.includes(keyword))) {
      return 'high'
    }

    // Check for medium priority indicators
    if (this.mediumKeywords.some(keyword => description.includes(keyword))) {
      return 'medium'
    }

    // Check incident type
    if (['medical_emergency', 'fire', 'building_collapse', 'gas_leak'].includes(incident.type)) {
      return 'critical'
    }

    if (['missing_person', 'flood', 'blocked_road'].includes(incident.type)) {
      return 'high'
    }

    if (['shelter_needed', 'power_outage'].includes(incident.type)) {
      return 'medium'
    }

    return 'low'
  }

  private extractKeywords(text: string): string[] {
    const words = text.toLowerCase().split(/\s+/)
    const keywords: string[] = []

    // Extract medical keywords
    const medicalKeywords = ['injury', 'bleeding', 'pain', 'unconscious', 'breathing', 'heart']
    keywords.push(...words.filter(word => medicalKeywords.includes(word)))

    // Extract danger keywords
    const dangerKeywords = ['fire', 'flood', 'collapse', 'explosion', 'danger', 'emergency']
    keywords.push(...words.filter(word => dangerKeywords.includes(word)))

    // Extract location keywords
    const locationKeywords = ['street', 'avenue', 'building', 'floor', 'room', 'highway']
    keywords.push(...words.filter(word => locationKeywords.includes(word)))

    // Extract people keywords
    const peopleKeywords = ['people', 'person', 'family', 'child', 'elderly', 'man', 'woman']
    keywords.push(...words.filter(word => peopleKeywords.includes(word)))

    return [...new Set(keywords)]
  }

  private analyzeImages(incident: Incident): {
    hasImages: boolean
    detectedObjects: string[]
    confidence: number
  } {
    const hasImages = incident.media && incident.media.length > 0

    if (!hasImages) {
      return {
        hasImages: false,
        detectedObjects: [],
        confidence: 0
      }
    }

    // Simulate image analysis based on incident type and description
    const detectedObjects: string[] = []
    let confidence = 0

    const description = incident.description.toLowerCase()

    if (description.includes('fire') || incident.type === 'fire') {
      detectedObjects.push('fire', 'smoke', 'flames')
      confidence += 0.3
    }

    if (description.includes('flood') || incident.type === 'flood') {
      detectedObjects.push('water', 'flooding', 'debris')
      confidence += 0.3
    }

    if (description.includes('damage') || description.includes('collapse')) {
      detectedObjects.push('debris', 'damage', 'rubble')
      confidence += 0.2
    }

    if (description.includes('injury') || description.includes('medical')) {
      detectedObjects.push('people', 'injury', 'emergency')
      confidence += 0.2
    }

    // Add confidence based on number of images
    confidence += Math.min(incident.media.length * 0.1, 0.2)

    return {
      hasImages: true,
      detectedObjects: [...new Set(detectedObjects)],
      confidence: Math.min(confidence, 1)
    }
  }

  private assessRisk(
    incident: Incident, 
    severity: string, 
    keywords: string[]
  ): {
    level: 'low' | 'medium' | 'high' | 'critical'
    factors: string[]
  } {
    const factors: string[] = []
    let riskScore = 0

    // Severity-based risk
    if (severity === 'critical') {
      riskScore += 40
      factors.push('Critical incident type')
    } else if (severity === 'high') {
      riskScore += 30
      factors.push('High priority incident')
    } else if (severity === 'medium') {
      riskScore += 20
      factors.push('Medium priority incident')
    } else {
      riskScore += 10
      factors.push('Low priority incident')
    }

    // Keyword-based risk
    const highRiskKeywords = ['life', 'death', 'critical', 'emergency', 'immediate']
    const mediumRiskKeywords = ['injury', 'damage', 'blocked', 'stuck']

    highRiskKeywords.forEach(keyword => {
      if (keywords.includes(keyword)) {
        riskScore += 15
        factors.push(`High-risk keyword: ${keyword}`)
      }
    })

    mediumRiskKeywords.forEach(keyword => {
      if (keywords.includes(keyword)) {
        riskScore += 10
        factors.push(`Medium-risk keyword: ${keyword}`)
      }
    })

    // Location-based risk (simulate high-density areas)
    const highRiskAreas = ['downtown', 'city center', 'highway', 'hospital']
    const address = incident.location.address.toLowerCase()
    
    highRiskAreas.forEach(area => {
      if (address.includes(area)) {
        riskScore += 10
        factors.push(`High-risk location: ${area}`)
      }
    })

    // Time-based risk (night time is higher risk)
    const hour = new Date(incident.timestamp).getHours()
    if (hour >= 22 || hour <= 6) {
      riskScore += 10
      factors.push('Night time incident')
    }

    // Determine risk level
    let level: 'low' | 'medium' | 'high' | 'critical'
    if (riskScore >= 70) {
      level = 'critical'
    } else if (riskScore >= 50) {
      level = 'high'
    } else if (riskScore >= 30) {
      level = 'medium'
    } else {
      level = 'low'
    }

    return { level, factors }
  }

  private calculateVerificationScore(
    incident: Incident,
    duplicates: string[],
    isSpam: boolean,
    imageAnalysis: { confidence: number }
  ): number {
    let score = 50 // Base score

    // Deduct for spam
    if (isSpam) {
      score -= 40
    }

    // Add for duplicates (corroboration)
    score += Math.min(duplicates.length * 15, 30)

    // Add for image evidence
    score += imageAnalysis.confidence * 20

    // Add for detailed description
    if (incident.description.length > 50) {
      score += 10
    }

    // Add for contact information
    if (incident.reportedBy.phone && incident.reportedBy.email) {
      score += 10
    }

    // Add for specific details
    const hasSpecificDetails = /\d+/.test(incident.description) || 
                              incident.description.includes('street') ||
                              incident.description.includes('building')
    if (hasSpecificDetails) {
      score += 10
    }

    return Math.max(0, Math.min(100, Math.round(score)))
  }

  groupIncidents(incidents: Incident[]): {
    groups: {
      id: string
      centerLat: number
      centerLng: number
      incidents: Incident[]
      type: string
      severity: string
    }[]
    ungrouped: Incident[]
  } {
    const groups: any[] = []
    const ungrouped: Incident[] = []
    const processed = new Set<string>()

    incidents.forEach(incident => {
      if (processed.has(incident.id)) return

      const nearbyIncidents = incidents.filter(other => {
        if (other.id === incident.id || processed.has(other.id)) return false

        const distance = this.calculateDistance(
          incident.location.lat,
          incident.location.lng,
          other.location.lat,
          other.location.lng
        )

        return distance < 1 && incident.type === other.type // 1km radius, same type
      })

      if (nearbyIncidents.length > 0) {
        const groupIncidents = [incident, ...nearbyIncidents]
        const centerLat = groupIncidents.reduce((sum, i) => sum + i.location.lat, 0) / groupIncidents.length
        const centerLng = groupIncidents.reduce((sum, i) => sum + i.location.lng, 0) / groupIncidents.length

        // Determine group severity (highest)
        const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
        const groupSeverity = groupIncidents.reduce((highest, i) => 
          severityOrder[i.severity] > severityOrder[highest] ? i.severity : highest,
          'low' as keyof typeof severityOrder
        )

        groups.push({
          id: `GROUP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          centerLat,
          centerLng,
          incidents: groupIncidents,
          type: incident.type,
          severity: groupSeverity
        })

        groupIncidents.forEach(i => processed.add(i.id))
      } else {
        ungrouped.push(incident)
      }
    })

    return { groups, ungrouped }
  }
}

export const aiEngine = new AIEngine()