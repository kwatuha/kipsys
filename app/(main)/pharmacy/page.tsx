"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Search, FileText, Package, Plus, Edit, Loader2, MoreVertical, Eye, CheckCircle, XCircle, Trash2, History, ArrowRight, Sliders, Download, Printer } from "lucide-react"
import Link from "next/link"
import { AddPrescriptionForm } from "@/components/add-prescription-form"
import { MedicationForm } from "@/components/medication-form"
import { DrugInventoryForm } from "@/components/drug-inventory-form"
import { BatchTraceability } from "@/components/batch-traceability"
import { DrugInventoryHistoryDialog } from "@/components/drug-inventory-history-dialog"
import { StockAdjustmentForm } from "@/components/stock-adjustment-form"
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
  const [isDrugInventoryHistoryOpen, setIsDrugInventoryHistoryOpen] = useState(false)
  const [selectedDrugInventoryForHistory, setSelectedDrugInventoryForHistory] = useState<DrugInventoryItem | null>(null)
  const [isStockAdjustmentOpen, setIsStockAdjustmentOpen] = useState(false)
  const [selectedDrugInventoryForAdjustment, setSelectedDrugInventoryForAdjustment] = useState<DrugInventoryItem | null>(null)

  // Drug Inventory Summary state
  const [drugInventorySummary, setDrugInventorySummary] = useState<any[]>([])
  const [loadingDrugInventorySummary, setLoadingDrugInventorySummary] = useState(true)
  const [drugInventorySummarySearch, setDrugInventorySummarySearch] = useState("")

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

  const loadDrugInventorySummary = async () => {
    try {
      setLoadingDrugInventorySummary(true)
      setError(null)
      const response = await pharmacyApi.getDrugInventorySummary(drugInventorySummarySearch || undefined)
      setDrugInventorySummary(response.data || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load drug inventory summary')
      console.error('Error loading drug inventory summary:', err)
    } finally {
      setLoadingDrugInventorySummary(false)
    }
  }

  useEffect(() => {
    loadDrugInventorySummary()
  }, [drugInventorySummarySearch])

  const handleExportSummary = () => {
    // Create CSV content
    const headers = ['Medication Code', 'Medication Name', 'Generic Name', 'Dosage Form', 'Strength', 'Total Quantity', 'Batch Count', 'Earliest Expiry', 'Latest Expiry', 'Average Unit Price', 'Average Sell Price', 'Status']
    const rows = drugInventorySummary.map((item) => [
      item.medicationCode || '',
      item.medicationName || '',
      item.genericName || '',
      item.dosageForm || '',
      item.strength || '',
      item.totalQuantity || 0,
      item.batchCount || 0,
      item.earliestExpiryDate ? new Date(item.earliestExpiryDate).toLocaleDateString() : '',
      item.latestExpiryDate ? new Date(item.latestExpiryDate).toLocaleDateString() : '',
      item.averageUnitPrice ? parseFloat(item.averageUnitPrice).toFixed(2) : '',
      item.averageSellPrice ? parseFloat(item.averageSellPrice).toFixed(2) : '',
      item.status || ''
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `drug-inventory-summary-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handlePrintSummary = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Drug Inventory Summary</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { text-align: center; margin-bottom: 30px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            .date { text-align: right; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <h1>Drug Inventory Summary</h1>
          <div class="date">Generated: ${new Date().toLocaleString()}</div>
          <table>
            <thead>
              <tr>
                <th>Medication Code</th>
                <th>Medication Name</th>
                <th>Generic Name</th>
                <th>Dosage Form</th>
                <th>Strength</th>
                <th>Total Quantity</th>
                <th>Batch Count</th>
                <th>Earliest Expiry</th>
                <th>Latest Expiry</th>
                <th>Avg Unit Price</th>
                <th>Avg Sell Price</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${drugInventorySummary.map((item) => `
                <tr>
                  <td>${item.medicationCode || ''}</td>
                  <td>${item.medicationName || ''}</td>
                  <td>${item.genericName || ''}</td>
                  <td>${item.dosageForm || ''}</td>
                  <td>${item.strength || ''}</td>
                  <td>${item.totalQuantity || 0}</td>
                  <td>${item.batchCount || 0}</td>
                  <td>${item.earliestExpiryDate ? new Date(item.earliestExpiryDate).toLocaleDateString() : ''}</td>
                  <td>${item.latestExpiryDate ? new Date(item.latestExpiryDate).toLocaleDateString() : ''}</td>
                  <td>${item.averageUnitPrice ? parseFloat(item.averageUnitPrice).toFixed(2) : ''}</td>
                  <td>${item.averageSellPrice ? parseFloat(item.averageSellPrice).toFixed(2) : ''}</td>
                  <td>${item.status || ''}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `

    printWindow.document.write(htmlContent)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 250)
  }

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

  const handleViewDrugInventoryHistory = (item: DrugInventoryItem) => {
    setSelectedDrugInventoryForHistory(item)
    setIsDrugInventoryHistoryOpen(true)
  }

  const handleStockAdjustment = (item: DrugInventoryItem) => {
    setSelectedDrugInventoryForAdjustment(item)
    setIsStockAdjustmentOpen(true)
  }

  const handleStockAdjustmentSuccess = () => {
    loadDrugInventory()
    setIsStockAdjustmentOpen(false)
    setSelectedDrugInventoryForAdjustment(null)
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
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
          <TabsTrigger value="medications">Medications</TabsTrigger>
          <TabsTrigger value="drug-inventory">Drug Inventory</TabsTrigger>
          <TabsTrigger value="drug-inventory-summary">Inventory Summary</TabsTrigger>
          <TabsTrigger value="batch-trace">Batch Trace</TabsTrigger>
          <TabsTrigger value="drug-history">Drug History</TabsTrigger>
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
                            <TableCell>
                              {prescription.prescriptionDate 
                                ? new Date(prescription.prescriptionDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                                : '-'}
                            </TableCell>
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
                              {item.expiryDate 
                                ? new Date(item.expiryDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                                : '-'}
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
                                  <DropdownMenuItem onClick={() => handleViewDrugInventoryHistory(item)}>
                                    <History className="h-4 w-4 mr-2" />
                                    View History
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleStockAdjustment(item)}>
                                    <Sliders className="h-4 w-4 mr-2" />
                                    Stock Adjustment
                                  </DropdownMenuItem>
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

        <TabsContent value="drug-inventory-summary" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Drug Inventory Summary</CardTitle>
                  <CardDescription>Aggregated drug inventory quantities per medication (total across all batches)</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleExportSummary}>
                    <Download className="mr-2 h-4 w-4" />
                    Download CSV
                  </Button>
                  <Button variant="outline" onClick={handlePrintSummary}>
                    <Printer className="mr-2 h-4 w-4" />
                    Print
                  </Button>
                </div>
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
                    value={drugInventorySummarySearch}
                    onChange={(e) => setDrugInventorySummarySearch(e.target.value)}
                  />
                </div>
              </div>

              {loadingDrugInventorySummary ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Medication Code</TableHead>
                        <TableHead>Medication Name</TableHead>
                        <TableHead>Generic Name</TableHead>
                        <TableHead>Dosage Form</TableHead>
                        <TableHead>Strength</TableHead>
                        <TableHead className="text-right">Total Quantity</TableHead>
                        <TableHead className="text-right">Batch Count</TableHead>
                        <TableHead>Earliest Expiry</TableHead>
                        <TableHead>Latest Expiry</TableHead>
                        <TableHead className="text-right">Avg Unit Price</TableHead>
                        <TableHead className="text-right">Avg Sell Price</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {drugInventorySummary.length > 0 ? (
                        drugInventorySummary.map((item, index) => (
                          <TableRow key={item.medicationId || index}>
                            <TableCell className="font-medium">{item.medicationCode || '-'}</TableCell>
                            <TableCell className="font-medium">{item.medicationName || '-'}</TableCell>
                            <TableCell>{item.genericName || '-'}</TableCell>
                            <TableCell>{item.dosageForm || '-'}</TableCell>
                            <TableCell>{item.strength || '-'}</TableCell>
                            <TableCell className="text-right font-medium">{item.totalQuantity || 0}</TableCell>
                            <TableCell className="text-right">{item.batchCount || 0}</TableCell>
                            <TableCell>
                              {item.earliestExpiryDate 
                                ? new Date(item.earliestExpiryDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                                : '-'}
                            </TableCell>
                            <TableCell>
                              {item.latestExpiryDate 
                                ? new Date(item.latestExpiryDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                                : '-'}
                            </TableCell>
                            <TableCell className="text-right">
                              {item.averageUnitPrice 
                                ? `KES ${parseFloat(item.averageUnitPrice).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                : '-'}
                            </TableCell>
                            <TableCell className="text-right">
                              {item.averageSellPrice 
                                ? `KES ${parseFloat(item.averageSellPrice).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                : '-'}
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={
                                  item.status === 'out_of_stock' ? 'destructive' :
                                  item.status === 'low_stock' ? 'secondary' :
                                  'default'
                                }
                              >
                                {item.status === 'out_of_stock' ? 'Out of Stock' :
                                 item.status === 'low_stock' ? 'Low Stock' :
                                 'In Stock'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={12} className="text-center py-8 text-muted-foreground">
                            No drug inventory summary found
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

        <TabsContent value="batch-trace" className="space-y-4 mt-4">
          <BatchTraceability />
        </TabsContent>

        <TabsContent value="drug-history" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Drug History</CardTitle>
              <CardDescription>
                Complete history of all drug inventory movements with patient tracking and filters
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <History className="h-16 w-16 text-muted-foreground" />
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-semibold">View Complete Drug History</h3>
                  <p className="text-sm text-muted-foreground">
                    Access the comprehensive drug history page with advanced filtering options
                  </p>
                </div>
                <Link href="/pharmacy/history">
                  <Button>
                    Open Drug History
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
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
                    {selectedPrescription.prescriptionDate 
                      ? new Date(selectedPrescription.prescriptionDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                      : '-'}
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
                          <TableHead>Unit Price</TableHead>
                          <TableHead>Total Cost</TableHead>
                          <TableHead>Instructions</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedPrescription.items.map((item: any) => {
                          const quantity = item.quantity ? parseInt(item.quantity) : null
                          // Use sellPrice from drug_inventory (fetched by API)
                          const unitPrice = item.sellPrice ? parseFloat(item.sellPrice) : null
                          const totalCost = quantity && unitPrice ? quantity * unitPrice : null
                          const isInInventory = item.inInventory === true
                          
                          return (
                            <TableRow key={item.itemId}>
                              <TableCell className="font-medium">{item.medicationName || 'Unknown'}</TableCell>
                              <TableCell>{item.dosage}</TableCell>
                              <TableCell>{item.frequency}</TableCell>
                              <TableCell>{item.duration}</TableCell>
                              <TableCell>
                                {isInInventory ? (quantity || '-') : '-'}
                              </TableCell>
                              <TableCell>
                                {isInInventory && unitPrice 
                                  ? `KES ${unitPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                  : (isInInventory === false ? 'Not in inventory' : 'N/A')}
                              </TableCell>
                              <TableCell>
                                {isInInventory && totalCost 
                                  ? `KES ${totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                  : (isInInventory === false ? 'N/A' : 'N/A')}
                              </TableCell>
                              <TableCell>{item.instructions || '-'}</TableCell>
                              <TableCell>
                                <Badge variant={item.status === "pending" ? "secondary" : "default"}>
                                  {item.status?.charAt(0).toUpperCase() + item.status?.slice(1)}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                    {selectedPrescription.items.some((item: any) => item.sellPrice && item.quantity) && (
                      <div className="border-t p-4 flex justify-end">
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Total Cost</p>
                          <p className="text-lg font-bold">
                            KES {selectedPrescription.items
                              .reduce((sum: number, item: any) => {
                                const qty = item.quantity ? parseInt(item.quantity) : 0
                                const price = item.sellPrice ? parseFloat(item.sellPrice) : 0
                                return sum + (qty * price)
                              }, 0)
                              .toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>
                    )}
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

      {/* Drug Inventory History Dialog */}
      <DrugInventoryHistoryDialog
        open={isDrugInventoryHistoryOpen}
        onOpenChange={(open) => {
          setIsDrugInventoryHistoryOpen(open)
          if (!open) {
            setSelectedDrugInventoryForHistory(null)
          }
        }}
        drugInventoryId={selectedDrugInventoryForHistory?.drugInventoryId}
        batchNumber={selectedDrugInventoryForHistory?.batchNumber}
      />

      {/* Stock Adjustment Form */}
      <StockAdjustmentForm
        open={isStockAdjustmentOpen}
        onOpenChange={(open) => {
          setIsStockAdjustmentOpen(open)
          if (!open) {
            setSelectedDrugInventoryForAdjustment(null)
          }
        }}
        onSuccess={handleStockAdjustmentSuccess}
        drugInventoryId={selectedDrugInventoryForAdjustment?.drugInventoryId}
        medicationId={selectedDrugInventoryForAdjustment?.medicationId}
      />
    </div>
  )
}
