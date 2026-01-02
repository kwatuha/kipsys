"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Bell } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface LastCalledProps {
  className?: string
}

export function LastCalled({ className = "" }: LastCalledProps) {
  const [lastCalled, setLastCalled] = useState<{ number: number; servicePoint: string } | null>(null)
  const [visible, setVisible] = useState(false)

  // Simulate a patient being called
  useEffect(() => {
    const interval = setInterval(() => {
      // This would be replaced with real-time updates in production
      const mockServicePoints = ["Triage", "Consultation", "Pharmacy", "Laboratory"]
      const randomServicePoint = mockServicePoints[Math.floor(Math.random() * mockServicePoints.length)]
      const randomNumber = Math.floor(Math.random() * 100) + 1

      setLastCalled({ number: randomNumber, servicePoint: randomServicePoint })
      setVisible(true)

      // Hide after 10 seconds
      setTimeout(() => {
        setVisible(false)
      }, 10000)
    }, 30000) // Simulate a call every 30 seconds

    return () => clearInterval(interval)
  }, [])

  if (!lastCalled) return null

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={className}
        >
          <Card className="border-2 border-accent bg-accent/10">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex-shrink-0">
                <Bell className="h-6 w-6 text-accent animate-pulse" />
              </div>
              <div className="flex-grow">
                <div className="text-sm font-medium">Now Calling</div>
                <div className="text-xl font-bold">
                  Patient #{lastCalled.number} to {lastCalled.servicePoint}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
