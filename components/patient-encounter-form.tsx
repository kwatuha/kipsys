"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useFieldArray } from "react-hook-form"
import { z } from "zod"
import { 
  CalendarIcon, 
  Loader2, 
  Plus, 
  Trash2, 
  AlertTriangle, 
  Package,
  FlaskRoundIcon as Flask,
  FileText,
  History,
  PillIcon as Pills,
  X,
  CheckCircle2,
  Clock,
  Eye
} from "lucide-react"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { PatientCombobox } from "@/components/patient-combobox"
import { MedicationCombobox } from "@/components/medication-combobox"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
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
import { patientApi, doctorsApi, pharmacyApi, laboratoryApi, medicalRecordsApi, billingApi } from "@/lib/api"

// Schema definitions
const medicationSchema = z.object({
  medicationId: z.string({
    required_error: "Please select a medication.",
  }),
  dosage: z.string().min(1, {
    message: "Dosage is required.",
  }),
  frequency: z.string().min(1, {
    message: "Frequency is required.",
  }),
  duration: z.string().min(1, {
    message: "Duration is required.",
  }),
  quantity: z.string().optional(),
  instructions: z.string().optional(),
})

const labTestSchema = z.object({
  testTypeId: z.string({
    required_error: "Please select a test type.",
  }),
  priority: z.enum(["routine", "urgent", "stat"]).default("routine"),
  clinicalIndication: z.string().optional(),
})

const encounterFormSchema = z.object({
  patientId: z.string({
    required_error: "Please select a patient.",
  }),
  doctorId: z.string({
    required_error: "Please select a doctor.",
  }),
  encounterDate: z.date({
    required_error: "Encounter date is required.",
  }),
  visitType: z.string().optional(),
  department: z.string().optional(),
  chiefComplaint: z.string().optional(),
  symptoms: z.string().optional(),
  historyOfPresentIllness: z.string().optional(),
  physicalExamination: z.string().optional(),
  diagnosis: z.string().optional(),
  treatment: z.string().optional(),
  notes: z.string().optional(),
  medications: z.array(medicationSchema).optional(),
  labTests: z.array(labTestSchema).optional(),
})

type MedicationValues = z.infer<typeof medicationSchema>
type LabTestValues = z.infer<typeof labTestSchema>
type EncounterFormValues = z.infer<typeof encounterFormSchema>

const defaultMedication: MedicationValues = {
  medicationId: "",
  dosage: "",
  frequency: "",
  duration: "",
  quantity: "",
  instructions: "",
}

const defaultLabTest: LabTestValues = {
  testTypeId: "",
  priority: "routine",
  clinicalIndication: "",
}

interface PatientEncounterFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  initialPatientId?: string
  initialDoctorId?: string
}

const STORAGE_KEY = 'patient_encounter_form_draft'

