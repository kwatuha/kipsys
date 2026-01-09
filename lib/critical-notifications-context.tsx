"use client"

import React, { createContext, useContext, useState, useCallback, useEffect } from "react"
import { queueApi, patientApi, triageApi } from "@/lib/api"
import { checkAndNotifyCriticalVitals } from "@/lib/critical-vitals-utils"

export interface CriticalNotification {
  id: string
  patientId: string
  patientName?: string
  type: 'vital' | 'lab'
  alerts: Array<{
    parameter: string
    value: number | string
    unit: string
    range: string
    description: string | null
    severity: 'critical' | 'urgent'
  }>
  timestamp: Date
}

const STORAGE_KEY = 'critical-notifications'

// Helper to serialize notifications for localStorage
function serializeNotifications(notifications: CriticalNotification[]): string {
  return JSON.stringify(
    notifications.map(n => ({
      ...n,
      timestamp: n.timestamp.toISOString(),
    }))
  )
}

// Helper to deserialize notifications from localStorage
function deserializeNotifications(data: string): CriticalNotification[] {
  try {
    const parsed = JSON.parse(data)
    return parsed.map((n: any) => ({
      ...n,
      timestamp: new Date(n.timestamp),
    }))
  } catch {
    return []
  }
}

// Load notifications from localStorage
function loadNotificationsFromStorage(): CriticalNotification[] {
  if (typeof window === 'undefined') return []
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return deserializeNotifications(stored)
    }
  } catch (err) {
    console.error('Error loading notifications from storage:', err)
  }
  
  return []
}

// Save notifications to localStorage
function saveNotificationsToStorage(notifications: CriticalNotification[]): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem(STORAGE_KEY, serializeNotifications(notifications))
  } catch (err) {
    console.error('Error saving notifications to storage:', err)
  }
}

interface CriticalNotificationsContextType {
  notifications: CriticalNotification[]
  addNotification: (notification: Omit<CriticalNotification, 'id' | 'timestamp'>) => void
  removeNotification: (patientId: string) => void
  clearAll: () => void
  refreshNotifications: () => Promise<void> // Add function to refresh from database
}

const CriticalNotificationsContext = createContext<CriticalNotificationsContextType | undefined>(undefined)

