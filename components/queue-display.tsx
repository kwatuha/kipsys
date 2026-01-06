"use client"

import { useState, useMemo, Suspense, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { MoreHorizontal, FileText, PlayCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  getQueueByServicePoint,
  getServicePointName,
  getPriorityColor,
  calculateWaitTime,
  type ServicePoint,
} from "@/lib/data/queue-data"
import { QueueTabsIndicator } from "@/components/queue-tabs-indicator"
import { useScreenSize } from "@/hooks/use-screen-size"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { queueApi, medicalRecordsApi } from "@/lib/api"
import { PatientEncounterForm } from "@/components/patient-encounter-form"
import { DispenseMedicationDialog } from "@/components/dispense-medication-dialog"
import { useAuth } from "@/lib/auth/auth-context"
import { format } from "date-fns"

interface QueueDisplayProps {
  initialServicePoint?: ServicePoint
}

export function QueueDisplay({ initialServicePoint = "triage" }: QueueDisplayProps) {
  // Define service points with triage first
  const allServicePoints: ServicePoint[] = [
    "triage",
    "registration",
    "consultation",
    "laboratory",
    "radiology",
    "pharmacy",
    "billing",
    "cashier",
  ]

  const [selectedTab, setSelectedTab] = useState<ServicePoint>(initialServicePoint)
  const screenSize = useScreenSize()

  // Determine how many tabs to show based on screen size
  const visibleTabCount = useMemo(() => {
    switch (screenSize) {
      case "xs":
        return 2
      case "sm":
        return 3
      case "md":
        return 4
      case "lg":
        return 6
      case "xl":
      case "2xl":
        return 8
      default:
        return 4
    }
  }, [screenSize])

  // Determine which tabs to show
  // Priority: 1. Selected tab, 2. Common tabs, 3. Others in order
  const visibleTabs = useMemo(() => {
    // Always include the selected tab
    // Make sure triage is the first priority tab
    const priorityTabs: ServicePoint[] = ["triage", "consultation", "pharmacy"]

    // Start with the selected tab if it's not already in priority tabs
    const result: ServicePoint[] = []
    if (!priorityTabs.includes(selectedTab)) {
      result.push(selectedTab)
    }

    // Add priority tabs
    for (const tab of priorityTabs) {
      if (result.length < visibleTabCount) {
        if (!result.includes(tab)) {
          result.push(tab)
        }
      }
    }

    // Fill remaining slots with other tabs
    for (const tab of allServicePoints) {
      if (result.length < visibleTabCount) {
        if (!result.includes(tab)) {
          result.push(tab)
        }
      }
    }

    return result
  }, [selectedTab, visibleTabCount, allServicePoints])

  // Determine which tabs to show in the "More" dropdown
  const dropdownTabs = useMemo(() => {
    return allServicePoints.filter((tab) => !visibleTabs.includes(tab))
  }, [allServicePoints, visibleTabs])

  // Check if we need to show the "More" dropdown
  const showMoreDropdown = dropdownTabs.length > 0

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle>Patient Queue</CardTitle>
        <CardDescription>Current queue status for each service point</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs
          defaultValue="triage"
          value={selectedTab}
          onValueChange={(value) => setSelectedTab(value as ServicePoint)}
          className="w-full"
        >
          <div className="relative mb-4">
            <ScrollArea className="w-full whitespace-nowrap">
              {visibleTabCount < allServicePoints.length && <QueueTabsIndicator />}
              <TabsList className="inline-flex h-auto w-full justify-start rounded-none border-b bg-transparent p-0">
                {visibleTabs.map((point) => {
                  const pointData = getQueueByServicePoint(point)
                  return (
                    <TabsTrigger
                      key={point}
                      value={point}
                      className="relative h-10 rounded-none border-b-2 border-b-transparent bg-transparent px-3 pb-3 pt-2 font-medium text-muted-foreground shadow-none transition-none data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
                    >
                      {getServicePointName(point)}
                      {pointData.length > 0 && (
                        <Badge variant="secondary" className="ml-1">
                          {pointData.length}
                        </Badge>
                      )}
                    </TabsTrigger>
                  )
                })}

                {showMoreDropdown && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="relative h-10 rounded-none border-b-2 border-b-transparent bg-transparent px-3 pb-3 pt-2 font-medium text-muted-foreground shadow-none transition-none hover:text-foreground focus:outline-none">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">More tabs</span>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {dropdownTabs.map((point) => {
                        const pointData = getQueueByServicePoint(point)
                        return (
                          <DropdownMenuItem
                            key={point}
                            onClick={() => setSelectedTab(point)}
                            className="flex items-center justify-between"
                          >
                            {getServicePointName(point)}
                            {pointData.length > 0 && (
                              <Badge variant="secondary" className="ml-2">
                                {pointData.length}
                              </Badge>
                            )}
                          </DropdownMenuItem>
                        )
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </TabsList>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>

          <TabsContent value={selectedTab} className="mt-6">
            <Suspense fallback={<div className="h-64 animate-pulse bg-muted rounded-md" />}>
              <QueueContent servicePoint={selectedTab} />
            </Suspense>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

// Separate the content to allow for better code splitting
function QueueContent({ servicePoint }: { servicePoint: ServicePoint }) {
  const [queueData, setQueueData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [encounterFormOpen, setEncounterFormOpen] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState<{ patientId: string; patientName: string } | null>(null)
  const [encountersToday, setEncountersToday] = useState<Record<string, boolean>>({})
  const [currentDoctorId, setCurrentDoctorId] = useState<string | undefined>()
  const [dispenseDialogOpen, setDispenseDialogOpen] = useState(false)
  const [selectedPatientForDispense, setSelectedPatientForDispense] = useState<{ patientId: number; patientName: string } | null>(null)
  const { user } = useAuth()
  const isConsultation = servicePoint === "consultation"
  const isPharmacy = servicePoint === "pharmacy"

  // Get current doctor ID
  useEffect(() => {
    if (user?.id) {
      setCurrentDoctorId(user.id)
    } else {
      try {
        const token = localStorage.getItem('token') || localStorage.getItem('jwt_token')
        if (token) {
          const payload = JSON.parse(atob(token.split('.')[1]))
          if (payload?.user?.id) {
            setCurrentDoctorId(payload.user.id.toString())
          }
        }
      } catch (e) {
        console.error('Error getting doctor ID:', e)
      }
    }
  }, [user])

  // Fetch queue data from API
  const loadQueueData = async () => {
      try {
        setLoading(true)
        const data = await queueApi.getAll(servicePoint, undefined)
        
        // Map API response to display format
        const mappedData = data.map((entry: any) => ({
          id: entry.queueId?.toString() || entry.id?.toString() || "",
          patientId: entry.patientId?.toString() || "",
          patientName: entry.patientFirstName && entry.patientLastName
            ? `${entry.patientFirstName} ${entry.patientLastName}`
            : entry.patientName || "Unknown Patient",
          servicePoint: entry.servicePoint || servicePoint,
          ticketNumber: entry.ticketNumber || "",
          status: entry.status || "waiting",
          priority: entry.priority || "normal",
          estimatedWaitTime: entry.estimatedWaitTime,
          arrivalTime: entry.arrivalTime || new Date().toISOString(),
        }))
        
        setQueueData(mappedData)

        // Check for encounters today for each patient
        if (servicePoint === "consultation") {
          const today = format(new Date(), 'yyyy-MM-dd')
          const encounterChecks: Record<string, boolean> = {}
          
          await Promise.all(
            mappedData.map(async (entry: any) => {
              try {
                const records = await medicalRecordsApi.getAll(
                  undefined,
                  entry.patientId,
                  undefined,
                  undefined,
                  undefined,
                  1,
                  10
                )
                const hasEncounterToday = records.some((record: any) => {
                  const recordDate = record.visitDate ? format(new Date(record.visitDate), 'yyyy-MM-dd') : null
                  return recordDate === today
                })
                encounterChecks[entry.patientId] = hasEncounterToday
              } catch (error) {
                console.error(`Error checking encounters for patient ${entry.patientId}:`, error)
                encounterChecks[entry.patientId] = false
              }
            })
          )
          
          setEncountersToday(encounterChecks)
        }
      } catch (error) {
        console.error('Error loading queue data:', error)
        // Fallback to mock data
        const mockData = getQueueByServicePoint(servicePoint)
        setQueueData(mockData)
      } finally {
        setLoading(false)
      }
    }

  useEffect(() => {
    loadQueueData()
  }, [servicePoint])

  const handleStartConsultation = (patientId: string, patientName: string) => {
    console.log('handleStartConsultation called:', { patientId, patientName, currentDoctorId })
    setSelectedPatient({ patientId, patientName })
    setEncounterFormOpen(true)
    console.log('Encounter form state set to open')
  }

  return (
    <>
      <div className="rounded-md border">
        {isConsultation ? (
          <>
            <div className="grid grid-cols-12 bg-muted/50 p-3 text-sm font-medium">
              <div className="col-span-1">#</div>
              <div className="col-span-3">Patient</div>
              <div className="col-span-2">Priority</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2">Wait Time</div>
              <div className="col-span-2">Action</div>
            </div>
            {loading ? (
              <div className="p-6 text-center text-muted-foreground">Loading queue data...</div>
            ) : queueData.length > 0 ? (
              <div className="divide-y">
                {queueData.map((entry) => {
                  const hasEncounterToday = encountersToday[entry.patientId] || false
                  return (
                    <div key={entry.id} className="grid grid-cols-12 p-3 text-sm items-center">
                      <div className="col-span-1">{entry.ticketNumber || entry.queueNumber}</div>
                      <div className="col-span-3 font-medium">{entry.patientName}</div>
                      <div className="col-span-2">
                        <Badge variant="outline" className={`${getPriorityColor(entry.priority)}`}>
                          {entry.priority}
                        </Badge>
                      </div>
                      <div className="col-span-2">
                        <Badge variant={entry.status === "waiting" || entry.status === "called" ? "secondary" : "default"}>
                          {entry.status === "waiting" ? "Waiting" : entry.status === "called" ? "Called" : "In Service"}
                        </Badge>
                      </div>
                      <div className="col-span-2 text-muted-foreground">
                        {calculateWaitTime(entry)} min
                        {entry.estimatedWaitTime && entry.status === "waiting" && (
                          <span> (Est. {entry.estimatedWaitTime} min)</span>
                        )}
                      </div>
                      <div className="col-span-2">
                        <Button
                          variant={hasEncounterToday ? "outline" : "default"}
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            console.log('Button clicked for patient:', entry.patientId, entry.patientName)
                            handleStartConsultation(entry.patientId, entry.patientName)
                          }}
                          className="w-full"
                        >
                          {hasEncounterToday ? (
                            <>
                              <FileText className="h-3 w-3 mr-1" />
                              Continue Consultation
                            </>
                          ) : (
                            <>
                              <PlayCircle className="h-3 w-3 mr-1" />
                              Start Consultation
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="p-6 text-center text-muted-foreground">
                No patients in queue for {getServicePointName(servicePoint)}
              </div>
            )}
          </>
        ) : isPharmacy ? (
          <>
            <div className="grid grid-cols-12 bg-muted/50 p-3 text-sm font-medium">
              <div className="col-span-1">#</div>
              <div className="col-span-3">Patient</div>
              <div className="col-span-2">Priority</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2">Wait Time</div>
              <div className="col-span-2">Action</div>
            </div>
            {loading ? (
              <div className="p-6 text-center text-muted-foreground">Loading queue data...</div>
            ) : queueData.length > 0 ? (
              <div className="divide-y">
                {queueData.map((entry) => (
                  <div key={entry.id} className="grid grid-cols-12 p-3 text-sm items-center">
                    <div className="col-span-1">{entry.ticketNumber || entry.queueNumber}</div>
                    <div className="col-span-3 font-medium">{entry.patientName}</div>
                    <div className="col-span-2">
                      <Badge variant="outline" className={`${getPriorityColor(entry.priority)}`}>
                        {entry.priority}
                      </Badge>
                    </div>
                    <div className="col-span-2">
                      <Badge variant={entry.status === "waiting" || entry.status === "called" ? "secondary" : "default"}>
                        {entry.status === "waiting" ? "Waiting" : entry.status === "called" ? "Called" : "In Service"}
                      </Badge>
                    </div>
                    <div className="col-span-2 text-muted-foreground">
                      {calculateWaitTime(entry)} min
                      {entry.estimatedWaitTime && entry.status === "waiting" && (
                        <span> (Est. {entry.estimatedWaitTime} min)</span>
                      )}
                    </div>
                    <div className="col-span-2">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => {
                          setSelectedPatientForDispense({ patientId: parseInt(entry.patientId), patientName: entry.patientName })
                          setDispenseDialogOpen(true)
                        }}
                        className="w-full"
                      >
                        <Pill className="h-3 w-3 mr-1" />
                        Dispense Medication
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-muted-foreground">
                No patients in queue for {getServicePointName(servicePoint)}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="grid grid-cols-12 bg-muted/50 p-3 text-sm font-medium">
              <div className="col-span-1">#</div>
              <div className="col-span-4">Patient</div>
              <div className="col-span-2">Priority</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-3">Wait Time</div>
            </div>
            {loading ? (
              <div className="p-6 text-center text-muted-foreground">Loading queue data...</div>
            ) : queueData.length > 0 ? (
              <div className="divide-y">
                {queueData.map((entry) => (
                  <div key={entry.id} className="grid grid-cols-12 p-3 text-sm">
                    <div className="col-span-1">{entry.ticketNumber || entry.queueNumber}</div>
                    <div className="col-span-4 font-medium">{entry.patientName}</div>
                    <div className="col-span-2">
                      <Badge variant="outline" className={`${getPriorityColor(entry.priority)}`}>
                        {entry.priority}
                      </Badge>
                    </div>
                    <div className="col-span-2">
                      <Badge variant={entry.status === "waiting" || entry.status === "called" ? "secondary" : "default"}>
                        {entry.status === "waiting" ? "Waiting" : entry.status === "called" ? "Called" : "In Service"}
                      </Badge>
                    </div>
                    <div className="col-span-3 text-muted-foreground">
                      {calculateWaitTime(entry)} min
                      {entry.estimatedWaitTime && entry.status === "waiting" && (
                        <span> (Est. {entry.estimatedWaitTime} min)</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-muted-foreground">
                No patients in queue for {getServicePointName(servicePoint)}
              </div>
            )}
          </>
        )}
      </div>

      {/* Patient Encounter Form for consultation */}
      {isConsultation && selectedPatient && (
        <>
          {process.env.NODE_ENV === 'development' && (
            <div className="text-xs text-muted-foreground p-2 bg-muted rounded mb-2">
              Debug: Form should render. Patient: {selectedPatient.patientId}, Open: {encounterFormOpen ? 'Yes' : 'No'}, Doctor: {currentDoctorId || 'None'}
            </div>
          )}
          <PatientEncounterForm
            open={encounterFormOpen}
            onOpenChange={(open) => {
              console.log('Encounter form onOpenChange:', open, 'Patient:', selectedPatient?.patientId)
              setEncounterFormOpen(open)
              if (!open) {
                setSelectedPatient(null)
              }
            }}
            initialPatientId={selectedPatient.patientId}
            initialDoctorId={currentDoctorId}
            onSuccess={() => {
              console.log('Encounter saved successfully')
              // Refresh queue data to update encounter status
              setEncountersToday(prev => ({
                ...prev,
                [selectedPatient.patientId]: true
              }))
            }}
          />
        </>
      )}

      {/* Dispense Medication Dialog for pharmacy */}
      {isPharmacy && selectedPatientForDispense && (
        <DispenseMedicationDialog
          open={dispenseDialogOpen}
          onOpenChange={(open) => {
            setDispenseDialogOpen(open)
            if (!open) {
              setSelectedPatientForDispense(null)
            }
          }}
          patientId={selectedPatientForDispense.patientId}
          onDispensed={() => {
            loadQueueData()
          }}
        />
      )}
    </>
  )
}
