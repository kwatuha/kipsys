"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Search, FileText, Package, Plus, Edit, Loader2, MoreVertical, Eye, CheckCircle, XCircle, Trash2 } from "lucide-react"
import { AddPrescriptionForm } from "@/components/add-prescription-form"
import { MedicationForm } from "@/components/medication-form"
import { DrugInventoryForm } from "@/components/drug-inventory-form"
import { pharmacyApi } from "@/lib/api"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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

interface Medication {
  medicationId: number
  medicationCode?: string
  medicationName?: string
  name?: string
  genericName?: string
  dosageForm?: string
  strength?: string
  unit?: string
  category?: string
  manufacturer?: string
  description?: string
}

interface Prescription {
  prescriptionId: number
  prescriptionNumber: string
  patientId: number
  firstName?: string
  lastName?: string
  patientNumber?: string
  doctorFirstName?: string
  doctorLastName?: string
  prescriptionDate: string
  status: string
}

interface DrugInventoryItem {
  drugInventoryId: number
  medicationId: number
  batchNumber: string
  quantity: number
  unitPrice: number
  manufactureDate?: string
  expiryDate: string
  minPrice?: number
  sellPrice: number
  location?: string
  notes?: string
  medicationName?: string
  medicationCode?: string
  genericName?: string
  dosageForm?: string
  strength?: string
}

