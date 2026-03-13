"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Search,
  Package,
  CheckCircle2,
  Loader2,
  Eye,
  History,
  User,
  Calendar,
  FileText,
  Pill,
  AlertCircle
} from "lucide-react"
import { pharmacyApi } from "@/lib/api"
import { useAuth } from "@/lib/auth/auth-context"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

export function NursePickup() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [readyPrescriptions, setReadyPrescriptions] = useState<any[]>([])
  const [pickupHistory, setPickupHistory] = useState<any[]>([])
  const [selectedPrescriptions, setSelectedPrescriptions] = useState<Set<string>>(new Set())
  const [selectedItems, setSelectedItems] = useState<Map<string, Set<string>>>(new Map())
  const [pickupNotes, setPickupNotes] = useState<Map<string, string>>(new Map())
  const [creatingPickup, setCreatingPickup] = useState(false)
  const [viewPickupDialogOpen, setViewPickupDialogOpen] = useState(false)
  const [selectedPickup, setSelectedPickup] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("ready")

  useEffect(() => {
    loadReadyPrescriptions()
    loadPickupHistory()
  }, [])

  const loadReadyPrescriptions = async () => {
    try {
      setLoading(true)
      const data = await pharmacyApi.getPrescriptionsReadyForPickup()
      setReadyPrescriptions(data || [])
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load prescriptions ready for pickup",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadPickupHistory = async () => {
    try {
      // Load all pickups (not filtered by nurse) so we can see all pickup history
      // If you want to filter by current nurse, uncomment the nurseId line
      const data = await pharmacyApi.getNursePickups({
        // nurseId: user?.id?.toString() || user?.userId?.toString(),
        limit: 50
      })
      setPickupHistory(data?.pickups || [])
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load pickup history",
        variant: "destructive",
      })
    }
  }

  const handlePrescriptionToggle = (prescriptionId: string) => {
    const newSelected = new Set(selectedPrescriptions)
    if (newSelected.has(prescriptionId)) {
      newSelected.delete(prescriptionId)
      // Remove all items for this prescription
      const newSelectedItems = new Map(selectedItems)
      newSelectedItems.delete(prescriptionId)
      setSelectedItems(newSelectedItems)
    } else {
      newSelected.add(prescriptionId)
      // Select all items for this prescription
      const prescription = readyPrescriptions.find(p => p.prescriptionId === prescriptionId)
      if (prescription?.items) {
        const newSelectedItems = new Map(selectedItems)
        const itemIds = new Set(prescription.items.map((item: any) => item.itemId.toString()))
        newSelectedItems.set(prescriptionId, itemIds)
        setSelectedItems(newSelectedItems)
      }
    }
    setSelectedPrescriptions(newSelected)
  }

  const handleItemToggle = (prescriptionId: string, itemId: string) => {
    const newSelectedItems = new Map(selectedItems)
    const itemSet = newSelectedItems.get(prescriptionId) || new Set<string>()

    if (itemSet.has(itemId)) {
      itemSet.delete(itemId)
    } else {
      itemSet.add(itemId)
    }

    if (itemSet.size === 0) {
      newSelectedItems.delete(prescriptionId)
      const newSelected = new Set(selectedPrescriptions)
      newSelected.delete(prescriptionId)
      setSelectedPrescriptions(newSelected)
    } else {
      newSelectedItems.set(prescriptionId, itemSet)
      if (!selectedPrescriptions.has(prescriptionId)) {
        const newSelected = new Set(selectedPrescriptions)
        newSelected.add(prescriptionId)
        setSelectedPrescriptions(newSelected)
      }
    }

    setSelectedItems(newSelectedItems)
  }

  const handleCreatePickup = async () => {
    if (selectedPrescriptions.size === 0) {
      toast({
        title: "Error",
        description: "Please select at least one prescription to pick up",
        variant: "destructive",
      })
      return
    }

    try {
      setCreatingPickup(true)

      const pickups = Array.from(selectedPrescriptions).map(prescriptionId => {
        const prescription = readyPrescriptions.find(p => p.prescriptionId.toString() === prescriptionId)
        const itemSet = selectedItems.get(prescriptionId) || new Set<string>()

        return {
          prescriptionId: prescriptionId,
          admissionId: prescription?.admissionId?.toString(),
          items: prescription?.items
            .filter((item: any) => itemSet.has(item.itemId.toString()))
            .map((item: any) => ({
              prescriptionItemId: item.itemId.toString(),
              dispensationId: item.dispensationId?.toString(),
              quantityPickedUp: item.quantityDispensed || item.quantity || 1,
              notes: "",
            })) || [],
          notes: pickupNotes.get(prescriptionId) || "",
        }
      }).filter(pickup => pickup.items.length > 0)

      if (pickups.length === 0) {
        toast({
          title: "Error",
          description: "Please select at least one item to pick up",
          variant: "destructive",
        })
        setCreatingPickup(false)
        return
      }

      await pharmacyApi.createNursePickup({ pickups })

      toast({
        title: "Success",
        description: `Successfully recorded pickup for ${pickups.length} prescription(s)`,
      })

      // Reset selections
      setSelectedPrescriptions(new Set())
      setSelectedItems(new Map())
      setPickupNotes(new Map())

      // Reload data
      await loadReadyPrescriptions()
      await loadPickupHistory()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create pickup record",
        variant: "destructive",
      })
    } finally {
      setCreatingPickup(false)
    }
  }

  const handleViewPickup = async (pickupId: string) => {
    try {
      const pickup = await pharmacyApi.getNursePickup(pickupId)
      setSelectedPickup(pickup)
      setViewPickupDialogOpen(true)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load pickup details",
        variant: "destructive",
      })
    }
  }

  const filteredReadyPrescriptions = readyPrescriptions.filter(p => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      p.prescriptionNumber?.toLowerCase().includes(query) ||
      p.patientFirstName?.toLowerCase().includes(query) ||
      p.patientLastName?.toLowerCase().includes(query) ||
      p.patientNumber?.toLowerCase().includes(query) ||
      p.admissionNumber?.toLowerCase().includes(query) ||
      p.medicationNames?.toLowerCase().includes(query)
    )
  })

  const filteredPickupHistory = pickupHistory.filter(p => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      p.prescriptionNumber?.toLowerCase().includes(query) ||
      p.patientFirstName?.toLowerCase().includes(query) ||
      p.patientLastName?.toLowerCase().includes(query) ||
      p.patientNumber?.toLowerCase().includes(query) ||
      p.admissionNumber?.toLowerCase().includes(query)
    )
  })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Nurse Drug Pickup</h2>
          <p className="text-muted-foreground">Pick up drugs for admitted patients</p>
        </div>
        {selectedPrescriptions.size > 0 && (
          <Button
            onClick={handleCreatePickup}
            disabled={creatingPickup}
            className="gap-2"
          >
            {creatingPickup ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Recording Pickup...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Record Pickup ({selectedPrescriptions.size})
              </>
            )}
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="ready">
            Ready for Pickup ({readyPrescriptions.length})
          </TabsTrigger>
          <TabsTrigger value="history">
            Pickup History ({pickupHistory.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ready" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Prescriptions Ready for Pickup</CardTitle>
                  <CardDescription>
                    Select prescriptions to record pickup for admitted patients
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search prescriptions..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 w-[300px]"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredReadyPrescriptions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No prescriptions ready for pickup</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredReadyPrescriptions.map((prescription) => {
                    const isSelected = selectedPrescriptions.has(prescription.prescriptionId.toString())
                    const selectedItemSet = selectedItems.get(prescription.prescriptionId.toString()) || new Set<string>()

                    return (
                      <Card key={prescription.prescriptionId} className={isSelected ? "border-primary" : ""}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => handlePrescriptionToggle(prescription.prescriptionId.toString())}
                              className="mt-1"
                            />
                            <div className="flex-1 space-y-3">
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-semibold">{prescription.prescriptionNumber}</span>
                                    <Badge variant="outline">{prescription.pendingPickupItems} items</Badge>
                                  </div>
                                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                      <User className="h-3 w-3" />
                                      {prescription.patientFirstName} {prescription.patientLastName}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      {format(new Date(prescription.prescriptionDate), "PP")}
                                    </div>
                                    {prescription.admissionNumber && (
                                      <Badge variant="secondary">Admission: {prescription.admissionNumber}</Badge>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right text-sm">
                                  <div className="text-muted-foreground">Doctor</div>
                                  <div>{prescription.doctorFirstName} {prescription.doctorLastName}</div>
                                </div>
                              </div>

                              {isSelected && prescription.items && prescription.items.length > 0 && (
                                <div className="mt-4 space-y-2 border-t pt-3">
                                  <Label className="text-sm font-medium">Select Items to Pick Up:</Label>
                                  <div className="space-y-2">
                                    {prescription.items.map((item: any) => {
                                      const itemSelected = selectedItemSet.has(item.itemId.toString())
                                      return (
                                        <div
                                          key={item.itemId}
                                          className={`flex items-center gap-3 p-2 rounded-md border ${
                                            itemSelected ? "bg-primary/5 border-primary" : ""
                                          }`}
                                        >
                                          <Checkbox
                                            checked={itemSelected}
                                            onCheckedChange={() => handleItemToggle(prescription.prescriptionId.toString(), item.itemId.toString())}
                                          />
                                          <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                              <Pill className="h-4 w-4 text-muted-foreground" />
                                              <span className="font-medium">{item.medicationName}</span>
                                            </div>
                                            <div className="text-sm text-muted-foreground ml-6">
                                              {item.dosage} • {item.frequency} • {item.duration}
                                              {item.batchNumber && ` • Batch: ${item.batchNumber}`}
                                              {item.quantityDispensed && ` • Qty: ${item.quantityDispensed}`}
                                            </div>
                                          </div>
                                        </div>
                                      )
                                    })}
                                  </div>
                                  <div className="mt-2">
                                    <Label htmlFor={`notes-${prescription.prescriptionId}`} className="text-sm">
                                      Notes (optional)
                                    </Label>
                                    <Textarea
                                      id={`notes-${prescription.prescriptionId}`}
                                      placeholder="Add notes for this pickup..."
                                      value={pickupNotes.get(prescription.prescriptionId.toString()) || ""}
                                      onChange={(e) => {
                                        const newNotes = new Map(pickupNotes)
                                        newNotes.set(prescription.prescriptionId.toString(), e.target.value)
                                        setPickupNotes(newNotes)
                                      }}
                                      rows={2}
                                      className="mt-1"
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Pickup History</CardTitle>
                  <CardDescription>View history of drug pickups</CardDescription>
                </div>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search history..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 w-[300px]"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredPickupHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No pickup history found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pickup Date</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>Prescription</TableHead>
                      <TableHead>Admission</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Nurse</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPickupHistory.map((pickup) => (
                      <TableRow key={pickup.pickupId}>
                        <TableCell>
                          {format(new Date(pickup.pickupDate), "PPp")}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {pickup.patientFirstName} {pickup.patientLastName}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {pickup.patientNumber}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{pickup.prescriptionNumber}</div>
                            <div className="text-sm text-muted-foreground">
                              {format(new Date(pickup.prescriptionDate), "PP")}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {pickup.admissionNumber ? (
                            <Badge variant="secondary">{pickup.admissionNumber}</Badge>
                          ) : (
                            <span className="text-muted-foreground">N/A</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{pickup.itemCount} items</Badge>
                        </TableCell>
                        <TableCell>
                          {pickup.nurseFirstName} {pickup.nurseLastName}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewPickup(pickup.pickupId.toString())}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* View Pickup Dialog */}
      <Dialog open={viewPickupDialogOpen} onOpenChange={setViewPickupDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Pickup Details</DialogTitle>
            <DialogDescription>
              View detailed information about this drug pickup
            </DialogDescription>
          </DialogHeader>
          {selectedPickup && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-semibold">Pickup Date</Label>
                  <p>{format(new Date(selectedPickup.pickupDate), "PPp")}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold">Status</Label>
                  <p>
                    <Badge variant={selectedPickup.status === 'picked_up' ? 'default' : 'outline'}>
                      {selectedPickup.status}
                    </Badge>
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-semibold">Patient</Label>
                  <p>
                    {selectedPickup.patientFirstName} {selectedPickup.patientLastName}
                    <span className="text-muted-foreground ml-2">({selectedPickup.patientNumber})</span>
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-semibold">Prescription</Label>
                  <p>{selectedPickup.prescriptionNumber}</p>
                </div>
                {selectedPickup.admissionNumber && (
                  <div>
                    <Label className="text-sm font-semibold">Admission</Label>
                    <p><Badge variant="secondary">{selectedPickup.admissionNumber}</Badge></p>
                  </div>
                )}
                <div>
                  <Label className="text-sm font-semibold">Picked Up By</Label>
                  <p>
                    {selectedPickup.nurseFirstName} {selectedPickup.nurseLastName}
                  </p>
                </div>
              </div>

              {selectedPickup.items && selectedPickup.items.length > 0 && (
                <div>
                  <Label className="text-sm font-semibold mb-2 block">Items Picked Up</Label>
                  <div className="space-y-2">
                    {selectedPickup.items.map((item: any, idx: number) => (
                      <Card key={idx}>
                        <CardContent className="p-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium">{item.medicationName}</div>
                              <div className="text-sm text-muted-foreground">
                                {item.dosage} • {item.frequency} • {item.duration}
                              </div>
                              {item.batchNumber && (
                                <div className="text-sm text-muted-foreground mt-1">
                                  Batch: {item.batchNumber}
                                  {item.expiryDate && ` • Expires: ${format(new Date(item.expiryDate), "PP")}`}
                                </div>
                              )}
                            </div>
                            <Badge variant="outline">
                              Qty: {item.quantityPickedUp}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {selectedPickup.notes && (
                <div>
                  <Label className="text-sm font-semibold mb-2 block">Notes</Label>
                  <p className="text-sm p-3 bg-muted rounded-md">{selectedPickup.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
