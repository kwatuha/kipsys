"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { AddToQueueForm } from "@/components/add-to-queue-form"
import { queueApi, medicalRecordsApi } from "@/lib/api"
import { toast } from "@/components/ui/use-toast"
import { Search, Plus, Edit, Trash2, MoreHorizontal, Loader2, ArrowRight, Monitor, Users, Receipt, FileText, PlayCircle } from "lucide-react"
import Link from "next/link"
import { ViewBillDialog } from "@/components/view-bill-dialog"
import { PatientEncounterForm } from "@/components/patient-encounter-form"
import { useAuth } from "@/lib/auth/auth-context"
import { format } from "date-fns"

const servicePoints = [
  { value: "triage", label: "Triage" },
  { value: "registration", label: "Registration" },
  { value: "consultation", label: "Consultation" },
  { value: "laboratory", label: "Laboratory" },
  { value: "radiology", label: "Radiology" },
  { value: "pharmacy", label: "Pharmacy" },
  { value: "billing", label: "Billing" },
  { value: "cashier", label: "Cashier" },
]

const statuses = [
  { value: "waiting", label: "Waiting" },
  { value: "called", label: "Called" },
  { value: "serving", label: "Serving" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
]

const priorities = [
  { value: "normal", label: "Normal" },
  { value: "urgent", label: "Urgent" },
  { value: "emergency", label: "Emergency" },
]

export default function QueueManagement() {
  const [isMounted, setIsMounted] = useState(false)
  const [allQueues, setAllQueues] = useState<any[]>([]) // Unfiltered queues for summary stats
  const [queues, setQueues] = useState<any[]>([]) // Filtered queues for display
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [servicePointFilter, setServicePointFilter] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [addQueueOpen, setAddQueueOpen] = useState(false)
  const [editingQueue, setEditingQueue] = useState<any>(null)
  const [deletingQueue, setDeletingQueue] = useState<any>(null)
  const [changingStatus, setChangingStatus] = useState<any>(null)
  const [newStatus, setNewStatus] = useState<string>("")
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [statusLoading, setStatusLoading] = useState(false)
  const [viewingBill, setViewingBill] = useState<any>(null)
  const [encounterFormOpen, setEncounterFormOpen] = useState(false)
  const [selectedPatientForEncounter, setSelectedPatientForEncounter] = useState<{ patientId: string; patientName: string } | null>(null)
  const [encountersToday, setEncountersToday] = useState<Record<string, boolean>>({})
  const [currentDoctorId, setCurrentDoctorId] = useState<string | undefined>()
  const { user } = useAuth()

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Get current doctor ID - only run on client
  useEffect(() => {
    if (!isMounted) return

    if (user?.id) {
      setCurrentDoctorId(user.id)
    } else {
      try {
        if (typeof window !== 'undefined') {
          const token = localStorage.getItem('token') || localStorage.getItem('jwt_token')
          if (token) {
            const payload = JSON.parse(atob(token.split('.')[1]))
            if (payload?.user?.id) {
              setCurrentDoctorId(payload.user.id.toString())
            }
          }
        }
      } catch (e) {
        console.error('Error getting doctor ID:', e)
      }
    }
  }, [user, isMounted])

  // Check for encounters today when consultation queue is filtered
  useEffect(() => {
    if (!isMounted || servicePointFilter !== "consultation" || queues.length === 0) {
      return
    }

    const checkEncounters = async () => {
      // Only check for consultation queues
      const consultationQueues = queues.filter((q: any) => q.servicePoint === "consultation" && q.patientId)
      if (consultationQueues.length === 0) {
        return
      }

      const today = format(new Date(), 'yyyy-MM-dd')
      const encounterChecks: Record<string, boolean> = {}
      
      await Promise.all(
        consultationQueues.map(async (queue: any) => {
          if (!queue.patientId) return
          try {
            const records = await medicalRecordsApi.getAll(
              undefined,
              queue.patientId.toString(),
              undefined,
              undefined,
              undefined,
              1,
              10
            )
            const hasEncounterToday = records.some((record: any) => {
              if (!record.visitDate) return false
              const recordDate = format(new Date(record.visitDate), 'yyyy-MM-dd')
              return recordDate === today
            })
            encounterChecks[queue.patientId.toString()] = hasEncounterToday
          } catch (error) {
            console.error(`Error checking encounters for patient ${queue.patientId}:`, error)
            encounterChecks[queue.patientId.toString()] = false
          }
        })
      )
      
      setEncountersToday(encounterChecks)
    }

    checkEncounters()
  }, [isMounted, servicePointFilter, queues])

  // Load all queues for summary stats
  useEffect(() => {
    if (isMounted) {
      loadAllQueues()
    }
  }, [isMounted])

  // Load filtered queues for display
  useEffect(() => {
    if (isMounted) {
      loadQueues()
    }
  }, [isMounted, servicePointFilter, statusFilter])

  const loadAllQueues = async () => {
    try {
      const data = await queueApi.getAll(undefined, undefined)
      setAllQueues(data || [])
    } catch (error: any) {
      console.error("Error loading all queues:", error)
    }
  }

  const loadQueues = async () => {
    try {
      setLoading(true)
      const data = await queueApi.getAll(servicePointFilter || undefined, statusFilter || undefined)
      setQueues(data || [])
    } catch (error: any) {
      console.error("Error loading queues:", error)
      toast({
        title: "Error loading queues",
        description: error.message || "Failed to load queue entries",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingQueue) return

    try {
      setDeleteLoading(true)
      await queueApi.delete(deletingQueue.queueId.toString())
      toast({
        title: "Queue entry deleted",
        description: "Queue entry has been deleted successfully.",
      })
      setDeletingQueue(null)
      await loadAllQueues() // Update summary stats
      loadQueues() // Update filtered view
    } catch (error: any) {
      console.error("Error deleting queue entry:", error)
      toast({
        title: "Error deleting queue entry",
        description: error.message || "Failed to delete queue entry",
        variant: "destructive",
      })
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleStatusChange = async () => {
    if (!changingStatus || !newStatus) return

    try {
      setStatusLoading(true)
      await queueApi.updateStatus(changingStatus.queueId.toString(), newStatus)
      toast({
        title: "Status updated",
        description: `Queue status has been updated to ${newStatus}.`,
      })
      setChangingStatus(null)
      setNewStatus("")
      await loadAllQueues() // Update summary stats
      loadQueues() // Update filtered view
    } catch (error: any) {
      console.error("Error updating status:", error)
      toast({
        title: "Error updating status",
        description: error.message || "Failed to update queue status",
        variant: "destructive",
      })
    } finally {
      setStatusLoading(false)
    }
  }

  const handleEdit = (queue: any) => {
    setEditingQueue(queue)
    setAddQueueOpen(true)
  }

  const handleStartConsultation = (queue: any) => {
    const patientId = queue.patientId?.toString() || ""
    const patientName = queue.patientFirstName && queue.patientLastName
      ? `${queue.patientFirstName} ${queue.patientLastName}`
      : "Unknown Patient"
    
    console.log('Starting consultation for:', { patientId, patientName })
    setSelectedPatientForEncounter({ patientId, patientName })
    setEncounterFormOpen(true)
  }

  const handleCloseForm = (open: boolean) => {
    setAddQueueOpen(open)
    if (!open) {
      setEditingQueue(null)
    }
  }


  // Filter queues - memoized to avoid hydration issues
  const memoizedFilteredQueues = useMemo(() => {
    if (!isMounted) return []
    return queues.filter((queue) => {
      const matchesSearch =
        !searchQuery ||
        (queue.patientFirstName &&
          queue.patientFirstName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (queue.patientLastName && queue.patientLastName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (queue.patientNumber && queue.patientNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (queue.ticketNumber && queue.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesServicePoint = !servicePointFilter || queue.servicePoint === servicePointFilter
      const matchesStatus = !statusFilter || queue.status === statusFilter

      return matchesSearch && matchesServicePoint && matchesStatus
    })
  }, [isMounted, queues, searchQuery, servicePointFilter, statusFilter])

  // Calculate wait time in minutes - only calculate on client
  const calculateWaitTime = (queue: any) => {
    if (!isMounted || !queue.arrivalTime) return 0
    try {
      const arrival = new Date(queue.arrivalTime)
      const now = new Date()
      const diffMs = now.getTime() - arrival.getTime()
      return Math.max(0, Math.floor(diffMs / 60000)) // Convert to minutes, ensure non-negative
    } catch {
      return 0
    }
  }

  // Get status badge variant
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "waiting":
        return "secondary"
      case "called":
        return "default"
      case "serving":
        return "default"
      case "completed":
        return "outline"
      case "cancelled":
        return "destructive"
      default:
        return "secondary"
    }
  }

  // Get priority badge variant
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "normal":
        return "outline"
      case "urgent":
        return "secondary"
      case "emergency":
        return "destructive"
      default:
        return "outline"
    }
  }

  // Calculate summary statistics from all queues (unfiltered)
  const summaryStats = useMemo(() => {
    const stats: Record<string, { total: number; waiting: number; serving: number }> = {}
    servicePoints.forEach((sp) => {
      const serviceQueues = allQueues.filter((q) => q.servicePoint === sp.value)
      stats[sp.value] = {
        total: serviceQueues.length,
        waiting: serviceQueues.filter((q) => q.status === "waiting").length,
        serving: serviceQueues.filter((q) => q.status === "serving" || q.status === "called").length,
      }
    })
    return stats
  }, [allQueues])

  const totalInQueue = allQueues.filter((q) => q.status === "waiting" || q.status === "called").length
  const emergencyCount = allQueues.filter((q) => q.priority === "emergency" && (q.status === "waiting" || q.status === "called")).length
  const urgentCount = allQueues.filter((q) => q.priority === "urgent" && (q.status === "waiting" || q.status === "called")).length

  if (!isMounted) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Queue Management</h1>
          <p className="text-muted-foreground">Manage patient queues across different service points</p>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Queue Management</h1>
          <p className="text-muted-foreground">Manage patient queues across different service points</p>
        </div>
        <Button onClick={() => setAddQueueOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add to Queue
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Queue Entries</CardTitle>
              <CardDescription>View and manage all queue entries</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4 gap-4">
                <div className="flex gap-2 flex-1">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search patients or ticket numbers..."
                      className="w-full pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Select value={servicePointFilter || "all"} onValueChange={(value) => setServicePointFilter(value === "all" ? null : value)}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Service Point" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Service Points</SelectItem>
                      {servicePoints.map((sp) => (
                        <SelectItem key={sp.value} value={sp.value}>
                          {sp.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter || "all"} onValueChange={(value) => setStatusFilter(value === "all" ? null : value)}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      {statuses.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ticket #</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>Service Point</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Wait Time</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                          <p className="text-sm text-muted-foreground mt-2">Loading queue entries...</p>
                        </TableCell>
                      </TableRow>
                    ) : memoizedFilteredQueues.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No queue entries found
                        </TableCell>
                      </TableRow>
                    ) : (
                      memoizedFilteredQueues.map((queue) => (
                        <TableRow key={queue.queueId}>
                          <TableCell className="font-medium">{queue.ticketNumber}</TableCell>
                          <TableCell>
                            {queue.patientFirstName && queue.patientLastName
                              ? `${queue.patientFirstName} ${queue.patientLastName}`
                              : "Unknown Patient"}
                            {queue.patientNumber && (
                              <div className="text-xs text-muted-foreground">{queue.patientNumber}</div>
                            )}
                          </TableCell>
                          <TableCell>
                            {servicePoints.find((sp) => sp.value === queue.servicePoint)?.label || queue.servicePoint}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getPriorityBadge(queue.priority)}>
                              {queue.priority ? queue.priority.charAt(0).toUpperCase() + queue.priority.slice(1) : "Normal"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusBadge(queue.status)}>
                              {queue.status ? queue.status.charAt(0).toUpperCase() + queue.status.slice(1) : "Waiting"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {queue.status === "waiting" || queue.status === "called" ? (
                              <span className="text-sm">{calculateWaitTime(queue)} min</span>
                            ) : (
                              <span className="text-sm text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {queue.servicePoint === "consultation" && (
                                  <DropdownMenuItem onClick={() => handleStartConsultation(queue)}>
                                    {encountersToday[queue.patientId?.toString() || ""] ? (
                                      <>
                                        <FileText className="mr-2 h-4 w-4" />
                                        Continue Consultation
                                      </>
                                    ) : (
                                      <>
                                        <PlayCircle className="mr-2 h-4 w-4" />
                                        Start Consultation
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                )}
                                {queue.servicePoint === "cashier" && (
                                  <DropdownMenuItem onClick={() => setViewingBill(queue)}>
                                    <Receipt className="mr-2 h-4 w-4" />
                                    View Bill
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => handleEdit(queue)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setChangingStatus(queue)
                                    setNewStatus(queue.status || "waiting")
                                  }}
                                >
                                  <ArrowRight className="mr-2 h-4 w-4" />
                                  Change Status
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => setDeletingQueue(queue)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Queue Summary</CardTitle>
              <CardDescription>Overview of all service points</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  {servicePoints.map((sp) => {
                    const stats = summaryStats[sp.value] || { total: 0, waiting: 0, serving: 0 }
                    const isSelected = servicePointFilter === sp.value
                    return (
                      <button
                        key={sp.value}
                        onClick={() => setServicePointFilter(isSelected ? null : sp.value)}
                        className={`rounded-lg border p-3 text-left transition-colors hover:bg-accent hover:border-primary cursor-pointer ${
                          isSelected ? "border-primary bg-accent" : ""
                        }`}
                      >
                        <div className="text-xs font-medium text-muted-foreground">{sp.label}</div>
                        <div className="mt-1 flex items-center justify-between">
                          <div className="text-2xl font-bold">{stats.total}</div>
                          <div className="text-xs text-muted-foreground">
                            {stats.waiting} waiting, {stats.serving} serving
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>

                <div className="rounded-lg border p-3">
                  <div className="text-xs font-medium">Total Patients in Queue</div>
                  <div className="mt-1 flex items-center justify-between">
                    <div className="text-2xl font-bold">{totalInQueue}</div>
                    <div className="flex items-center gap-1 text-xs">
                      {emergencyCount > 0 && (
                        <>
                          <span className="rounded-full bg-red-500 h-2 w-2"></span>
                          <span className="text-muted-foreground">{emergencyCount} Emergency</span>
                        </>
                      )}
                      {urgentCount > 0 && (
                        <>
                          <span className="rounded-full bg-amber-500 h-2 w-2 ml-2"></span>
                          <span className="text-muted-foreground">{urgentCount} Urgent</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full" variant="outline">
                <Link href="/queue/service">
                  <Users className="mr-2 h-4 w-4" />
                  Service Point Dashboard
                </Link>
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Queue Displays</CardTitle>
              <CardDescription>Access queue displays for different areas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild className="w-full justify-start" variant="outline">
                <Link href="/display">
                  <Monitor className="mr-2 h-4 w-4" />
                  Waiting Area Display
                </Link>
              </Button>
              <Button asChild className="w-full justify-start" variant="outline">
                <Link href="/display/call">
                  <Users className="mr-2 h-4 w-4" />
                  Service Point Display
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <AddToQueueForm
        open={addQueueOpen}
        onOpenChange={handleCloseForm}
        onSuccess={async () => {
          await loadAllQueues() // Update summary stats
          loadQueues() // Update filtered view
          setEditingQueue(null)
        }}
        queueEntry={editingQueue}
      />

      {viewingBill && (
        <ViewBillDialog
          open={!!viewingBill}
          onOpenChange={(open) => !open && setViewingBill(null)}
          patientId={viewingBill.patientId}
          queueNotes={viewingBill.notes}
        />
      )}

      <AlertDialog open={!!deletingQueue} onOpenChange={(open) => !open && setDeletingQueue(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Queue Entry</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this queue entry?
              {deletingQueue && (
                <>
                  <br />
                  <br />
                  <strong>Ticket:</strong> {deletingQueue.ticketNumber}
                  <br />
                  <strong>Patient:</strong>{" "}
                  {deletingQueue.patientFirstName && deletingQueue.patientLastName
                    ? `${deletingQueue.patientFirstName} ${deletingQueue.patientLastName}`
                    : "Unknown"}
                  <br />
                  <strong>Service Point:</strong>{" "}
                  {servicePoints.find((sp) => sp.value === deletingQueue.servicePoint)?.label ||
                    deletingQueue.servicePoint}
                  <br />
                  <br />
                  This action cannot be undone.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteLoading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Patient Encounter Form */}
      {selectedPatientForEncounter && (
        <PatientEncounterForm
          open={encounterFormOpen}
          onOpenChange={(open) => {
            setEncounterFormOpen(open)
            if (!open) {
              setSelectedPatientForEncounter(null)
            }
          }}
          initialPatientId={selectedPatientForEncounter.patientId}
          initialDoctorId={currentDoctorId}
          onSuccess={() => {
            toast({
              title: "Encounter Saved",
              description: `Encounter for ${selectedPatientForEncounter.patientName} has been saved successfully.`,
            })
            // Update encounter status
            setEncountersToday(prev => ({
              ...prev,
              [selectedPatientForEncounter.patientId]: true
            }))
            // Refresh queue data
            loadQueues()
            loadAllQueues()
          }}
        />
      )}

      <Dialog
        open={!!changingStatus}
        onOpenChange={(open) => {
          if (!open) {
            setChangingStatus(null)
            setNewStatus("")
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Queue Status</DialogTitle>
            <DialogDescription>
              Update the status for ticket {changingStatus?.ticketNumber}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Current Status</Label>
              <div className="text-sm text-muted-foreground">
                <Badge variant={getStatusBadge(changingStatus?.status)}>
                  {changingStatus?.status
                    ? changingStatus.status.charAt(0).toUpperCase() + changingStatus.status.slice(1)
                    : "Unknown"}
                </Badge>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-status">New Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger id="new-status">
                  <SelectValue placeholder="Select new status" />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setChangingStatus(null)
                setNewStatus("")
              }}
              disabled={statusLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleStatusChange} disabled={statusLoading || !newStatus || newStatus === changingStatus?.status}>
              {statusLoading ? "Updating..." : "Update Status"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
