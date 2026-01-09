"use client"

import React, { createContext, useContext, useState, useCallback, useEffect } from "react"
import { queueApi } from "@/lib/api"

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
}

const CriticalNotificationsContext = createContext<CriticalNotificationsContextType | undefined>(undefined)

export function CriticalNotificationsProvider({ children }: { children: React.ReactNode }) {
  // Load notifications from localStorage on mount
  const [notifications, setNotifications] = useState<CriticalNotification[]>(() => {
    if (typeof window === 'undefined') return []
    return loadNotificationsFromStorage()
  })

  // Save to localStorage whenever notifications change
  useEffect(() => {
    saveNotificationsToStorage(notifications)
  }, [notifications])

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
              
              const isServed = patientEntries.some(
                (entry: any) => entry.status === 'serving' || entry.status === 'completed'
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

  const addNotification = useCallback((notification: Omit<CriticalNotification, 'id' | 'timestamp'>) => {
    setNotifications((prev) => {
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
      }
      
      return updated
    })
  }, [])

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
              
              // Check if patient is being served or completed
              const isServed = patientEntries.some(
                (entry: any) => entry.status === 'serving' || entry.status === 'completed'
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

