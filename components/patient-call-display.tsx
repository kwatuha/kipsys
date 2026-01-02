"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Bell } from "lucide-react"
import { getServicePointName, type ServicePoint } from "@/lib/data/queue-data"

interface PatientCallDisplayProps {
  servicePoint: ServicePoint
  counterNumber: number
}

export function PatientCallDisplay({ servicePoint, counterNumber }: PatientCallDisplayProps) {
  // In a real app, this would be fetched from an API and updated via websockets
  const [calledPatient, setCalledPatient] = useState<{
    queueNumber: number
    name: string
    timestamp: Date
  } | null>(null)

  const [isNewCall, setIsNewCall] = useState(false)

  // Simulate a new patient being called every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const queueNumber = Math.floor(Math.random() * 20) + 1
      setCalledPatient({
        queueNumber,
        name: `Patient ${queueNumber}`,
        timestamp: new Date(),
      })
      setIsNewCall(true)

      // Reset the new call highlight after 5 seconds
      setTimeout(() => {
        setIsNewCall(false)
      }, 5000)
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  if (!calledPatient) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between">
            <span>{getServicePointName(servicePoint)}</span>
            <Badge variant="outline">Counter {counterNumber}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">Waiting for next patient call</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={isNewCall ? "animate-pulse border-primary" : ""}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <span>{getServicePointName(servicePoint)}</span>
          <Badge variant="outline">Counter {counterNumber}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="py-6">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Bell className={`h-6 w-6 ${isNewCall ? "text-primary animate-bounce" : "text-muted-foreground"}`} />
            <h3 className="text-lg font-medium">Now Calling</h3>
          </div>

          <div className="bg-primary/10 rounded-lg py-6 px-4">
            <div className="text-6xl font-bold mb-2">#{calledPatient.queueNumber}</div>
            <p className="text-lg">{calledPatient.name}</p>
            <p className="text-xs text-muted-foreground mt-2">
              Called at {calledPatient.timestamp.toLocaleTimeString()}
            </p>
          </div>

          <p className="mt-4 text-sm text-muted-foreground">Please proceed to Counter {counterNumber}</p>
        </div>
      </CardContent>
    </Card>
  )
}