export default function PharmacyPage() {
  const [addPrescriptionOpen, setAddPrescriptionOpen] = useState(false)
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [medications, setMedications] = useState<Medication[]>([])
  const [loadingPrescriptions, setLoadingPrescriptions] = useState(true)
  const [loadingMedications, setLoadingMedications] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [prescriptionStatusFilter, setPrescriptionStatusFilter] = useState<string>("")
  const [prescriptionSearch, setPrescriptionSearch] = useState("")
  const [medicationSearch, setMedicationSearch] = useState("")
  
  // Medication form state
  const [isAddMedicationOpen, setIsAddMedicationOpen] = useState(false)
  const [isEditMedicationOpen, setIsEditMedicationOpen] = useState(false)
  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null)
  const [isDeleteMedicationDialogOpen, setIsDeleteMedicationDialogOpen] = useState(false)
  const [medicationToDelete, setMedicationToDelete] = useState<Medication | null>(null)
  const [isDeletingMedication, setIsDeletingMedication] = useState(false)
  const [deleteMedicationError, setDeleteMedicationError] = useState<string | null>(null)
  
  // Prescription actions state
  const [viewPrescriptionOpen, setViewPrescriptionOpen] = useState(false)
  const [selectedPrescription, setSelectedPrescription] = useState<any | null>(null)
  const [loadingPrescriptionDetails, setLoadingPrescriptionDetails] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)
  
  // Drug Inventory state
  const [drugInventory, setDrugInventory] = useState<DrugInventoryItem[]>([])
  const [loadingDrugInventory, setLoadingDrugInventory] = useState(true)
  const [drugInventorySearch, setDrugInventorySearch] = useState("")
  const [isAddDrugInventoryOpen, setIsAddDrugInventoryOpen] = useState(false)
  const [isEditDrugInventoryOpen, setIsEditDrugInventoryOpen] = useState(false)
  const [selectedDrugInventoryItem, setSelectedDrugInventoryItem] = useState<DrugInventoryItem | null>(null)
  const [isDeleteDrugInventoryDialogOpen, setIsDeleteDrugInventoryDialogOpen] = useState(false)
  const [drugInventoryToDelete, setDrugInventoryToDelete] = useState<DrugInventoryItem | null>(null)
  const [isDeletingDrugInventory, setIsDeletingDrugInventory] = useState(false)
  const [deleteDrugInventoryError, setDeleteDrugInventoryError] = useState<string | null>(null)

  const loadPrescriptions = async () => {
    try {
      setLoadingPrescriptions(true)
      setError(null)
      const data = await pharmacyApi.getPrescriptions(undefined, prescriptionStatusFilter || undefined)
      setPrescriptions(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load prescriptions')
      console.error('Error loading prescriptions:', err)
    } finally {
      setLoadingPrescriptions(false)
    }
  }

  const loadMedications = async () => {
    try {
      setLoadingMedications(true)
      setError(null)
      const data = await pharmacyApi.getMedications(medicationSearch || undefined)
      setMedications(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load medications')
      console.error('Error loading medications:', err)
    } finally {
      setLoadingMedications(false)
    }
  }

  useEffect(() => {
    loadPrescriptions()
  }, [prescriptionStatusFilter])

  useEffect(() => {
    loadMedications()
  }, [medicationSearch])

  const loadDrugInventory = async () => {
    try {
      setLoadingDrugInventory(true)
      setError(null)
      const data = await pharmacyApi.getDrugInventory(undefined, drugInventorySearch || undefined)
      setDrugInventory(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load drug inventory')
      console.error('Error loading drug inventory:', err)
    } finally {
      setLoadingDrugInventory(false)
    }
  }

  useEffect(() => {
    loadDrugInventory()
  }, [drugInventorySearch])

  const handleAddMedicationSuccess = () => {
    loadMedications()
  }

  const handleEditMedicationClick = (medication: Medication) => {
    setSelectedMedication(medication)
    setIsEditMedicationOpen(true)
  }

  const handleEditMedicationSuccess = () => {
    loadMedications()
    setIsEditMedicationOpen(false)
    setSelectedMedication(null)
  }

  const handleDeleteMedicationClick = (medication: Medication) => {
    setMedicationToDelete(medication)
    setDeleteMedicationError(null)
    setIsDeleteMedicationDialogOpen(true)
  }

  const handleDeleteMedicationConfirm = async () => {
    if (!medicationToDelete || !medicationToDelete.medicationId) return

    try {
      setIsDeletingMedication(true)
      setDeleteMedicationError(null)
      await pharmacyApi.deleteMedication(medicationToDelete.medicationId.toString())
      setIsDeleteMedicationDialogOpen(false)
      setMedicationToDelete(null)
      loadMedications()
    } catch (err: any) {
      setDeleteMedicationError(err.message || 'Failed to delete medication')
      console.error('Error deleting medication:', err)
    } finally {
      setIsDeletingMedication(false)
    }
  }

  const handleViewPrescription = async (prescription: Prescription) => {
    setSelectedPrescription(prescription)
    setViewPrescriptionOpen(true)
    setLoadingPrescriptionDetails(true)
    try {
      const details = await pharmacyApi.getPrescription(prescription.prescriptionId.toString())
      setSelectedPrescription(details)
    } catch (err: any) {
      setError(err.message || 'Failed to load prescription details')
      console.error('Error loading prescription details:', err)
    } finally {
      setLoadingPrescriptionDetails(false)
    }
  }

  const handleUpdatePrescriptionStatus = async (prescriptionId: number, status: string) => {
    setUpdatingStatus(prescriptionId.toString())
    try {
      await pharmacyApi.updatePrescription(prescriptionId.toString(), { status })
      await loadPrescriptions()
      // If viewing this prescription, update it
      if (selectedPrescription?.prescriptionId === prescriptionId) {
        const details = await pharmacyApi.getPrescription(prescriptionId.toString())
        setSelectedPrescription(details)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update prescription status')
      console.error('Error updating prescription status:', err)
    } finally {
      setUpdatingStatus(null)
    }
  }

  const getPatientName = (prescription: Prescription) => {
    if (prescription.firstName && prescription.lastName) {
      return `${prescription.firstName} ${prescription.lastName}`
    }
    return prescription.patientNumber || `Patient ${prescription.patientId}`
  }

  const getDoctorName = (prescription: Prescription) => {
    if (prescription.doctorFirstName && prescription.doctorLastName) {
      return `Dr. ${prescription.doctorFirstName} ${prescription.doctorLastName}`
    }
    return "Unknown"
  }

  const getMedicationName = (medication: Medication) => {
    return medication.medicationName || medication.name || "Unknown"
  }

  const handleAddDrugInventorySuccess = () => {
    loadDrugInventory()
  }

  const handleEditDrugInventoryClick = (item: DrugInventoryItem) => {
    setSelectedDrugInventoryItem(item)
    setIsEditDrugInventoryOpen(true)
  }

  const handleEditDrugInventorySuccess = () => {
    loadDrugInventory()
    setIsEditDrugInventoryOpen(false)
    setSelectedDrugInventoryItem(null)
  }

  const handleDeleteDrugInventoryClick = (item: DrugInventoryItem) => {
    setDrugInventoryToDelete(item)
    setDeleteDrugInventoryError(null)
    setIsDeleteDrugInventoryDialogOpen(true)
  }

  const handleDeleteDrugInventoryConfirm = async () => {
    if (!drugInventoryToDelete || !drugInventoryToDelete.drugInventoryId) return

    try {
      setIsDeletingDrugInventory(true)
      setDeleteDrugInventoryError(null)
      await pharmacyApi.deleteDrugInventoryItem(drugInventoryToDelete.drugInventoryId.toString())
      setIsDeleteDrugInventoryDialogOpen(false)
      setDrugInventoryToDelete(null)
      loadDrugInventory()
    } catch (err: any) {
      setDeleteDrugInventoryError(err.message || 'Failed to delete drug inventory item')
      console.error('Error deleting drug inventory item:', err)
    } finally {
      setIsDeletingDrugInventory(false)
    }
  }

  const getDrugInventoryItemName = (item: DrugInventoryItem) => {
    return item.medicationName || `Medication ${item.medicationId}`
  }

  const filteredPrescriptions = prescriptions.filter((prescription) => {
    if (prescriptionSearch) {
      const searchLower = prescriptionSearch.toLowerCase()
      const patientName = getPatientName(prescription).toLowerCase()
      const doctorName = getDoctorName(prescription).toLowerCase()
      const prescriptionNumber = prescription.prescriptionNumber?.toLowerCase() || ""
      return patientName.includes(searchLower) || doctorName.includes(searchLower) || prescriptionNumber.includes(searchLower)
    }
    return true
  })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pharmacy</h1>
          <p className="text-muted-foreground">Manage prescriptions and medication inventory</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setAddPrescriptionOpen(true)}>
            <FileText className="mr-2 h-4 w-4" />
            New Prescription
          </Button>
        </div>
      </div>

      <Tabs defaultValue="prescriptions" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
          <TabsTrigger value="medications">Medications</TabsTrigger>
          <TabsTrigger value="drug-inventory">Drug Inventory</TabsTrigger>
        </TabsList>

        <TabsContent value="prescriptions" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Prescription Management</CardTitle>
              <CardDescription>View and manage patient prescriptions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div className="flex gap-2">
                  <Button 
                    variant={prescriptionStatusFilter === "" ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setPrescriptionStatusFilter("")}
                  >
                    All
                  </Button>
                  <Button 
                    variant={prescriptionStatusFilter === "pending" ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setPrescriptionStatusFilter("pending")}
                  >
                    Pending
                  </Button>
                  <Button 
                    variant={prescriptionStatusFilter === "dispensed" ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setPrescriptionStatusFilter("dispensed")}
                  >
                    Dispensed
                  </Button>
                </div>
                <div className="relative w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    type="search" 
                    placeholder="Search prescriptions..." 
                    className="w-full pl-8"
                    value={prescriptionSearch}
                    onChange={(e) => setPrescriptionSearch(e.target.value)}
                  />
                </div>
              </div>

              {loadingPrescriptions ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Prescription #</TableHead>
                        <TableHead>Patient</TableHead>
                        <TableHead>Doctor</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPrescriptions.length > 0 ? (
                        filteredPrescriptions.map((prescription) => (
                          <TableRow key={prescription.prescriptionId}>
                            <TableCell className="font-medium">{prescription.prescriptionNumber}</TableCell>
                            <TableCell>
                              {getPatientName(prescription)}
                              {prescription.patientNumber && (
                                <div className="text-xs text-muted-foreground">{prescription.patientNumber}</div>
                              )}
                            </TableCell>
                            <TableCell>{getDoctorName(prescription)}</TableCell>
                            <TableCell>{new Date(prescription.prescriptionDate).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <Badge variant={prescription.status === "pending" ? "secondary" : "default"}>
                                {prescription.status.charAt(0).toUpperCase() + prescription.status.slice(1)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleViewPrescription(prescription)}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Details
                                  </DropdownMenuItem>
                                  {prescription.status === 'pending' && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem 
                                        onClick={() => handleUpdatePrescriptionStatus(prescription.prescriptionId, 'dispensed')}
                                        disabled={updatingStatus === prescription.prescriptionId.toString()}
                                      >
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                        {updatingStatus === prescription.prescriptionId.toString() ? 'Dispensing...' : 'Mark as Dispensed'}
                                      </DropdownMenuItem>
                                      <DropdownMenuItem 
                                        onClick={() => handleUpdatePrescriptionStatus(prescription.prescriptionId, 'cancelled')}
                                        disabled={updatingStatus === prescription.prescriptionId.toString()}
                                      >
                                        <XCircle className="mr-2 h-4 w-4" />
                                        {updatingStatus === prescription.prescriptionId.toString() ? 'Cancelling...' : 'Cancel'}
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            No prescriptions found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="medications" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Medication Catalog</CardTitle>
                  <CardDescription>Manage medication catalog and inventory</CardDescription>
                </div>
                <Button onClick={() => setIsAddMedicationOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Medication
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div className="relative w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    type="search" 
                    placeholder="Search medications..." 
                    className="w-full pl-8"
                    value={medicationSearch}
                    onChange={(e) => setMedicationSearch(e.target.value)}
                  />
                </div>
              </div>

              {loadingMedications ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Generic Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Dosage Form</TableHead>
                        <TableHead>Strength</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {medications.length > 0 ? (
                        medications.map((medication) => (
                          <TableRow key={medication.medicationId}>
                            <TableCell className="font-medium">{medication.medicationCode || "-"}</TableCell>
                            <TableCell>{getMedicationName(medication)}</TableCell>
                            <TableCell>{medication.genericName || "-"}</TableCell>
                            <TableCell>{medication.category || "-"}</TableCell>
                            <TableCell>{medication.dosageForm || "-"}</TableCell>
                            <TableCell>{medication.strength || "-"}</TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleEditMedicationClick(medication)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => handleDeleteMedicationClick(medication)}
                                    className="text-destructive focus:text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            No medications found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="drug-inventory" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Drug Inventory</CardTitle>
                  <CardDescription>Manage drug inventory with batch numbers, pricing, and expiry dates</CardDescription>
                </div>
                <Button onClick={() => setIsAddDrugInventoryOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Drug Inventory
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div className="relative w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    type="search" 
                    placeholder="Search drug inventory..." 
                    className="w-full pl-8"
                    value={drugInventorySearch}
                    onChange={(e) => setDrugInventorySearch(e.target.value)}
                  />
                </div>
              </div>

              {loadingDrugInventory ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Medication</TableHead>
                        <TableHead>Batch Number</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Unit Price</TableHead>
                        <TableHead>Sell Price</TableHead>
                        <TableHead>Min Price</TableHead>
                        <TableHead>Expiry Date</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {drugInventory.length > 0 ? (
                        drugInventory.map((item) => (
                          <TableRow key={item.drugInventoryId}>
                            <TableCell className="font-medium">{getDrugInventoryItemName(item)}</TableCell>
                            <TableCell>{item.batchNumber}</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>KES {item.unitPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                            <TableCell>KES {item.sellPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                            <TableCell>{item.minPrice ? `KES ${item.minPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}</TableCell>
                            <TableCell>
                              {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : '-'}
                            </TableCell>
                            <TableCell>{item.location || '-'}</TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleEditDrugInventoryClick(item)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => handleDeleteDrugInventoryClick(item)}
                                    className="text-destructive focus:text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                            No drug inventory items found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AddPrescriptionForm 
        open={addPrescriptionOpen} 
        onOpenChange={setAddPrescriptionOpen}
        onSuccess={loadPrescriptions}
      />
      
      {/* Add Medication Dialog */}
      <MedicationForm
        open={isAddMedicationOpen}
        onOpenChange={setIsAddMedicationOpen}
        onSuccess={handleAddMedicationSuccess}
      />

      {/* Edit Medication Dialog */}
      {selectedMedication && (
        <MedicationForm
          medication={selectedMedication}
          open={isEditMedicationOpen}
          onOpenChange={(open) => {
            setIsEditMedicationOpen(open)
            if (!open) setSelectedMedication(null)
          }}
          onSuccess={handleEditMedicationSuccess}
        />
      )}

      {/* View Prescription Dialog */}
      <Dialog open={viewPrescriptionOpen} onOpenChange={setViewPrescriptionOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Prescription Details</DialogTitle>
            <DialogDescription>
              Prescription {selectedPrescription?.prescriptionNumber || ''}
            </DialogDescription>
          </DialogHeader>
          {loadingPrescriptionDetails ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : selectedPrescription ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Patient</p>
                  <p className="font-medium">
                    {selectedPrescription.firstName} {selectedPrescription.lastName}
                  </p>
                  {selectedPrescription.patientNumber && (
                    <p className="text-sm text-muted-foreground">{selectedPrescription.patientNumber}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Prescribing Doctor</p>
                  <p className="font-medium">
                    {selectedPrescription.doctorFirstName} {selectedPrescription.doctorLastName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">
                    {new Date(selectedPrescription.prescriptionDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={selectedPrescription.status === "pending" ? "secondary" : "default"}>
                    {selectedPrescription.status?.charAt(0).toUpperCase() + selectedPrescription.status?.slice(1)}
                  </Badge>
                </div>
              </div>

              {selectedPrescription.notes && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Notes</p>
                  <p className="text-sm">{selectedPrescription.notes}</p>
                </div>
              )}

              {selectedPrescription.items && selectedPrescription.items.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-3">Medications</p>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Medication</TableHead>
                          <TableHead>Dosage</TableHead>
                          <TableHead>Frequency</TableHead>
                          <TableHead>Duration</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Instructions</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedPrescription.items.map((item: any) => (
                          <TableRow key={item.itemId}>
                            <TableCell className="font-medium">{item.medicationName || 'Unknown'}</TableCell>
                            <TableCell>{item.dosage}</TableCell>
                            <TableCell>{item.frequency}</TableCell>
                            <TableCell>{item.duration}</TableCell>
                            <TableCell>{item.quantity || '-'}</TableCell>
                            <TableCell>{item.instructions || '-'}</TableCell>
                            <TableCell>
                              <Badge variant={item.status === "pending" ? "secondary" : "default"}>
                                {item.status?.charAt(0).toUpperCase() + item.status?.slice(1)}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {selectedPrescription.status === 'pending' && (
                <div className="flex gap-2 pt-4">
                  <Button 
                    onClick={() => {
                      handleUpdatePrescriptionStatus(selectedPrescription.prescriptionId, 'dispensed')
                    }}
                    disabled={updatingStatus === selectedPrescription.prescriptionId.toString()}
                    className="flex-1"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    {updatingStatus === selectedPrescription.prescriptionId.toString() ? 'Dispensing...' : 'Mark as Dispensed'}
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      handleUpdatePrescriptionStatus(selectedPrescription.prescriptionId, 'cancelled')
                    }}
                    disabled={updatingStatus === selectedPrescription.prescriptionId.toString()}
                    className="flex-1"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    {updatingStatus === selectedPrescription.prescriptionId.toString() ? 'Cancelling...' : 'Cancel Prescription'}
                  </Button>
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Delete Medication Confirmation Dialog */}
      <AlertDialog open={isDeleteMedicationDialogOpen} onOpenChange={(open) => {
        setIsDeleteMedicationDialogOpen(open)
        if (!open) {
          setMedicationToDelete(null)
          setDeleteMedicationError(null)
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete {medicationToDelete && getMedicationName(medicationToDelete)}. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteMedicationError && (
            <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
              {deleteMedicationError}
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingMedication}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteMedicationConfirm}
              disabled={isDeletingMedication}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeletingMedication ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Drug Inventory Dialog */}
      <DrugInventoryForm
        open={isAddDrugInventoryOpen}
        onOpenChange={setIsAddDrugInventoryOpen}
        onSuccess={handleAddDrugInventorySuccess}
        medications={medications}
      />

      {/* Edit Drug Inventory Dialog */}
      {selectedDrugInventoryItem && (
        <DrugInventoryForm
          item={selectedDrugInventoryItem}
          open={isEditDrugInventoryOpen}
          onOpenChange={(open) => {
            setIsEditDrugInventoryOpen(open)
            if (!open) setSelectedDrugInventoryItem(null)
          }}
          onSuccess={handleEditDrugInventorySuccess}
          medications={medications}
        />
      )}

      {/* Delete Drug Inventory Confirmation Dialog */}
      <AlertDialog open={isDeleteDrugInventoryDialogOpen} onOpenChange={(open) => {
        setIsDeleteDrugInventoryDialogOpen(open)
        if (!open) {
          setDrugInventoryToDelete(null)
          setDeleteDrugInventoryError(null)
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the drug inventory item for {drugInventoryToDelete && getDrugInventoryItemName(drugInventoryToDelete)} 
              (Batch: {drugInventoryToDelete?.batchNumber}). 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteDrugInventoryError && (
            <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
              {deleteDrugInventoryError}
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingDrugInventory}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteDrugInventoryConfirm}
              disabled={isDeletingDrugInventory}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeletingDrugInventory ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