export function PatientEncounterForm({ 
  open, 
  onOpenChange, 
  onSuccess,
  initialPatientId,
  initialDoctorId 
}: PatientEncounterFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [doctors, setDoctors] = useState<any[]>([])
  const [testTypes, setTestTypes] = useState<any[]>([])
  const [medications, setMedications] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedMedicationsInventory, setSelectedMedicationsInventory] = useState<Record<number, { totalQuantity: number; hasStock: boolean; sellPrice: number | null }>>({})
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [showCloseConfirm, setShowCloseConfirm] = useState(false)
  const [activeTab, setActiveTab] = useState("encounter")
  const [prescriptionSheetOpen, setPrescriptionSheetOpen] = useState(false)
  const [labTestsSheetOpen, setLabTestsSheetOpen] = useState(false)
  const [symptomsSheetOpen, setSymptomsSheetOpen] = useState(false)
  const [diagnosisSheetOpen, setDiagnosisSheetOpen] = useState(false)
  const [historySheetOpen, setHistorySheetOpen] = useState(false)
  const [editingLabTestIndex, setEditingLabTestIndex] = useState<number | null>(null)
  const [addTestDialogOpen, setAddTestDialogOpen] = useState(false)
  const [tempLabTest, setTempLabTest] = useState<LabTestValues>(defaultLabTest)
  const [editingMedicationIndex, setEditingMedicationIndex] = useState<number | null>(null)
  const [addMedicationDialogOpen, setAddMedicationDialogOpen] = useState(false)
  const [tempMedication, setTempMedication] = useState<MedicationValues>(defaultMedication)
  
  // Patient data state
  const [patientData, setPatientData] = useState<any>(null)
  const [patientAllergies, setPatientAllergies] = useState<any[]>([])
  const [patientMedications, setPatientMedications] = useState<any[]>([])
  const [patientLabResults, setPatientLabResults] = useState<any[]>([])
  const [patientHistory, setPatientHistory] = useState<any[]>([])
  const [patientVitals, setPatientVitals] = useState<any[]>([])
  const [todayVitals, setTodayVitals] = useState<any | null>(null)
  const [loadingPatientData, setLoadingPatientData] = useState(false)

  const form = useForm<EncounterFormValues>({
    resolver: zodResolver(encounterFormSchema),
    defaultValues: {
      patientId: initialPatientId || "",
      doctorId: initialDoctorId || "",
      encounterDate: new Date(),
      visitType: "Outpatient",
      department: "",
      chiefComplaint: "",
      symptoms: "",
      historyOfPresentIllness: "",
      physicalExamination: "",
      diagnosis: "",
      treatment: "",
      notes: "",
      medications: [],
      labTests: [],
    },
  })

  const { fields: medicationFields, append: appendMedication, remove: removeMedication } = useFieldArray({
    control: form.control,
    name: "medications",
  })

  const { fields: labTestFields, append: appendLabTest, remove: removeLabTest } = useFieldArray({
    control: form.control,
    name: "labTests",
  })

  const patientId = form.watch("patientId")

  // Load saved draft when form opens
  useEffect(() => {
    if (open) {
      loadData()
      const savedDraft = loadDraftFromStorage()
      if (savedDraft) {
        if (savedDraft.encounterDate) {
          savedDraft.encounterDate = new Date(savedDraft.encounterDate)
        }
        // Clean up empty medication entries
        if (savedDraft.medications) {
          savedDraft.medications = savedDraft.medications.filter((med: any) => 
            med?.medicationId && med.medicationId.trim() !== ""
          )
        }
        form.reset(savedDraft)
        setHasUnsavedChanges(true)
      } else {
        form.reset({
          patientId: initialPatientId || "",
          doctorId: initialDoctorId || "",
          encounterDate: new Date(),
          visitType: "Outpatient",
          department: "",
          chiefComplaint: "",
          symptoms: "",
          historyOfPresentIllness: "",
          physicalExamination: "",
          diagnosis: "",
          treatment: "",
          notes: "",
          medications: [],
          labTests: [],
        })
        setHasUnsavedChanges(false)
      }
      setError(null)
    }
  }, [open, form, initialPatientId, initialDoctorId])

  // Auto-save form data to localStorage
  useEffect(() => {
    if (!open) return

    const subscription = form.watch((value) => {
      const hasData = value.patientId || value.doctorId || value.chiefComplaint || 
                      value.symptoms || value.historyOfPresentIllness || value.physicalExamination ||
                      value.diagnosis || value.treatment || value.notes ||
                      (value.medications && value.medications.length > 0) ||
                      (value.labTests && value.labTests.length > 0)
      
      if (hasData) {
        saveDraftToStorage(value as any)
        setHasUnsavedChanges(true)
      } else {
        clearDraftFromStorage()
        setHasUnsavedChanges(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [form, open])

  // Load patient data when patient is selected
  useEffect(() => {
    if (patientId && open) {
      loadPatientData(patientId)
    } else {
      setPatientData(null)
      setPatientAllergies([])
      setPatientMedications([])
      setPatientLabResults([])
      setPatientHistory([])
      setPatientVitals([])
      setTodayVitals(null)
    }
  }, [patientId, open])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      const [doctorsData, testTypesData, medicationsData] = await Promise.all([
        doctorsApi.getAll(),
        laboratoryApi.getTestTypes(),
        pharmacyApi.getMedications(undefined, 1, 1000), // Get all medications for lookup
      ])
      setDoctors(doctorsData)
      setTestTypes(testTypesData)
      setMedications(medicationsData)
      await loadInventoryData()
    } catch (err: any) {
      setError(err.message || 'Failed to load data')
      console.error('Error loading form data:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadPatientData = async (id: string) => {
    try {
      setLoadingPatientData(true)
      const [patient, allergies, prescriptions, labOrders, records, vitals] = await Promise.all([
        patientApi.getById(id).catch(() => null),
        patientApi.getAllergies(id).catch(() => []),
        pharmacyApi.getPrescriptions(id, undefined, 1, 10).catch(() => []),
        laboratoryApi.getOrders(id, undefined, 1, 10).catch(() => []),
        medicalRecordsApi.getAll(undefined, id, undefined, undefined, undefined, 1, 10).catch(() => []),
        patientApi.getVitals(id, true).catch(() => []),
      ])
      
      setPatientData(patient)
      setPatientAllergies(allergies || [])
      setPatientMedications(prescriptions || [])
      setPatientLabResults(labOrders || [])
      setPatientHistory(records || [])
      setPatientVitals(vitals || [])
      // Get today's most recent vitals
      if (vitals && vitals.length > 0) {
        setTodayVitals(vitals[0])
      } else {
        setTodayVitals(null)
      }
    } catch (err: any) {
      console.error('Error loading patient data:', err)
    } finally {
      setLoadingPatientData(false)
    }
  }

  const loadInventoryData = async () => {
    try {
      const inventoryItems = await pharmacyApi.getDrugInventory()
      const inventoryMap: Record<number, { totalQuantity: number; hasStock: boolean; sellPrice: number | null }> = {}
      
      inventoryItems.forEach((item: any) => {
        const medId = item.medicationId
        const quantity = parseInt(item.quantity || 0)
        const sellPrice = item.sellPrice ? parseFloat(item.sellPrice) : null
        
        if (!inventoryMap[medId]) {
          inventoryMap[medId] = { totalQuantity: 0, hasStock: false, sellPrice: null }
        }
        
        inventoryMap[medId].totalQuantity += quantity
        if (quantity > 0) {
          inventoryMap[medId].hasStock = true
          if (sellPrice && (!inventoryMap[medId].sellPrice || sellPrice < inventoryMap[medId].sellPrice!)) {
            inventoryMap[medId].sellPrice = sellPrice
          }
        }
      })
      
      setSelectedMedicationsInventory(inventoryMap)
    } catch (error) {
      console.error("Error loading inventory data:", error)
    }
  }

  const getInventoryStatus = (medicationId: number) => {
    const inventory = selectedMedicationsInventory[medicationId]
    if (!inventory) {
      return { hasStock: false, quantity: 0, sellPrice: null }
    }
    return {
      hasStock: inventory.hasStock && inventory.totalQuantity > 0,
      quantity: inventory.totalQuantity,
      sellPrice: inventory.sellPrice,
    }
  }

  async function onSubmit(data: EncounterFormValues) {
    try {
      setError(null)

      // Validate medications if any
      if (data.medications && data.medications.length > 0) {
        let hasValidationError = false
        for (let i = 0; i < data.medications.length; i++) {
          const med = data.medications[i]
          const medId = parseInt(med.medicationId)
          const inventoryStatus = getInventoryStatus(medId)
          
          if (inventoryStatus?.hasStock && (!med.quantity || med.quantity.trim() === '')) {
            form.setError(`medications.${i}.quantity`, {
              type: 'manual',
              message: 'Quantity is required for medications in inventory'
            })
            hasValidationError = true
          } else {
            form.clearErrors(`medications.${i}.quantity`)
          }
        }

        if (hasValidationError) {
          setActiveTab("prescription")
          return
        }
      }

      setIsSubmitting(true)

      // 1. Create medical record
      const medicalRecordData = {
        patientId: parseInt(data.patientId),
        doctorId: data.doctorId ? parseInt(data.doctorId) : null,
        visitDate: format(data.encounterDate, "yyyy-MM-dd"),
        visitType: data.visitType || "Outpatient",
        department: data.department || null,
        chiefComplaint: data.chiefComplaint || null,
        symptoms: data.symptoms || null,
        historyOfPresentIllness: data.historyOfPresentIllness || null,
        physicalExamination: data.physicalExamination || null,
        diagnosis: data.diagnosis || null,
        treatment: data.treatment || null,
        prescription: null, // Will be handled separately
        notes: data.notes || null,
      }

      const medicalRecord = await medicalRecordsApi.create(medicalRecordData)

      // 2. Create prescription if medications exist
      if (data.medications && data.medications.length > 0) {
        const items = data.medications.map((med) => {
          const medId = parseInt(med.medicationId)
          const inventoryStatus = getInventoryStatus(medId)
          const quantity = (inventoryStatus?.hasStock && med.quantity) ? parseInt(med.quantity) : null
          
          return {
            medicationId: medId,
            dosage: med.dosage,
            frequency: med.frequency,
            duration: med.duration,
            quantity,
            instructions: med.instructions || null,
          }
        })

        const prescriptionData = {
          patientId: parseInt(data.patientId),
          doctorId: parseInt(data.doctorId),
          prescriptionDate: format(data.encounterDate, 'yyyy-MM-dd'),
          status: 'pending',
          notes: data.diagnosis || data.notes || null,
          items,
        }

        await pharmacyApi.createPrescription(prescriptionData)
      }

      // 3. Create lab test orders if any
      if (data.labTests && data.labTests.length > 0) {
        // Group tests by priority - create one order per priority level
        const testsByPriority = data.labTests.reduce((acc: any, test: any) => {
          const priority = test.priority || 'routine'
          if (!acc[priority]) {
            acc[priority] = []
          }
          acc[priority].push(test)
          return acc
        }, {})

        // Create an order for each priority level
        const createdOrders = []
        for (const [priority, tests] of Object.entries(testsByPriority)) {
          const testList = tests as LabTestValues[]
          const labOrderData = {
            patientId: parseInt(data.patientId),
            orderedBy: parseInt(data.doctorId),
            orderDate: format(data.encounterDate, 'yyyy-MM-dd'),
            priority: priority,
            clinicalIndication: testList.map(t => t.clinicalIndication).filter(Boolean).join('; ') || null,
            status: 'pending',
            items: testList.map(test => ({
              testTypeId: parseInt(test.testTypeId),
              notes: test.clinicalIndication || null,
            })),
          }

          const createdOrder = await laboratoryApi.createOrder(labOrderData)
          createdOrders.push({ order: createdOrder, tests: testList })
        }

        // 4. Create invoice for lab tests
        const invoiceItems = data.labTests.map((test: any) => {
          const testType = testTypes.find(t => t.testTypeId.toString() === test.testTypeId)
          const testCost = testType?.cost ? parseFloat(testType.cost) : 0
          const testName = testType ? `${testType.testName}${testType.category ? ` (${testType.category})` : ''}` : 'Lab Test'
          
          return {
            description: testName,
            quantity: 1,
            unitPrice: testCost,
            totalPrice: testCost,
            chargeId: null, // Lab tests may not have a service charge ID
          }
        }).filter(item => item.unitPrice > 0) // Only include tests with a cost

        if (invoiceItems.length > 0) {
          const totalAmount = invoiceItems.reduce((sum: number, item: any) => sum + item.totalPrice, 0)
          
          const invoiceData = {
            patientId: parseInt(data.patientId),
            invoiceDate: format(data.encounterDate, 'yyyy-MM-dd'),
            dueDate: format(new Date(data.encounterDate.getTime() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'), // 30 days from encounter date
            status: 'pending',
            items: invoiceItems,
            notes: `Lab tests ordered during encounter on ${format(data.encounterDate, 'PPP')}. Order numbers: ${createdOrders.map((o: any) => o.order.orderNumber || o.order.orderId).join(', ')}`,
          }

          await billingApi.createInvoice(invoiceData)
        }
      }
      
      // Clear draft after successful submission
      clearDraftFromStorage()
      setHasUnsavedChanges(false)
      
      if (onSuccess) {
        onSuccess()
      }
      onOpenChange(false)
      form.reset()
    } catch (err: any) {
      setError(err.message || 'Failed to save encounter')
      console.error('Error saving encounter:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Draft management functions
  const saveDraftToStorage = (data: Partial<EncounterFormValues>) => {
    if (typeof window === 'undefined') return
    try {
      const dataToSave = {
        ...data,
        encounterDate: data.encounterDate instanceof Date 
          ? data.encounterDate.toISOString() 
          : data.encounterDate,
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave))
    } catch (error) {
      console.error('Error saving draft to localStorage:', error)
    }
  }

  const loadDraftFromStorage = (): Partial<EncounterFormValues> | null => {
    if (typeof window === 'undefined') return null
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        return JSON.parse(saved)
      }
    } catch (error) {
      console.error('Error loading draft from localStorage:', error)
    }
    return null
  }

  const clearDraftFromStorage = () => {
    if (typeof window === 'undefined') return
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (error) {
      console.error('Error clearing draft from localStorage:', error)
    }
  }

  const handleDialogClose = (newOpenState: boolean) => {
    // If trying to close and there are unsaved changes, show confirmation
    if (!newOpenState && hasUnsavedChanges) {
      setShowCloseConfirm(true)
    } else if (!newOpenState) {
      // Closing without unsaved changes - just close
      onOpenChange(false)
      setHasUnsavedChanges(false)
    } else {
      // Opening - just update the state
      onOpenChange(true)
    }
  }

  const handleConfirmClose = () => {
    clearDraftFromStorage()
    setHasUnsavedChanges(false)
    setShowCloseConfirm(false)
    onOpenChange(false)
  }

  const handleCancelClose = () => {
    setShowCloseConfirm(false)
  }

  const getPatientName = (patient: any) => {
    if (!patient) return ""
    return `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || patient.patientNumber || `Patient ${patient.patientId}`
  }

  const getDoctorName = (doctor: any) => {
    return `Dr. ${doctor.firstName || ''} ${doctor.lastName || ''}`.trim() || doctor.username || `Doctor ${doctor.userId}`
  }

  const getMedicationName = (medication: any) => {
    return medication.name || medication.medicationName || medication.medicationCode || 'Unknown'
  }

  const getTestName = (testTypeId: string) => {
    if (!testTypeId) return 'Not selected'
    const test = testTypes.find(t => t.testTypeId.toString() === testTypeId)
    return test ? `${test.testName}${test.category ? ` (${test.category})` : ''}` : 'Unknown test'
  }

  const getTestCost = (testTypeId: string) => {
    if (!testTypeId) return 0
    const test = testTypes.find(t => t.testTypeId.toString() === testTypeId)
    return test?.cost ? parseFloat(test.cost) : 0
  }

  const calculateTotalCharges = () => {
    const labTests = form.watch("labTests") || []
    return labTests.reduce((total: number, test: any) => {
      return total + getTestCost(test.testTypeId)
    }, 0)
  }

  const getMedicationNameById = (medicationId: string) => {
    if (!medicationId) return 'Not selected'
    const medication = medications.find(m => {
      const id = m.medicationId?.toString() || m.medicationId
      return id === medicationId || id === medicationId.toString()
    })
    if (medication) {
      return medication.name || medication.medicationName || 'Unknown medication'
    }
    return 'Unknown medication'
  }

  // Fetch missing medications when form data changes
  useEffect(() => {
    if (!open || medications.length === 0) return

    const fetchMissingMedications = async () => {
      const currentMeds = form.getValues("medications") || []
      const missingIds = currentMeds
        .map((med: any) => med?.medicationId)
        .filter((id: string) => id && id.trim() !== "")
        .filter((id: string) => {
          const found = medications.find(m => {
            const medId = m.medicationId?.toString() || m.medicationId
            return medId === id || medId === id.toString()
          })
          return !found
        })

      if (missingIds.length > 0) {
        try {
          const fetchedMeds = await Promise.all(
            missingIds.map((id: string) => pharmacyApi.getMedication(id).catch(() => null))
          )
          const validMeds = fetchedMeds.filter(Boolean)
          if (validMeds.length > 0) {
            setMedications((prev) => {
              const existingIds = new Set(prev.map(m => {
                const id = m.medicationId?.toString() || m.medicationId
                return id?.toString()
              }))
              const newMeds = validMeds.filter(m => {
                const id = m.medicationId?.toString() || m.medicationId
                return id && !existingIds.has(id.toString())
              })
              return [...prev, ...newMeds]
            })
          }
        } catch (error) {
          console.error('Error fetching missing medications:', error)
        }
      }
    }

    // Use a small delay to avoid too many calls
    const timer = setTimeout(fetchMissingMedications, 500)
    return () => clearTimeout(timer)
  }, [medicationFields.length, open, medications.length])

  const getMedicationCost = (medicationId: string, quantity: string) => {
    if (!medicationId || !quantity) return 0
    const medId = parseInt(medicationId)
    const qty = parseInt(quantity) || 0
    const inventoryStatus = getInventoryStatus(medId)
    const unitPrice = inventoryStatus?.sellPrice || 0
    return unitPrice * qty
  }

  const calculateTotalMedicationCost = () => {
    const meds = form.watch("medications") || []
    return meds.reduce((total: number, med: any) => {
      return total + getMedicationCost(med.medicationId, med.quantity || "0")
    }, 0)
  }

  const isMedicationAlreadyAdded = (medicationId: string) => {
    if (!medicationId) return false
    const currentMeds = form.watch("medications") || []
    return currentMeds.some((med: any, index: number) => 
      med.medicationId === medicationId && 
      (editingMedicationIndex === null || index !== editingMedicationIndex)
    )
  }

  const getAvailableMedications = () => {
    const currentMeds = form.watch("medications") || []
    const usedMedicationIds = new Set(
      currentMeds
        .map((med: any, index: number) => 
          editingMedicationIndex !== null && index === editingMedicationIndex ? null : med.medicationId
        )
        .filter(Boolean)
    )
    return medications.filter(med => !usedMedicationIds.has(med.medicationId.toString()))
  }

  const getAvailableTestTypes = () => {
    const currentTests = form.watch("labTests") || []
    const usedTestTypeIds = new Set(
      currentTests
        .map((test: any, index: number) => 
          editingLabTestIndex !== null && index === editingLabTestIndex ? null : test.testTypeId
        )
        .filter(Boolean)
    )
    return testTypes.filter(test => !usedTestTypeIds.has(test.testTypeId.toString()))
  }

  const isTestTypeAlreadyAdded = (testTypeId: string) => {
    if (!testTypeId) return false
    const currentTests = form.watch("labTests") || []
    return currentTests.some((test: any, index: number) => 
      test.testTypeId === testTypeId && 
      (editingLabTestIndex === null || index !== editingLabTestIndex)
    )
  }

  // Context Panel Component (shows patient info on right side)
  const PatientContextPanel = () => {
    if (!patientId || !patientData) {
      return null
    }

    return (
      <ScrollArea className="w-80 border-l bg-muted/30">
        <div className="p-4 space-y-4">
          {/* Today's Vitals */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4 text-green-600" />
              Today's Vitals
            </h3>
            {todayVitals ? (
              <Card className="border-l-4 border-l-green-500">
                <CardContent className="pt-4">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    {todayVitals.systolicBP && todayVitals.diastolicBP && (
                      <>
                        <div className="font-medium text-muted-foreground">Blood Pressure:</div>
                        <div className="font-semibold">{todayVitals.systolicBP}/{todayVitals.diastolicBP} mmHg</div>
                      </>
                    )}
                    {todayVitals.heartRate && (
                      <>
                        <div className="font-medium text-muted-foreground">Heart Rate:</div>
                        <div className="font-semibold">{todayVitals.heartRate} bpm</div>
                      </>
                    )}
                    {todayVitals.temperature && (
                      <>
                        <div className="font-medium text-muted-foreground">Temperature:</div>
                        <div className="font-semibold">{todayVitals.temperature}°C</div>
                      </>
                    )}
                    {todayVitals.respiratoryRate && (
                      <>
                        <div className="font-medium text-muted-foreground">Respiratory Rate:</div>
                        <div className="font-semibold">{todayVitals.respiratoryRate} bpm</div>
                      </>
                    )}
                    {todayVitals.oxygenSaturation && (
                      <>
                        <div className="font-medium text-muted-foreground">SpO2:</div>
                        <div className="font-semibold">{todayVitals.oxygenSaturation}%</div>
                      </>
                    )}
                    {todayVitals.weight && (
                      <>
                        <div className="font-medium text-muted-foreground">Weight:</div>
                        <div className="font-semibold">{todayVitals.weight} kg</div>
                      </>
                    )}
                    {todayVitals.painScore !== null && todayVitals.painScore !== undefined && (
                      <>
                        <div className="font-medium text-muted-foreground">Pain Score:</div>
                        <div className="font-semibold">{todayVitals.painScore}/10</div>
                      </>
                    )}
                  </div>
                  {todayVitals.recordedDate && (
                    <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
                      Recorded: {new Date(todayVitals.recordedDate).toLocaleString()}
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="pt-4 text-xs text-muted-foreground text-center py-4">
                  No vitals recorded today
                </CardContent>
              </Card>
            )}
          </div>

          {/* Allergies Alert */}
          {patientAllergies.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                Allergies
              </h3>
              <Card className="border-l-4 border-l-destructive">
                <CardContent className="pt-4">
                  <div className="flex flex-wrap gap-1.5">
                    {patientAllergies.map((allergy: any) => (
                      <Badge key={allergy.allergyId} variant="destructive" className="text-xs">
                        {allergy.allergen}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Recent Medications */}
          <div>
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Pills className="h-4 w-4 text-primary" />
              Recent Medications
            </h3>
            {patientMedications.length > 0 ? (
              <div className="space-y-2">
                {patientMedications.slice(0, 5).map((prescription: any) => (
                  <Card key={prescription.prescriptionId} className="border-l-2 border-l-primary/30 bg-card">
                    <CardContent className="pt-4">
                      <div className="text-xs space-y-1.5">
                        <div className="font-semibold text-foreground">
                          {prescription.items?.[0]?.medicationName || 'Medication'}
                        </div>
                        <div className="text-foreground/80">
                          {prescription.items?.[0]?.dosage} • {prescription.items?.[0]?.frequency}
                        </div>
                        {prescription.items?.[0]?.duration && (
                          <div className="text-foreground/80">
                            Duration: {prescription.items?.[0]?.duration}
                          </div>
                        )}
                        <div className="flex items-center gap-2 pt-1">
                          <Badge variant={prescription.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                            {prescription.status}
                          </Badge>
                          <span className="text-foreground/70 text-[10px]">
                            {new Date(prescription.prescriptionDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="bg-card">
                <CardContent className="pt-4 text-xs text-foreground/60 text-center py-4">
                  No recent medications
                </CardContent>
              </Card>
            )}
          </div>

          {/* Recent Lab Results */}
          <div>
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Flask className="h-4 w-4 text-blue-500" />
              Recent Lab Results
            </h3>
            {patientLabResults.length > 0 ? (
              <div className="space-y-2">
                {patientLabResults.slice(0, 5).map((order: any) => (
                  <Card key={order.orderId} className="border-l-2 border-l-blue-500/30 bg-card">
                    <CardContent className="pt-4">
                      <div className="text-xs space-y-1.5">
                        <div className="font-semibold text-foreground">Order #{order.orderNumber || order.orderId}</div>
                        <div className="text-foreground/80">
                          {order.items?.length || 0} test(s) • Priority: <span className="font-medium">{order.priority}</span>
                        </div>
                        {order.items && order.items.length > 0 && (
                          <div className="text-foreground/80">
                            Tests: {order.items.slice(0, 2).map((item: any) => item.testName || item.testTypeName).join(', ')}
                            {order.items.length > 2 && ` +${order.items.length - 2} more`}
                          </div>
                        )}
                        <div className="flex items-center gap-2 pt-1">
                          <Badge variant={order.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                            {order.status}
                          </Badge>
                          <span className="text-foreground/70 text-[10px]">
                            {new Date(order.orderDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="bg-card">
                <CardContent className="pt-4 text-xs text-foreground/60 text-center py-4">
                  No recent lab results
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </ScrollArea>
    )
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-[95vw] max-w-[95vw] h-[95vh] max-h-[95vh] overflow-hidden flex flex-col p-0 z-[50] left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%]">
          <DialogHeader className="px-6 pt-6 pb-4 border-b flex-shrink-0">
            <DialogTitle className="text-2xl">Patient Encounter</DialogTitle>
            <DialogDescription>
              Comprehensive patient consultation, documentation, and treatment planning
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            {error && (
              <div className="mx-6 mt-4 p-3 text-sm text-red-500 bg-red-50 rounded-md flex-shrink-0">
                {error}
              </div>
            )}
            {loading && (
              <div className="flex items-center justify-center py-4 flex-shrink-0">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">Loading data...</span>
              </div>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col overflow-hidden min-h-0">
                {/* Fixed Header Section - Patient Summary and Basic Fields */}
                <div className="px-6 pt-4 pb-4 flex-shrink-0 border-b">
                  {/* Patient Summary Panel */}
                  {patientId && patientData && (
                    <Card className="mb-4 border-l-4 border-l-primary">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg">{getPatientName(patientData)}</CardTitle>
                            <CardDescription>
                              {patientData.patientNumber} • {patientData.gender} • {patientData.dateOfBirth ? new Date(patientData.dateOfBirth).toLocaleDateString() : 'N/A'}
                            </CardDescription>
                          </div>
                          {loadingPatientData && (
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          {/* Today's Vitals */}
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-green-600" />
                              <span className="text-sm font-semibold">Today's Vitals</span>
                            </div>
                            {todayVitals ? (
                              <div className="space-y-1.5 text-xs bg-green-50 p-2 rounded-md border border-green-200">
                                {todayVitals.systolicBP && todayVitals.diastolicBP && (
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">BP:</span>
                                    <span className="font-semibold">{todayVitals.systolicBP}/{todayVitals.diastolicBP} mmHg</span>
                                  </div>
                                )}
                                {todayVitals.heartRate && (
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">HR:</span>
                                    <span className="font-semibold">{todayVitals.heartRate} bpm</span>
                                  </div>
                                )}
                                {todayVitals.temperature && (
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Temp:</span>
                                    <span className="font-semibold">{todayVitals.temperature}°C</span>
                                  </div>
                                )}
                                {todayVitals.respiratoryRate && (
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">RR:</span>
                                    <span className="font-semibold">{todayVitals.respiratoryRate} bpm</span>
                                  </div>
                                )}
                                {todayVitals.oxygenSaturation && (
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">SpO2:</span>
                                    <span className="font-semibold">{todayVitals.oxygenSaturation}%</span>
                                  </div>
                                )}
                                {todayVitals.weight && (
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Weight:</span>
                                    <span className="font-semibold">{todayVitals.weight} kg</span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="text-xs text-muted-foreground bg-muted p-2 rounded-md">
                                No vitals recorded today
                              </div>
                            )}
                          </div>

                          {/* Allergies Alert */}
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4 text-destructive" />
                              <span className="text-sm font-semibold">Allergies</span>
                            </div>
                            {patientAllergies.length > 0 ? (
                              <div className="space-y-1.5 bg-red-50 p-2 rounded-md border border-red-200">
                                <div className="flex flex-wrap gap-1">
                                  {patientAllergies.slice(0, 3).map((allergy: any) => (
                                    <Badge key={allergy.allergyId} variant="destructive" className="text-xs">
                                      {allergy.allergen}
                                    </Badge>
                                  ))}
                                  {patientAllergies.length > 3 && (
                                    <Badge variant="destructive" className="text-xs">
                                      +{patientAllergies.length - 3} more
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="text-xs text-muted-foreground bg-muted p-2 rounded-md">
                                No known allergies
                              </div>
                            )}
                          </div>

                          {/* Current Medications */}
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Pills className="h-4 w-4 text-primary" />
                              <span className="text-sm font-semibold">Recent Medications</span>
                            </div>
                            {patientMedications.length > 0 ? (
                              <div className="space-y-1.5 bg-blue-50 dark:bg-blue-950/30 p-2 rounded-md border border-blue-200 dark:border-blue-800">
                                {patientMedications.slice(0, 3).map((prescription: any) => (
                                  <div key={prescription.prescriptionId} className="text-xs">
                                    <div className="font-medium truncate text-foreground">
                                      {prescription.items?.[0]?.medicationName || 'Medication'}
                                    </div>
                                    <div className="text-foreground/70 text-[10px]">
                                      {prescription.status} • {new Date(prescription.prescriptionDate).toLocaleDateString()}
                                    </div>
                                  </div>
                                ))}
                                {patientMedications.length > 3 && (
                                  <div className="text-xs text-foreground/70 pt-1">
                                    +{patientMedications.length - 3} more
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="text-xs text-foreground/60 bg-muted p-2 rounded-md">
                                No active medications
                              </div>
                            )}
                          </div>

                          {/* Recent Lab Results */}
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Flask className="h-4 w-4 text-blue-500" />
                              <span className="text-sm font-semibold">Recent Lab Results</span>
                            </div>
                            {patientLabResults.length > 0 ? (
                              <div className="space-y-1.5 bg-purple-50 dark:bg-purple-950/30 p-2 rounded-md border border-purple-200 dark:border-purple-800">
                                {patientLabResults.slice(0, 2).map((order: any) => (
                                  <div key={order.orderId} className="text-xs">
                                    <div className="flex items-center gap-1">
                                      {order.status === 'completed' ? (
                                        <Badge variant="default" className="text-[10px]">Completed</Badge>
                                      ) : (
                                        <Badge variant="secondary" className="text-[10px]">{order.status}</Badge>
                                      )}
                                      <span className="text-foreground/70 text-[10px]">
                                        {new Date(order.orderDate).toLocaleDateString()}
                                      </span>
                                    </div>
                                    {order.items && order.items.length > 0 && (
                                      <div className="text-foreground/70 text-[10px] mt-0.5">
                                        {order.items.length} test(s)
                                      </div>
                                    )}
                                  </div>
                                ))}
                                {patientLabResults.length > 2 && (
                                  <div className="text-xs text-foreground/70 pt-1">
                                    +{patientLabResults.length - 2} more
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="text-xs text-foreground/60 bg-muted p-2 rounded-md">
                                No recent lab results
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                </div>

                {/* Tabs Container */}
                <Tabs value={activeTab} onValueChange={(value) => {
                  if (value === "prescription") {
                    setPrescriptionSheetOpen(true)
                    setActiveTab("encounter") // Keep encounter tab active
                  } else if (value === "lab") {
                    setLabTestsSheetOpen(true)
                    setActiveTab("encounter") // Keep encounter tab active
                  } else if (value === "symptoms") {
                    setSymptomsSheetOpen(true)
                    setActiveTab("encounter") // Keep encounter tab active
                  } else if (value === "diagnosis") {
                    setDiagnosisSheetOpen(true)
                    setActiveTab("encounter") // Keep encounter tab active
                  } else if (value === "history") {
                    setHistorySheetOpen(true)
                    setActiveTab("encounter") // Keep encounter tab active
                  } else {
                    setActiveTab(value)
                  }
                }} className="flex-1 flex flex-col overflow-hidden min-h-0">
                  {/* Sticky Tabs Navigation */}
                  <div className="px-6 py-3 border-b bg-background flex-shrink-0">
                    <TabsList className="grid w-full grid-cols-6">
                      <TabsTrigger value="encounter">
                        <FileText className="h-4 w-4 mr-2" />
                        Encounter
                      </TabsTrigger>
                      <TabsTrigger value="symptoms">
                        <FileText className="h-4 w-4 mr-2" />
                        Symptoms
                      </TabsTrigger>
                      <TabsTrigger value="diagnosis">
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Diagnosis
                      </TabsTrigger>
                      <TabsTrigger value="lab">
                        <Flask className="h-4 w-4 mr-2" />
                        Lab Tests
                      </TabsTrigger>
                      <TabsTrigger value="prescription">
                        <Pills className="h-4 w-4 mr-2" />
                        Prescription
                      </TabsTrigger>
                      <TabsTrigger value="history">
                        <History className="h-4 w-4 mr-2" />
                        History
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  {/* Scrollable Tab Content */}
                  {/* Encounter Details Tab */}
                  <TabsContent value="encounter" className="flex-1 overflow-hidden min-h-0">
                    <ScrollArea className="h-full px-6">
                      <div className="space-y-4 mt-4 pb-4">
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="patientId"
                            render={({ field }) => (
                              <FormItem className="flex flex-col">
                                <FormLabel>Patient *</FormLabel>
                                <FormControl>
                                  <PatientCombobox
                                    value={field.value}
                                    onValueChange={(value) => {
                                      field.onChange(value)
                                    }}
                                    placeholder="Search patient by name, ID, or number..."
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="doctorId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Doctor *</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select doctor" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {doctors.map((doctor) => (
                                      <SelectItem key={doctor.userId} value={doctor.userId.toString()}>
                                        {getDoctorName(doctor)} {doctor.department && ` - ${doctor.department}`}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                          <FormField
                            control={form.control}
                            name="encounterDate"
                            render={({ field }) => (
                              <FormItem className="flex flex-col">
                                <FormLabel>Encounter Date *</FormLabel>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <FormControl>
                                      <Button
                                        variant={"outline"}
                                        className={`w-full pl-3 text-left font-normal ${!field.value ? "text-muted-foreground" : ""}`}
                                      >
                                        {field.value ? format(field.value, "PPP") : <span>Select date</span>}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                      </Button>
                                    </FormControl>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                                  </PopoverContent>
                                </Popover>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="visitType"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Visit Type</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value || ""}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select visit type" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="Outpatient">Outpatient</SelectItem>
                                    <SelectItem value="Inpatient">Inpatient</SelectItem>
                                    <SelectItem value="Emergency">Emergency</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="department"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Department</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., Cardiology" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  {/* Symptoms and Diagnosis tabs now open in Sheets - placeholder content */}
                  <TabsContent value="symptoms" className="flex-1 overflow-hidden min-h-0">
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center text-muted-foreground">
                        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="text-sm">Click "Symptoms" tab to open symptoms documentation</p>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="diagnosis" className="flex-1 overflow-hidden min-h-0">
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center text-muted-foreground">
                        <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="text-sm">Click "Diagnosis" tab to open diagnosis and treatment planning</p>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Lab Tests and Prescription tabs now open in Sheets - placeholder content */}
                  <TabsContent value="lab" className="flex-1 overflow-hidden min-h-0">
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center text-muted-foreground">
                        <Flask className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="text-sm">Click "Lab Tests" tab to open lab test ordering</p>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="prescription" className="flex-1 overflow-hidden min-h-0">
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center text-muted-foreground">
                        <Pills className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="text-sm">Click "Prescription" tab to open medication prescribing</p>
                      </div>
                    </div>
                  </TabsContent>

                  {/* History tab now opens in Sheet - placeholder content */}
                  <TabsContent value="history" className="flex-1 overflow-hidden min-h-0">
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center text-muted-foreground">
                        <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="text-sm">Click "History" tab to view patient medical history</p>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                {/* Fixed Footer - Always visible above sheets */}
                <DialogFooter className="px-6 py-4 border-t bg-background flex-shrink-0 z-[100] relative shadow-lg">
                  <Button type="button" variant="outline" onClick={() => handleDialogClose(false)}>
                    Cancel
                  </Button>
                  <Button 
                    type="button" 
                    onClick={() => form.handleSubmit(onSubmit)()}
                    disabled={isSubmitting}
                    className="min-w-[140px]"
                  >
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Encounter
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </div>
        </DialogContent>
      </Dialog>

      {/* Lab Tests Sheet */}
      <Sheet open={labTestsSheetOpen} onOpenChange={setLabTestsSheetOpen}>
        <SheetContent side="right" className="w-full sm:w-[90vw] sm:max-w-5xl p-0 flex flex-col overflow-hidden z-[60]">
          <Form {...form}>
            <SheetHeader className="px-6 pt-6 pb-4 border-b flex-shrink-0">
              <SheetTitle className="flex items-center gap-2">
                <Flask className="h-5 w-5" />
                Order Lab Tests
              </SheetTitle>
              <SheetDescription>
                Order laboratory tests for this patient encounter
              </SheetDescription>
            </SheetHeader>
            <div className="flex flex-1 overflow-hidden min-h-0">
              <ScrollArea className="flex-1 px-6">
                <div className="space-y-4 mt-4 pb-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-md font-medium">Order Lab Tests</h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingLabTestIndex(null)
                        setTempLabTest(defaultLabTest)
                        setAddTestDialogOpen(true)
                      }}
                      disabled={testTypes.length === 0}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Test
                    </Button>
                  </div>

                  {labTestFields.length === 0 ? (
                    <Card>
                      <CardContent className="py-8 text-center text-muted-foreground">
                        No lab tests ordered. Click "Add Test" to order laboratory tests.
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[300px]">Test Name</TableHead>
                              <TableHead className="w-[120px]">Priority</TableHead>
                              <TableHead>Clinical Indication</TableHead>
                              <TableHead className="w-[120px] text-right">Cost</TableHead>
                              <TableHead className="w-[100px] text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {labTestFields.map((field, index) => {
                              const testData = form.watch(`labTests.${index}`)
                              const testCost = getTestCost(testData?.testTypeId || "")
                              return (
                                <TableRow key={field.id}>
                                  <TableCell className="font-medium">
                                    {getTestName(testData?.testTypeId || "")}
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant={
                                      testData?.priority === "stat" ? "destructive" :
                                      testData?.priority === "urgent" ? "default" :
                                      "secondary"
                                    }>
                                      {testData?.priority || "routine"}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="max-w-[300px]">
                                    <div className="truncate" title={testData?.clinicalIndication || ""}>
                                      {testData?.clinicalIndication || <span className="text-muted-foreground">-</span>}
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-right font-medium">
                                    {testCost > 0 ? `KES ${testCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "-"}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-2">
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          setEditingLabTestIndex(index)
                                          const testData = form.getValues(`labTests.${index}`)
                                          setTempLabTest(testData || defaultLabTest)
                                          setAddTestDialogOpen(true)
                                        }}
                                        className="h-8 w-8 p-0"
                                      >
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeLabTest(index)}
                                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              )
                            })}
                          </TableBody>
                        </Table>
                      </div>
                      <div className="flex justify-end items-center gap-4 pt-2 border-t">
                        <div className="text-sm text-muted-foreground">Total Charges:</div>
                        <div className="text-lg font-semibold">
                          KES {calculateTotalCharges().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
              <PatientContextPanel />
            </div>
            <SheetFooter className="px-6 py-4 border-t bg-background flex-shrink-0">
              <div className="flex items-center justify-between w-full">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLabTestsSheetOpen(false)}
                >
                  Close
                </Button>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Tests will be saved with the encounter
                  </span>
                  <Button
                    type="button"
                    onClick={() => {
                      setLabTestsSheetOpen(false)
                      // Trigger form submission
                      form.handleSubmit(onSubmit)()
                    }}
                    disabled={isSubmitting}
                  >
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Encounter
                  </Button>
                </div>
              </div>
            </SheetFooter>
          </Form>
        </SheetContent>
      </Sheet>

      {/* Symptoms Sheet */}
      <Sheet open={symptomsSheetOpen} onOpenChange={setSymptomsSheetOpen}>
        <SheetContent side="right" className="w-full sm:w-[90vw] sm:max-w-5xl p-0 flex flex-col overflow-hidden z-[60]">
          <Form {...form}>
            <SheetHeader className="px-6 pt-6 pb-4 border-b flex-shrink-0">
              <SheetTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Symptoms & History
              </SheetTitle>
              <SheetDescription>
                Document patient symptoms, chief complaint, history, and physical examination findings
              </SheetDescription>
            </SheetHeader>
            <div className="flex flex-1 overflow-hidden min-h-0">
              <ScrollArea className="flex-1 px-6">
                <div className="space-y-4 mt-4 pb-4">
                  <FormField
                    control={form.control}
                    name="chiefComplaint"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Chief Complaint *</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Patient's main complaint or reason for visit (e.g., 'Headache for 3 days', 'Chest pain')" 
                            className="min-h-[80px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          The primary reason the patient is seeking medical attention
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="symptoms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Presenting Symptoms</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe the symptoms in detail (e.g., 'Severe headache, nausea, photophobia for 3 days')" 
                            className="min-h-[120px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Detailed description of current symptoms, their onset, duration, and characteristics
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="historyOfPresentIllness"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>History of Present Illness (HOPI)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Chronological narrative of the illness, including progression, associated symptoms, and relevant details" 
                            className="min-h-[150px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          A detailed chronological account of the patient's current illness
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="physicalExamination"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Physical Examination Findings</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Document physical examination findings (e.g., 'BP: 120/80, HR: 72, Temp: 98.6°F. General appearance: Well-appearing. HEENT: Normal. Cardiovascular: Regular rhythm, no murmurs')" 
                            className="min-h-[150px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Objective findings from the physical examination
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </ScrollArea>
              <PatientContextPanel />
            </div>
            <SheetFooter className="px-6 py-4 border-t bg-background flex-shrink-0">
              <div className="flex items-center justify-between w-full">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSymptomsSheetOpen(false)}
                >
                  Close
                </Button>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Changes will be saved with the encounter
                  </span>
                  <Button
                    type="button"
                    onClick={() => {
                      setSymptomsSheetOpen(false)
                      // Trigger form submission
                      form.handleSubmit(onSubmit)()
                    }}
                    disabled={isSubmitting}
                  >
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Encounter
                  </Button>
                </div>
              </div>
            </SheetFooter>
          </Form>
        </SheetContent>
      </Sheet>

      {/* Diagnosis Sheet */}
      <Sheet open={diagnosisSheetOpen} onOpenChange={setDiagnosisSheetOpen}>
        <SheetContent side="right" className="w-full sm:w-[90vw] sm:max-w-5xl p-0 flex flex-col overflow-hidden z-[60]">
          <Form {...form}>
            <SheetHeader className="px-6 pt-6 pb-4 border-b flex-shrink-0">
              <SheetTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                Diagnosis & Treatment Plan
              </SheetTitle>
              <SheetDescription>
                Document diagnosis, treatment plan, and additional clinical notes
              </SheetDescription>
            </SheetHeader>
            <div className="flex flex-1 overflow-hidden min-h-0">
              <ScrollArea className="flex-1 px-6">
                <div className="space-y-4 mt-4 pb-4">
                  <FormField
                    control={form.control}
                    name="diagnosis"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Diagnosis *</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Primary and secondary diagnoses (e.g., '1. Migraine headache 2. Hypertension')" 
                            className="min-h-[120px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Clinical diagnosis based on symptoms, history, and examination findings
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="treatment"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Treatment Plan</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Detailed treatment plan including medications, procedures, lifestyle modifications, and follow-up instructions" 
                            className="min-h-[150px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Comprehensive treatment plan and management strategy
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Notes</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Any additional clinical notes, observations, patient counseling points, or special instructions" 
                            className="min-h-[120px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Additional clinical information, patient education, or special considerations
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </ScrollArea>
              <PatientContextPanel />
            </div>
            <SheetFooter className="px-6 py-4 border-t bg-background flex-shrink-0">
              <div className="flex items-center justify-between w-full">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDiagnosisSheetOpen(false)}
                >
                  Close
                </Button>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Changes will be saved with the encounter
                  </span>
                  <Button
                    type="button"
                    onClick={() => {
                      setDiagnosisSheetOpen(false)
                      // Trigger form submission
                      form.handleSubmit(onSubmit)()
                    }}
                    disabled={isSubmitting}
                  >
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Encounter
                  </Button>
                </div>
              </div>
            </SheetFooter>
          </Form>
        </SheetContent>
      </Sheet>

      {/* Prescription Sheet */}
      <Sheet open={prescriptionSheetOpen} onOpenChange={setPrescriptionSheetOpen}>
        <SheetContent side="right" className="w-full sm:w-[90vw] sm:max-w-5xl p-0 flex flex-col overflow-hidden z-[60]">
          <Form {...form}>
            <SheetHeader className="px-6 pt-6 pb-4 border-b flex-shrink-0">
              <SheetTitle className="flex items-center gap-2">
                <Pills className="h-5 w-5" />
                Prescribe Medications
              </SheetTitle>
              <SheetDescription>
                Prescribe medications for this patient encounter
              </SheetDescription>
            </SheetHeader>
            <div className="flex flex-1 overflow-hidden min-h-0">
              <ScrollArea className="flex-1 px-6">
                <div className="space-y-4 mt-4 pb-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-md font-medium">Prescribe Medications</h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingMedicationIndex(null)
                        setTempMedication(defaultMedication)
                        setAddMedicationDialogOpen(true)
                      }}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Medication
                    </Button>
                  </div>

                  {medicationFields.length === 0 ? (
                    <Card>
                      <CardContent className="py-8 text-center text-muted-foreground">
                        No medications prescribed. Click "Add Medication" to prescribe medications.
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[250px]">Medication</TableHead>
                              <TableHead className="w-[100px]">Dosage</TableHead>
                              <TableHead className="w-[120px]">Frequency</TableHead>
                              <TableHead className="w-[100px]">Duration</TableHead>
                              <TableHead className="w-[80px]">Qty</TableHead>
                              <TableHead className="w-[120px] text-right">Cost</TableHead>
                              <TableHead className="w-[100px] text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {medicationFields.map((field, index) => {
                              const medData = form.watch(`medications.${index}`)
                              const medicationId = medData?.medicationId || ""
                              
                              // Skip rows with empty medicationId
                              if (!medicationId || medicationId.trim() === "") {
                                return null
                              }
                              
                              const quantity = medData?.quantity || "0"
                              const medCost = getMedicationCost(medicationId, quantity)
                              const inventoryStatus = medicationId ? getInventoryStatus(parseInt(medicationId)) : null
                              
                              return (
                                <TableRow key={field.id}>
                                  <TableCell className="font-medium">
                                    <div className="flex flex-col">
                                      <span>{getMedicationNameById(medicationId)}</span>
                                      {inventoryStatus && (
                                        <div className="mt-1">
                                          {inventoryStatus.hasStock ? (
                                            <Badge variant="default" className="text-xs">
                                              <Package className="h-3 w-3 mr-1" />
                                              {inventoryStatus.quantity} in stock
                                            </Badge>
                                          ) : (
                                            <Badge variant="secondary" className="text-xs">
                                              <AlertTriangle className="h-3 w-3 mr-1" />
                                              Out of stock
                                            </Badge>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell>{medData?.dosage || "-"}</TableCell>
                                  <TableCell>{medData?.frequency || "-"}</TableCell>
                                  <TableCell>{medData?.duration || "-"}</TableCell>
                                  <TableCell>
                                    {inventoryStatus?.hasStock ? (
                                      <span className="font-medium">{quantity || "0"}</span>
                                    ) : (
                                      <span className="text-muted-foreground">-</span>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-right font-medium">
                                    {medCost > 0 ? (
                                      <div className="flex flex-col items-end">
                                        <span>KES {medCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                        {inventoryStatus?.sellPrice && (
                                          <span className="text-xs text-muted-foreground">
                                            @ {inventoryStatus.sellPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/unit
                                          </span>
                                        )}
                                      </div>
                                    ) : (
                                      "-"
                                    )}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-2">
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          setEditingMedicationIndex(index)
                                          const medData = form.getValues(`medications.${index}`)
                                          setTempMedication(medData || defaultMedication)
                                          setAddMedicationDialogOpen(true)
                                        }}
                                        className="h-8 w-8 p-0"
                                      >
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          removeMedication(index)
                                        }}
                                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              )
                            })}
                          </TableBody>
                        </Table>
                      </div>
                      <div className="flex justify-end items-center gap-4 pt-2 border-t">
                        <div className="text-sm text-muted-foreground">Total Cost:</div>
                        <div className="text-lg font-semibold">
                          KES {calculateTotalMedicationCost().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
              <PatientContextPanel />
            </div>
            <SheetFooter className="px-6 py-4 border-t bg-background flex-shrink-0">
              <div className="flex items-center justify-between w-full">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPrescriptionSheetOpen(false)}
                >
                  Close
                </Button>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Medications will be saved with the encounter
                  </span>
                  <Button
                    type="button"
                    onClick={() => {
                      setPrescriptionSheetOpen(false)
                      // Trigger form submission
                      form.handleSubmit(onSubmit)()
                    }}
                    disabled={isSubmitting}
                  >
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Encounter
                  </Button>
                </div>
              </div>
            </SheetFooter>
          </Form>
        </SheetContent>
      </Sheet>

      {/* History Sheet */}
      <Sheet open={historySheetOpen} onOpenChange={setHistorySheetOpen}>
        <SheetContent side="right" className="w-full sm:w-[90vw] sm:max-w-5xl p-0 flex flex-col overflow-hidden z-[60]">
          <SheetHeader className="px-6 pt-6 pb-4 border-b flex-shrink-0">
            <SheetTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Patient Medical History
            </SheetTitle>
            <SheetDescription>
              View previous medical records, diagnoses, treatments, and notes for this patient
            </SheetDescription>
          </SheetHeader>
          <ScrollArea className="flex-1 px-6">
            <div className="space-y-4 mt-4 pb-4">
              {loadingPatientData ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-sm text-muted-foreground">Loading history...</span>
                </div>
              ) : patientHistory.length > 0 ? (
                <div className="space-y-4">
                  {patientHistory.map((record: any) => (
                    <Card key={record.recordId}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">
                            {new Date(record.visitDate).toLocaleDateString()}
                          </CardTitle>
                          <Badge variant="outline">{record.visitType || 'Outpatient'}</Badge>
                        </div>
                        {record.department && (
                          <CardDescription>{record.department}</CardDescription>
                        )}
                        {record.doctorName && (
                          <CardDescription>Doctor: {record.doctorName}</CardDescription>
                        )}
                      </CardHeader>
                      <CardContent>
                        {record.chiefComplaint && (
                          <div className="mb-2">
                            <span className="text-sm font-medium">Chief Complaint: </span>
                            <span className="text-sm">{record.chiefComplaint}</span>
                          </div>
                        )}
                        {record.symptoms && (
                          <div className="mb-2">
                            <span className="text-sm font-medium">Symptoms: </span>
                            <span className="text-sm">{record.symptoms}</span>
                          </div>
                        )}
                        {record.historyOfPresentIllness && (
                          <div className="mb-2">
                            <span className="text-sm font-medium">History of Present Illness: </span>
                            <span className="text-sm">{record.historyOfPresentIllness}</span>
                          </div>
                        )}
                        {record.physicalExamination && (
                          <div className="mb-2">
                            <span className="text-sm font-medium">Physical Examination: </span>
                            <span className="text-sm">{record.physicalExamination}</span>
                          </div>
                        )}
                        {record.diagnosis && (
                          <div className="mb-2">
                            <span className="text-sm font-medium">Diagnosis: </span>
                            <span className="text-sm">{record.diagnosis}</span>
                          </div>
                        )}
                        {record.treatment && (
                          <div className="mb-2">
                            <span className="text-sm font-medium">Treatment: </span>
                            <span className="text-sm">{record.treatment}</span>
                          </div>
                        )}
                        {record.notes && (
                          <div>
                            <span className="text-sm font-medium">Notes: </span>
                            <span className="text-sm">{record.notes}</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    No previous medical records found for this patient.
                  </CardContent>
                </Card>
              )}
            </div>
          </ScrollArea>
          <SheetFooter className="px-6 py-4 border-t bg-background flex-shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setHistorySheetOpen(false)}
              className="w-full"
            >
              Close
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Add/Edit Medication Dialog */}
      <Dialog open={addMedicationDialogOpen} onOpenChange={setAddMedicationDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingMedicationIndex !== null ? "Edit Medication" : "Add Medication"}
            </DialogTitle>
            <DialogDescription>
              {editingMedicationIndex !== null ? "Update the medication prescription details" : "Add a new medication to the prescription"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Medication *
              </label>
              <MedicationCombobox
                value={tempMedication.medicationId || ""}
                onValueChange={(value) => {
                  if (isMedicationAlreadyAdded(value) && editingMedicationIndex === null) {
                    return // Prevent selecting duplicate
                  }
                  setTempMedication({ ...tempMedication, medicationId: value })
                  loadInventoryData()
                }}
                placeholder="Search medication..."
              />
              {isMedicationAlreadyAdded(tempMedication.medicationId || "") && editingMedicationIndex === null && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  This medication has already been added to the prescription
                </p>
              )}
              {tempMedication.medicationId && (() => {
                const medId = parseInt(tempMedication.medicationId)
                const inventoryStatus = getInventoryStatus(medId)
                return inventoryStatus && (
                  <div className="mt-1">
                    {inventoryStatus.hasStock ? (
                      <Badge variant="default" className="text-xs">
                        <Package className="h-3 w-3 mr-1" />
                        {inventoryStatus.quantity} in stock
                        {inventoryStatus.sellPrice && ` • KES ${inventoryStatus.sellPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/unit`}
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Out of stock
                      </Badge>
                    )}
                  </div>
                )
              })()}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Dosage *
                </label>
                <Input
                  placeholder="1 tablet"
                  value={tempMedication.dosage || ""}
                  onChange={(e) => setTempMedication({ ...tempMedication, dosage: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Frequency *
                </label>
                <Input
                  placeholder="3 times daily"
                  value={tempMedication.frequency || ""}
                  onChange={(e) => setTempMedication({ ...tempMedication, frequency: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Duration *
                </label>
                <Input
                  placeholder="7 days"
                  value={tempMedication.duration || ""}
                  onChange={(e) => setTempMedication({ ...tempMedication, duration: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Quantity {tempMedication.medicationId && (() => {
                    const medId = parseInt(tempMedication.medicationId)
                    const inventoryStatus = getInventoryStatus(medId)
                    return inventoryStatus?.hasStock && <span className="text-destructive">*</span>
                  })()}
                </label>
                <Input
                  type="number"
                  min="1"
                  placeholder="Enter quantity"
                  value={tempMedication.quantity || ""}
                  onChange={(e) => setTempMedication({ ...tempMedication, quantity: e.target.value })}
                  disabled={!tempMedication.medicationId || !getInventoryStatus(parseInt(tempMedication.medicationId))?.hasStock}
                />
                {tempMedication.medicationId && (() => {
                  const medId = parseInt(tempMedication.medicationId)
                  const inventoryStatus = getInventoryStatus(medId)
                  const qty = parseInt(tempMedication.quantity || "0")
                  const totalCost = inventoryStatus?.sellPrice ? inventoryStatus.sellPrice * qty : 0
                  return inventoryStatus?.hasStock && inventoryStatus.sellPrice && (
                    <p className="text-xs text-muted-foreground">
                      {qty > 0 && (
                        <span className="font-medium">
                          Total: KES {totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      )}
                    </p>
                  )
                })()}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Special Instructions
              </label>
              <Textarea
                placeholder="Take with food"
                value={tempMedication.instructions || ""}
                onChange={(e) => setTempMedication({ ...tempMedication, instructions: e.target.value })}
              />
              <p className="text-sm text-muted-foreground">Optional</p>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setAddMedicationDialogOpen(false)
                setEditingMedicationIndex(null)
                setTempMedication(defaultMedication)
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (!tempMedication.medicationId || !tempMedication.dosage || !tempMedication.frequency || !tempMedication.duration) {
                  return
                }
                // Check for duplicates when adding (not editing)
                if (editingMedicationIndex === null && isMedicationAlreadyAdded(tempMedication.medicationId)) {
                  return // Prevent adding duplicate
                }
                // Check quantity requirement for in-stock medications
                const medId = parseInt(tempMedication.medicationId)
                const inventoryStatus = getInventoryStatus(medId)
                if (inventoryStatus?.hasStock && (!tempMedication.quantity || tempMedication.quantity.trim() === '')) {
                  return // Quantity required for in-stock medications
                }
                if (editingMedicationIndex !== null) {
                  // Update existing medication
                  form.setValue(`medications.${editingMedicationIndex}`, tempMedication)
                } else {
                  // Add new medication
                  appendMedication(tempMedication)
                }
                setAddMedicationDialogOpen(false)
                setEditingMedicationIndex(null)
                setTempMedication(defaultMedication)
              }}
              disabled={
                !tempMedication.medicationId || 
                !tempMedication.dosage || 
                !tempMedication.frequency || 
                !tempMedication.duration ||
                (editingMedicationIndex === null && isMedicationAlreadyAdded(tempMedication.medicationId)) ||
                (tempMedication.medicationId && (() => {
                  const medId = parseInt(tempMedication.medicationId)
                  const inventoryStatus = getInventoryStatus(medId)
                  return inventoryStatus?.hasStock && (!tempMedication.quantity || tempMedication.quantity.trim() === '')
                })())
              }
            >
              {editingMedicationIndex !== null ? "Update" : "Add"} Medication
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Lab Test Dialog */}
      <Dialog open={addTestDialogOpen} onOpenChange={setAddTestDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingLabTestIndex !== null ? "Edit Lab Test" : "Add Lab Test"}
            </DialogTitle>
            <DialogDescription>
              {editingLabTestIndex !== null ? "Update the lab test details" : "Add a new laboratory test to the order"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Test Type *
                  </label>
                  <Select 
                    onValueChange={(value) => {
                      if (isTestTypeAlreadyAdded(value) && editingLabTestIndex === null) {
                        return // Prevent selecting duplicate
                      }
                      setTempLabTest({ ...tempLabTest, testTypeId: value })
                    }} 
                    value={tempLabTest.testTypeId || ""}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select test type" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableTestTypes().length > 0 ? (
                        getAvailableTestTypes().map((test) => (
                          <SelectItem key={test.testTypeId} value={test.testTypeId.toString()}>
                            {test.testName} {test.category && `(${test.category})`}
                            {test.cost && ` - KES ${parseFloat(test.cost).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                          </SelectItem>
                        ))
                      ) : (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">
                          All available tests have been added
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                  {isTestTypeAlreadyAdded(tempLabTest.testTypeId || "") && editingLabTestIndex === null && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      This test has already been added to the order
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Priority *
                  </label>
                  <Select 
                    onValueChange={(value: "routine" | "urgent" | "stat") => setTempLabTest({ ...tempLabTest, priority: value })} 
                    value={tempLabTest.priority || "routine"}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="routine">Routine</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                      <SelectItem value="stat">STAT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Clinical Indication
                  </label>
                  <Textarea 
                    placeholder="Reason for ordering this test" 
                    value={tempLabTest.clinicalIndication || ""}
                    onChange={(e) => setTempLabTest({ ...tempLabTest, clinicalIndication: e.target.value })}
                  />
                  <p className="text-sm text-muted-foreground">Optional</p>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setAddTestDialogOpen(false)
                    setEditingLabTestIndex(null)
                    setTempLabTest(defaultLabTest)
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    if (!tempLabTest.testTypeId) {
                      return
                    }
                    // Check for duplicates when adding (not editing)
                    if (editingLabTestIndex === null && isTestTypeAlreadyAdded(tempLabTest.testTypeId)) {
                      return // Prevent adding duplicate
                    }
                    if (editingLabTestIndex !== null) {
                      // Update existing test
                      form.setValue(`labTests.${editingLabTestIndex}`, tempLabTest)
                    } else {
                      // Add new test
                      appendLabTest(tempLabTest)
                    }
                    setAddTestDialogOpen(false)
                    setEditingLabTestIndex(null)
                    setTempLabTest(defaultLabTest)
                  }}
                  disabled={!tempLabTest.testTypeId || (editingLabTestIndex === null && isTestTypeAlreadyAdded(tempLabTest.testTypeId))}
                >
                  {editingLabTestIndex !== null ? "Update" : "Add"} Test
                </Button>
              </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showCloseConfirm} onOpenChange={setShowCloseConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes in this encounter form. Your draft has been saved and will be restored when you open the form again.
              <br /><br />
              Do you want to close the form? Your data will be saved as a draft.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelClose}>Continue Editing</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmClose}>Close Form</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

