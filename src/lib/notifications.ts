interface Notification {
  id: string
  type: 'incident' | 'broadcast' | 'resource' | 'safe_zone'
  title: string
  message: string
  timestamp: string
  read: boolean
  priority: 'low' | 'medium' | 'high' | 'critical'
  data?: any
}

interface NotificationSettings {
  incidentRadius: number // km
  broadcastAlerts: boolean
  resourceAlerts: boolean
  safeZoneAlerts: boolean
  soundEnabled: boolean
  desktopEnabled: boolean
}

export class NotificationManager {
  private settings: NotificationSettings = {
    incidentRadius: 5,
    broadcastAlerts: true,
    resourceAlerts: true,
    safeZoneAlerts: true,
    soundEnabled: true,
    desktopEnabled: true
  }

  private notifications: Notification[] = []

  constructor() {
    this.loadSettings()
    this.loadNotifications()
    this.requestPermission()
  }

  private loadSettings() {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('notificationSettings')
      if (stored) {
        this.settings = { ...this.settings, ...JSON.parse(stored) }
      }
    }
  }

  private loadNotifications() {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('notifications')
      if (stored) {
        this.notifications = JSON.parse(stored)
      }
    }
  }

  private saveNotifications() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('notifications', JSON.stringify(this.notifications))
    }
  }

  private async requestPermission() {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission()
    }
  }

  updateSettings(newSettings: Partial<NotificationSettings>) {
    this.settings = { ...this.settings, ...newSettings }
    if (typeof window !== 'undefined') {
      localStorage.setItem('notificationSettings', JSON.stringify(this.settings))
    }
  }

  getSettings(): NotificationSettings {
    return { ...this.settings }
  }

  addNotification(notification: Omit<Notification, 'id' | 'timestamp' | 'read'>): string {
    const newNotification: Notification = {
      ...notification,
      id: `NOTIF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      read: false
    }

    this.notifications.unshift(newNotification)
    this.saveNotifications()

    // Send desktop notification if enabled
    if (this.settings.desktopEnabled && 'Notification' in window && Notification.permission === 'granted') {
      this.sendDesktopNotification(newNotification)
    }

    // Play sound if enabled
    if (this.settings.soundEnabled) {
      this.playNotificationSound(notification.priority)
    }

    return newNotification.id
  }

  private sendDesktopNotification(notification: Notification) {
    const notificationOptions: NotificationOptions = {
      body: notification.message,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: notification.type,
      requireInteraction: notification.priority === 'critical'
    }

    const desktopNotification = new Notification(notification.title, notificationOptions)

    // Auto-close after 5 seconds for non-critical notifications
    if (notification.priority !== 'critical') {
      setTimeout(() => {
        desktopNotification.close()
      }, 5000)
    }

    // Handle click
    desktopNotification.onclick = () => {
      window.focus()
      desktopNotification.close()
      this.markAsRead(notification.id)
    }
  }

  private playNotificationSound(priority: string) {
    try {
      const audio = new Audio()
      
      switch (priority) {
        case 'critical':
          audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiS2Oy9diMFl2+z5N17kUgKUKzn77BdGAg+ltryxnkpBSl+zPLaizsIGGS57OScTgwOUarm7blmFgU7k9n1unEiBC13yO/eizEIHWq+8+OWT'
          break
        case 'high':
          audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiS2Oy9diMFl2+z5N17kUgKUKzn77BdGAg+ltryxnkpBSl+zPLaizsIGGS57OScTgwOUarm7blmFgU7k9n1unEiBC13yO/eizEIHWq+8+OWT'
          break
        default:
          audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiS2Oy9diMFl2+z5N17kUgKUKzn77BdGAg+ltryxnkpBSl+zPLaizsIGGS57OScTgwOUarm7blmFgU7k9n1unEiBC13yO/eizEIHWq+8+OWT'
      }
      
      audio.volume = 0.3
      audio.play().catch(() => {
        // Ignore errors from autoplay policy
      })
    } catch (error) {
      // Ignore audio errors
    }
  }

  getNotifications(): Notification[] {
    return [...this.notifications]
  }

  getUnreadCount(): number {
    return this.notifications.filter(n => !n.read).length
  }

  markAsRead(notificationId: string) {
    const notification = this.notifications.find(n => n.id === notificationId)
    if (notification) {
      notification.read = true
      this.saveNotifications()
    }
  }

  markAllAsRead() {
    this.notifications.forEach(n => n.read = true)
    this.saveNotifications()
  }

  deleteNotification(notificationId: string) {
    this.notifications = this.notifications.filter(n => n.id !== notificationId)
    this.saveNotifications()
  }

  clearAll() {
    this.notifications = []
    this.saveNotifications()
  }

  // Notification methods for different event types

  notifyNewIncident(incident: any, userLocation?: { lat: number; lng: number }) {
    if (!this.settings.broadcastAlerts) return

    // Check if incident is within user's radius
    if (userLocation) {
      const distance = this.calculateDistance(
        userLocation.lat,
        userLocation.lng,
        incident.location.lat,
        incident.location.lng
      )
      
      if (distance > this.settings.incidentRadius) return
    }

    const priority = incident.severity === 'critical' ? 'critical' :
                    incident.severity === 'high' ? 'high' : 'medium'

    this.addNotification({
      type: 'incident',
      title: `New ${incident.type.replace('_', ' ')} reported`,
      message: `${incident.description.substring(0, 100)}...`,
      priority,
      data: { incidentId: incident.id }
    })
  }

  notifyBroadcast(message: string, type: 'emergency' | 'info' = 'emergency') {
    if (!this.settings.broadcastAlerts) return

    this.addNotification({
      type: 'broadcast',
      title: type === 'emergency' ? 'Emergency Broadcast' : 'Information',
      message,
      priority: type === 'emergency' ? 'critical' : 'medium'
    })
  }

  notifyResourceUpdate(resource: string, status: string, location?: string) {
    if (!this.settings.resourceAlerts) return

    this.addNotification({
      type: 'resource',
      title: `${resource} Update`,
      message: `${resource} is now ${status}${location ? ` at ${location}` : ''}`,
      priority: 'medium',
      data: { resource, status, location }
    })
  }

  notifySafeZoneUpdate(zoneName: string, status: string, capacity?: number) {
    if (!this.settings.safeZoneAlerts) return

    let message = `${zoneName} is now ${status}`
    if (capacity !== undefined) {
      message += ` (${capacity}% full)`
    }

    this.addNotification({
      type: 'safe_zone',
      title: 'Safe Zone Update',
      message,
      priority: 'medium',
      data: { zoneName, status, capacity }
    })
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

  // Real-time monitoring
  startMonitoring(incidents: any[], userLocation?: { lat: number; lng: number }) {
    if (typeof window === 'undefined') return;
    
    const checkInterval = 30000 // 30 seconds
    
    setInterval(() => {
      const lastCheck = localStorage.getItem('lastNotificationCheck')
      const lastCheckTime = lastCheck ? new Date(lastCheck).getTime() : 0
      const now = new Date().getTime()

      incidents.forEach(incident => {
        const incidentTime = new Date(incident.timestamp).getTime()
        
        if (incidentTime > lastCheckTime && incidentTime <= now) {
          this.notifyNewIncident(incident, userLocation)
        }
      })

      localStorage.setItem('lastNotificationCheck', new Date().toISOString())
    }, checkInterval)
  }
}

export const notificationManager = new NotificationManager()