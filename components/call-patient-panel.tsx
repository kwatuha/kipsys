"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Bell, CheckCircle, Clock, UserCheck } from "lucide-react"
import {
  getQueueByServicePoint,
  getServicePointName,
  calculateWaitTime,
  getPriorityColor,
  type ServicePoint,
  type QueueEntry,
  type QueueStatus,
} from "@/lib/data/queue-data"
import { toast } from "@/components/ui/use-toast"

interface CallPatientPanelProps {
  servicePoint: ServicePoint
  staffName: string
  counterNumber?: number
}

export function CallPatientPanel({ servicePoint, staffName, counterNumber = 1 }: CallPatientPanelProps) {
  const [currentPatient, setCurrentPatient] = useState<QueueEntry | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // In a real app, this would be fetched from an API
  const queueData = getQueueByServicePoint(servicePoint).filter((entry) => entry.status === "waiting")
  const nextPatient = queueData.length > 0 ? queueData[0] : null

  const handleCallNext = () => {
    if (!nextPatient) {
      toast({
        title: "No patients in queue",
        description: "There are no patients waiting in the queue.",
        variant: "destructive",
      })
      return
    }

    // In a real app, this would be an API call to update the patient's status
    const updatedPatient = { ...nextPatient, status: "in-service" as QueueStatus }
    setCurrentPatient(updatedPatient)

    // Notify that patient has been called
    toast({
      title: "Patient Called",
      description: `${nextPatient.patientName} has been called to ${getServicePointName(servicePoint)}`,
    })

    // Trigger refresh of queue data
    setRefreshTrigger((prev) => prev + 1)
  }

  const handleCompleteService = () => {
    if (!currentPatient) {
      toast({
        title: "No active patient",
        description: "There is no patient currently being served.",
        variant: "destructive",
      })
      return
    }

    // In a real app, this would be an API call to update the patient's status
    toast({
      title: "Service Completed",
      description: `Service for ${currentPatient.patientName} has been completed.`,
    })

    // Clear current patient
    setCurrentPatient(null)

    // Trigger refresh of queue data
    setRefreshTrigger((prev) => prev + 1)
  }

  const handleTransferPatient = (targetServicePoint: ServicePoint) => {
    if (!currentPatient) {
      toast({
        title: "No active patient",
        description: "There is no patient to transfer.",
        variant: "destructive",
      })
      return
    }

    // In a real app, this would be an API call to transfer the patient
    toast({
      title: "Patient Transferred",
      description: `${currentPatient.patientName} has been transferred to ${getServicePointName(targetServicePoint)}.`,
    })

    // Clear current patient
    setCurrentPatient(null)

    // Trigger refresh of queue data
    setRefreshTrigger((prev) => prev + 1)
  }

  // All available service points for transfer
  const transferServicePoints: ServicePoint[] = [
    "triage",
    "consultation",
    "laboratory",
    "radiology",
    "pharmacy",
    "cashier",
    "billing",
  ].filter((point) => point !== servicePoint)

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Service Station</CardTitle>
              <CardDescription>
                {getServicePointName(servicePoint)} - Counter {counterNumber}
              </CardDescription>
            </div>
            <Badge variant="outline">{staffName}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {currentPatient ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium">Currently Serving</p>
                  <h3 className="text-2xl font-bold mt-1">{currentPatient.patientName}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary">#{currentPatient.queueNumber}</Badge>
                    <Badge variant="outline" className={getPriorityColor(currentPatient.priority)}>
                      {currentPatient.priority}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{calculateWaitTime(currentPatient)} min wait</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleCompleteService} className="flex-1" size="sm">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Complete Service
                </Button>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center">
              <UserCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No Patient Being Served</h3>
              <p className="text-sm text-muted-foreground mt-1">Call the next patient in queue</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="border-t pt-4">
          <Button onClick={handleCallNext} disabled={!nextPatient || currentPatient !== null} className="w-full">
            <Bell className="h-4 w-4 mr-2" />
            Call Next Patient
          </Button>
        </CardFooter>
      </Card>

      {currentPatient && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Transfer Patient</CardTitle>
            <CardDescription>Send patient to another service point</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {transferServicePoints.map((point) => (
                <Button key={point} variant="outline" size="sm" onClick={() => handleTransferPatient(point)}>
                  {getServicePointName(point)}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Next in Queue</CardTitle>
          <CardDescription>Patients waiting for service</CardDescription>
        </CardHeader>
        <CardContent>
          {queueData.length > 0 ? (
            <div className="space-y-3">
              {queueData.slice(0, 3).map((entry, index) => (
                <div key={entry.id} className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Badge variant={index === 0 ? "default" : "outline"}>#{entry.queueNumber}</Badge>
                    <span className="font-medium">{entry.patientName}</span>
                    <Badge variant="outline" className={getPriorityColor(entry.priority)}>
                      {entry.priority}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {calculateWaitTime(entry)} min
                  </div>
                </div>
              ))}

              {queueData.length > 3 && (
                <p className="text-xs text-muted-foreground text-center pt-2 border-t">
                  +{queueData.length - 3} more patients in queue
                </p>
              )}
            </div>
          ) : (
            <div className="py-4 text-center text-sm text-muted-foreground">No patients waiting in queue</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