export function CriticalNotificationsProvider({ children }: { children: React.ReactNode }) {
  // Load notifications from localStorage on mount
  const [notifications, setNotifications] = useState<CriticalNotification[]>(() => {
    if (typeof window === 'undefined') return []
    const loaded = loadNotificationsFromStorage()
    console.log('Loaded notifications from localStorage:', loaded.length, loaded)
    return loaded
  })

  // Save to localStorage whenever notifications change
  useEffect(() => {
    console.log('Saving notifications to localStorage:', notifications.length, notifications)
    saveNotificationsToStorage(notifications)
  }, [notifications])

  const addNotification = useCallback((notification: Omit<CriticalNotification, 'id' | 'timestamp'>) => {
    console.log('✅ [ADD NOTIFICATION] Called with:', {
      patientId: notification.patientId,
      patientName: notification.patientName,
      alertsCount: notification.alerts?.length || 0,
      alerts: notification.alerts
    })
    
    if (!notification.alerts || notification.alerts.length === 0) {
      console.warn('⚠️ [ADD NOTIFICATION] No alerts provided, skipping')
      return
    }
    
    setNotifications((prev) => {
      console.log(`📊 [ADD NOTIFICATION] Current notifications count: ${prev.length}`)
      
      // Check if notification already exists for this patient
      const existingIndex = prev.findIndex((n) => n.patientId === notification.patientId)
      
      let updated: CriticalNotification[]
      if (existingIndex >= 0) {
        // Update existing notification
        updated = [...prev]
        updated[existingIndex] = {
          ...updated[existingIndex],
          ...notification,
          id: updated[existingIndex].id,
          timestamp: updated[existingIndex].timestamp, // Keep original timestamp
        }
        console.log(`🔄 [ADD NOTIFICATION] Updated existing notification for patient ${notification.patientId}. New total: ${updated.length}`)
      } else {
        // Add new notification
        updated = [
          ...prev,
          {
            ...notification,
            id: `critical-${notification.patientId}-${Date.now()}`,
            timestamp: new Date(),
          },
        ]
        console.log(`➕ [ADD NOTIFICATION] Added new notification for patient ${notification.patientId}. New total: ${updated.length}`)
      }
      
      console.log('📋 [ADD NOTIFICATION] Updated notifications:', updated.map(n => ({ 
        patientId: n.patientId, 
        patientName: n.patientName, 
        alertsCount: n.alerts.length 
      })))
      
      return updated
    })
  }, [])

  // Scan database for critical patients on initial load
  useEffect(() => {
    const scanForCriticalPatients = async () => {
      try {
        console.log('🔍 [CRITICAL ALERTS] Starting database scan for critical patients...')
        console.log('🔍 [CRITICAL ALERTS] addNotification function available:', typeof addNotification === 'function')
        
        // Get all vital signs from today
        console.log('🔍 [CRITICAL ALERTS] Fetching today\'s vital signs...')
        const todayVitals = await patientApi.getTodayVitals()
        console.log('🔍 [CRITICAL ALERTS] Today\'s vital signs:', todayVitals?.length || 0, todayVitals)
        
        if (!todayVitals || todayVitals.length === 0) {
          console.log('⚠️ [CRITICAL ALERTS] No vital signs found for today')
          return
        }
        
        // Get critical ranges
        console.log('🔍 [CRITICAL ALERTS] Fetching critical ranges...')
        const ranges = await triageApi.getCriticalVitalRanges()
        const criticalRanges = ranges.filter((r: any) => r.isActive !== false)
        console.log('🔍 [CRITICAL ALERTS] Active critical ranges:', criticalRanges.length, criticalRanges)
        
        if (criticalRanges.length === 0) {
          console.log('⚠️ [CRITICAL ALERTS] No critical ranges configured')
          return
        }
        
        // Get all queue entries to check who's being served
        console.log('🔍 [CRITICAL ALERTS] Fetching queue entries...')
        const [consultationQueue, labQueue, radQueue] = await Promise.allSettled([
          queueApi.getAll('consultation', undefined, 1, 100, true).catch(() => []),
          queueApi.getAll('laboratory', undefined, 1, 100, true).catch(() => []),
          queueApi.getAll('radiology', undefined, 1, 100, true).catch(() => []),
        ])
        
        const allQueueEntries = [
          ...(consultationQueue.status === 'fulfilled' ? consultationQueue.value : []),
          ...(labQueue.status === 'fulfilled' ? labQueue.value : []),
          ...(radQueue.status === 'fulfilled' ? radQueue.value : []),
        ]
        console.log('🔍 [CRITICAL ALERTS] Total queue entries:', allQueueEntries.length)
        
        // Group vitals by patient (get most recent for each patient)
        const patientVitalsMap = new Map<string, any>()
        todayVitals.forEach((vital: any) => {
          const patientId = vital.patientId?.toString()
          if (!patientId) return
          
          const existing = patientVitalsMap.get(patientId)
          if (!existing || new Date(vital.recordedDate) > new Date(existing.recordedDate)) {
            patientVitalsMap.set(patientId, vital)
          }
        })
        
        console.log('🔍 [CRITICAL ALERTS] Unique patients with vitals:', patientVitalsMap.size)
        
        // Check each patient for critical values
        let patientsWithCritical = 0
        for (const [patientId, vital] of patientVitalsMap.entries()) {
          // Check if patient is being served
          const isServed = allQueueEntries.some(
            (entry: any) => entry.patientId?.toString() === patientId && entry.status === 'serving'
          )
          
          if (isServed) {
            console.log(`⏭️ [CRITICAL ALERTS] Patient ${patientId} is being served, skipping`)
            continue
          }
          
          // Check for critical values
          const vitalsForCheck = {
            systolicBP: vital.systolicBP,
            diastolicBP: vital.diastolicBP,
            heartRate: vital.heartRate,
            respiratoryRate: vital.respiratoryRate,
            temperature: vital.temperature,
            oxygenSaturation: vital.oxygenSaturation,
            glasgowComaScale: vital.glasgowComaScale,
            bloodGlucose: vital.bloodGlucose,
          }
          
          console.log(`🔍 [CRITICAL ALERTS] Checking patient ${patientId} vitals:`, vitalsForCheck)
          
          const patientName = vital.patientName || 
            (vital.patientFirstName && vital.patientLastName 
              ? `${vital.patientFirstName} ${vital.patientLastName}`.trim()
              : undefined)
          
          // Check and add notification if critical
          const alerts = await checkAndNotifyCriticalVitals(
            vitalsForCheck,
            patientId,
            patientName,
            addNotification
          )
          
          if (alerts.length > 0) {
            patientsWithCritical++
            console.log(`✅ [CRITICAL ALERTS] Found ${alerts.length} critical alerts for patient ${patientId} (${patientName}):`, alerts)
          } else {
            console.log(`ℹ️ [CRITICAL ALERTS] No critical alerts for patient ${patientId}`)
          }
        }
        
        console.log(`✅ [CRITICAL ALERTS] Finished scanning. Checked ${patientVitalsMap.size} patients, found ${patientsWithCritical} with critical values.`)
        console.log('🔍 [CRITICAL ALERTS] Current notifications after scan:', notifications.length)
      } catch (err) {
        console.error('❌ [CRITICAL ALERTS] Error scanning for critical patients:', err)
        // Log more details about the error
        if (err instanceof Error) {
          console.error('❌ [CRITICAL ALERTS] Error message:', err.message)
          console.error('❌ [CRITICAL ALERTS] Error stack:', err.stack)
        }
      }
    }
    
    // Run scan on mount (with a small delay to ensure context is ready)
    const timer = setTimeout(() => {
      scanForCriticalPatients()
    }, 1000) // Increased delay to ensure everything is ready
    
    return () => clearTimeout(timer)
  }, [addNotification]) // Include addNotification in dependencies

  // Check queue status on initial load to remove notifications for already-served patients
  useEffect(() => {
    if (notifications.length === 0) return

    const checkInitialQueueStatus = async () => {
      const patientIds = notifications.map((n) => n.patientId)
      
      try {
        const queueChecks = await Promise.allSettled(
          patientIds.map(async (patientId) => {
            try {
              const consultationQueue = await queueApi.getAll('consultation', undefined, 1, 100, true)
              const patientEntries = consultationQueue.filter(
                (entry: any) => entry.patientId?.toString() === patientId.toString()
              )
              
              if (patientEntries.length === 0) {
                const [labQueue, radQueue] = await Promise.all([
                  queueApi.getAll('laboratory', undefined, 1, 100, true).catch(() => []),
                  queueApi.getAll('radiology', undefined, 1, 100, true).catch(() => []),
                ])
                
                const allEntries = [...labQueue, ...radQueue]
                const foundEntries = allEntries.filter(
                  (entry: any) => entry.patientId?.toString() === patientId.toString()
                )
                patientEntries.push(...foundEntries)
              }
              
              // Only check for 'serving' status - don't remove for 'completed' as patient may still have critical values
              const isServed = patientEntries.some(
                (entry: any) => entry.status === 'serving'
              )
              
              return { patientId, isServed }
            } catch (err) {
              console.error(`Error checking queue for patient ${patientId}:`, err)
              return { patientId, isServed: false }
            }
          })
        )

        // Remove notifications for patients who are already served
        const toRemove: string[] = []
        queueChecks.forEach((result) => {
          if (result.status === 'fulfilled') {
            const { patientId, isServed } = result.value
            if (isServed) {
              toRemove.push(patientId)
            }
          }
        })

        // Remove all served patients at once
        if (toRemove.length > 0) {
          setNotifications((prev) => prev.filter((n) => !toRemove.includes(n.patientId)))
        }
      } catch (err) {
        console.error('Error checking initial queue statuses:', err)
      }
    }

    // Run once on mount
    checkInitialQueueStatus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run on mount

  const removeNotification = useCallback((patientId: string) => {
    setNotifications((prev) => {
      const updated = prev.filter((n) => n.patientId !== patientId)
      return updated
    })
  }, [])

  const clearAll = useCallback(() => {
    setNotifications([])
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  // Refresh notifications by checking current vital signs from database
  // This is a no-op for now - notifications should persist from localStorage
  // and be added when forms are saved
  const refreshNotifications = useCallback(async () => {
    // Notifications are loaded from localStorage on mount
    // They are added when critical values are detected after form save
    // No need to actively refresh - just ensure they persist
    console.log('Refresh notifications called - notifications should persist from localStorage')
  }, [])

  // Monitor queue status for patients with critical notifications
  useEffect(() => {
    if (notifications.length === 0) return

    const checkQueueStatus = async () => {
      const patientIds = notifications.map((n) => n.patientId)
      
      try {
        // Check queue status for all patients with critical notifications
        // We'll check all service points to see if patient is being served
        const queueChecks = await Promise.allSettled(
          patientIds.map(async (patientId) => {
            try {
              // Get queue entries for this patient across all service points
              // Check consultation first as that's where doctors typically serve patients
              const consultationQueue = await queueApi.getAll('consultation', undefined, 1, 100, true)
              const patientEntries = consultationQueue.filter(
                (entry: any) => entry.patientId?.toString() === patientId.toString()
              )
              
              // If not found in consultation, check other service points
              if (patientEntries.length === 0) {
                const [labQueue, radQueue] = await Promise.all([
                  queueApi.getAll('laboratory', undefined, 1, 100, true).catch(() => []),
                  queueApi.getAll('radiology', undefined, 1, 100, true).catch(() => []),
                ])
                
                const allEntries = [...labQueue, ...radQueue]
                const foundEntries = allEntries.filter(
                  (entry: any) => entry.patientId?.toString() === patientId.toString()
                )
                patientEntries.push(...foundEntries)
              }
              
              // Check if patient is currently being served (not just completed in the past)
              // Only remove if patient is actively being served NOW
              // We only check for 'serving' status - completed status doesn't mean they were served for critical values
              const isServed = patientEntries.some(
                (entry: any) => entry.status === 'serving'
              )
              
              return { patientId, isServed }
            } catch (err) {
              console.error(`Error checking queue for patient ${patientId}:`, err)
              return { patientId, isServed: false }
            }
          })
        )

        // Remove notifications for patients who are being served
        queueChecks.forEach((result) => {
          if (result.status === 'fulfilled') {
            const { patientId, isServed } = result.value
            if (isServed) {
              removeNotification(patientId)
            }
          }
        })
      } catch (err) {
        console.error('Error checking queue statuses:', err)
      }
    }

    // Check immediately on mount and whenever notifications change
    checkQueueStatus()

    // Then check every 10 seconds
    const interval = setInterval(checkQueueStatus, 10000)

    return () => clearInterval(interval)
  }, [notifications, removeNotification])

  return (
    <CriticalNotificationsContext.Provider
      value={{
        notifications,
        addNotification,
        removeNotification,
        clearAll,
        refreshNotifications,
      }}
    >
      {children}
    </CriticalNotificationsContext.Provider>
  )
}

export function useCriticalNotifications() {
  const context = useContext(CriticalNotificationsContext)
  if (context === undefined) {
    throw new Error("useCriticalNotifications must be used within a CriticalNotificationsProvider")
  }
  return context
}

