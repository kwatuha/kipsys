"use client"

import { useState, useEffect, useMemo } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useFieldArray, useWatch } from "react-hook-form"
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
  Eye,
  Activity,
  Stethoscope,
  User
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
import { DiagnosisCombobox } from "@/components/diagnosis-combobox"
import { SymptomsAutocomplete } from "@/components/symptoms-autocomplete"
import { ChiefComplaintCombobox } from "@/components/chief-complaint-combobox"
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
import { patientApi, doctorsApi, pharmacyApi, laboratoryApi, medicalRecordsApi, billingApi, proceduresApi, serviceChargeApi, appointmentsApi, queueApi } from "@/lib/api"
import { useCriticalNotifications } from "@/lib/critical-notifications-context"
import { toast } from "@/components/ui/use-toast"
import { useAuth } from "@/lib/auth/auth-context"

const DRAFT_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

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
  alreadySaved: z.boolean().optional(), // Track if already saved
})

const labTestSchema = z.object({
  testTypeId: z.string({
    required_error: "Please select a test type.",
  }),
  priority: z.enum(["routine", "urgent", "stat"]).default("routine"),
  clinicalIndication: z.string().optional(),
  alreadySaved: z.boolean().optional(), // Track if already saved
})

const procedureSchema = z.object({
  procedureId: z.string({
    required_error: "Please select a procedure.",
  }),
  notes: z.string().optional(),
  complications: z.string().optional(),
  alreadySaved: z.boolean().optional(), // Track if already saved
})

const orderSchema = z.object({
  chargeId: z.string({
    required_error: "Please select a consumable/order.",
  }),
  quantity: z.coerce.number().min(1, {
    message: "Quantity must be at least 1.",
  }),
  notes: z.string().optional(),
  alreadySaved: z.boolean().optional(), // Track if already saved
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
  outcome: z.string().optional(),
  notes: z.string().optional(),
  nextAppointmentDate: z.date().optional(),
  nextAppointmentTime: z.string().optional(),
  nextAppointmentDoctorId: z.string().optional(),
  nextAppointmentDepartment: z.string().optional(),
  nextAppointmentReason: z.string().optional(),
  medications: z.array(medicationSchema).optional(),
  labTests: z.array(labTestSchema).optional(),
  procedures: z.array(procedureSchema).optional(),
  orders: z.array(orderSchema).optional(),
})

type MedicationValues = z.infer<typeof medicationSchema>
type LabTestValues = z.infer<typeof labTestSchema>
type ProcedureValues = z.infer<typeof procedureSchema>
type OrderValues = z.infer<typeof orderSchema>
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

const defaultProcedure: ProcedureValues = {
  procedureId: "",
  notes: "",
  complications: "",
}

const defaultOrder: OrderValues = {
  chargeId: "",
  quantity: 1,
  notes: "",
}

interface PatientEncounterFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  initialPatientId?: string
  initialDoctorId?: string
}

//const STORAGE_KEY = 'patient_encounter_form_draft'
const getStorageKey = (patientId:any) => {
  if (!patientId) return null
  return `patient_encounter_form_draft_${patientId}`
}

export function PatientEncounterForm({
  open,
  onOpenChange,
  onSuccess,
  initialPatientId,
  initialDoctorId
}: PatientEncounterFormProps) {
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [doctors, setDoctors] = useState<any[]>([])
  const [testTypes, setTestTypes] = useState<any[]>([])
  const [medications, setMedications] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(false) // Prevent multiple simultaneous loads
  const [error, setError] = useState<string | null>(null)
  const [selectedMedicationsInventory, setSelectedMedicationsInventory] = useState<Record<number, { totalQuantity: number; hasStock: boolean; sellPrice: number | null }>>({})
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [showCloseConfirm, setShowCloseConfirm] = useState(false)
  const [activeTab, setActiveTab] = useState("encounter")
  const [prescriptionSheetOpen, setPrescriptionSheetOpen] = useState(false)
  const [proceduresSheetOpen, setProceduresSheetOpen] = useState(false)
  const [ordersSheetOpen, setOrdersSheetOpen] = useState(false)
  const [procedures, setProcedures] = useState<any[]>([])
  const [consumables, setConsumables] = useState<any[]>([])
  const [addProcedureDialogOpen, setAddProcedureDialogOpen] = useState(false)
  const [addOrderDialogOpen, setAddOrderDialogOpen] = useState(false)
  const [editingProcedureIndex, setEditingProcedureIndex] = useState<number | null>(null)
  const [editingOrderIndex, setEditingOrderIndex] = useState<number | null>(null)
  const [tempProcedure, setTempProcedure] = useState<ProcedureValues>(defaultProcedure)
  const [tempOrder, setTempOrder] = useState<OrderValues>(defaultOrder)
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
  const [isQuantityManuallyEdited, setIsQuantityManuallyEdited] = useState(false)

  // Helper function to extract numeric value from text
  const extractNumber = (text: string): number => {
    if (!text) return 0
    // Match first number in the string (including decimals)
    const match = text.match(/(\d+\.?\d*)/)
    return match ? parseFloat(match[1]) : 0
  }

  // Auto-calculate quantity based on dosage, frequency, and duration
  useEffect(() => {
    if (isQuantityManuallyEdited || !addMedicationDialogOpen) return

    const dosage = extractNumber(tempMedication.dosage || "")
    const frequencyText = (tempMedication.frequency || "").toLowerCase()
    const duration = extractNumber(tempMedication.duration || "")

    // Extract frequency - handle common patterns
    let frequency = extractNumber(tempMedication.frequency || "")
    if (frequency === 0) {
      // Try to parse common frequency patterns
      if (frequencyText.includes("once") || frequencyText.includes("1x")) frequency = 1
      else if (frequencyText.includes("twice") || frequencyText.includes("2x")) frequency = 2
      else if (frequencyText.includes("three") || frequencyText.includes("thrice") || frequencyText.includes("3x")) frequency = 3
      else if (frequencyText.includes("four") || frequencyText.includes("4x")) frequency = 4
      else if (frequencyText.includes("five") || frequencyText.includes("5x")) frequency = 5
      else if (frequencyText.includes("six") || frequencyText.includes("6x")) frequency = 6
    }

    // Calculate quantity: dosage * frequency * duration
    if (dosage > 0 && frequency > 0 && duration > 0) {
      const calculatedQuantity = Math.ceil(dosage * frequency * duration)
      setTempMedication(prev => ({
        ...prev,
        quantity: calculatedQuantity.toString()
      }))
    } else if (dosage === 0 || frequency === 0 || duration === 0) {
      // Clear quantity if any required field is empty
      setTempMedication(prev => ({
        ...prev,
        quantity: prev.quantity || ""
      }))
    }
  }, [tempMedication.dosage, tempMedication.frequency, tempMedication.duration, addMedicationDialogOpen, isQuantityManuallyEdited])

  // Reset manual edit flag when dialog opens/closes
  useEffect(() => {
    if (addMedicationDialogOpen) {
      setIsQuantityManuallyEdited(false)
    }
  }, [addMedicationDialogOpen])

  // Patient data state
  const [patientData, setPatientData] = useState<any>(null)
  const [patientAllergies, setPatientAllergies] = useState<any[]>([])
  const [patientMedications, setPatientMedications] = useState<any[]>([])
  const [patientLabResults, setPatientLabResults] = useState<any[]>([])
  const [patientProcedures, setPatientProcedures] = useState<any[]>([])
  const [patientOrders, setPatientOrders] = useState<any[]>([]) // Invoices with consumables/orders
  const [patientHistory, setPatientHistory] = useState<any[]>([])
  const [patientVitals, setPatientVitals] = useState<any[]>([])
  const [todayVitals, setTodayVitals] = useState<any | null>(null)
  const [loadingPatientData, setLoadingPatientData] = useState(false)
  const [isLoadingPatientData, setIsLoadingPatientData] = useState(false) // Prevent multiple simultaneous loads
  const [lastLoadedPatientId, setLastLoadedPatientId] = useState<string | null>(null) // Track last loaded patient
  const [selectedDiagnoses, setSelectedDiagnoses] = useState<any[]>([])
  const { addNotification, notifications } = useCriticalNotifications()

  const form = useForm<EncounterFormValues>({
    resolver: zodResolver(encounterFormSchema),
    defaultValues: {
      patientId: initialPatientId || "",
      doctorId: initialDoctorId || "",
      encounterDate: new Date(new Date().setHours(0, 0, 0, 0)), // Today's date at midnight
      visitType: "Outpatient",
      department: "",
      chiefComplaint: "",
      symptoms: "",
      historyOfPresentIllness: "",
      physicalExamination: "",
      diagnosis: "",
      treatment: "",
      outcome: "",
      notes: "",
      nextAppointmentDate: undefined,
      nextAppointmentTime: "",
      nextAppointmentDoctorId: "",
      nextAppointmentDepartment: "",
      nextAppointmentReason: "",
      medications: [],
      labTests: [],
      procedures: [],
      orders: [],
    },
  })

  // Watch outcome to conditionally show appointment fields (prevents flickering)
  const outcome = useWatch({ control: form.control, name: "outcome" })

  const { fields: medicationFields, append: appendMedication, remove: removeMedication } = useFieldArray({
    control: form.control,
    name: "medications",
  })

  const { fields: labTestFields, append: appendLabTest, remove: removeLabTest } = useFieldArray({
    control: form.control,
    name: "labTests",
  })

  const { fields: procedureFields, append: appendProcedure, remove: removeProcedure } = useFieldArray({
    control: form.control,
    name: "procedures",
  })

  const { fields: orderFields, append: appendOrder, remove: removeOrder } = useFieldArray({
    control: form.control,
    name: "orders",
  })

  const patientId = form.watch("patientId")

  // Reset loading state when dialog closes
  useEffect(() => {
    if (!open) {
      console.log('🚪 [ENCOUNTER FORM] Dialog closing - clearing all loading states')
      setLoading(false)
      setIsLoadingData(false)
      setIsLoadingPatientData(false)
      setLoadingPatientData(false)
      setLastLoadedPatientId(null)
      setError(null)
    }
  }, [open])

  // Load saved draft when form opens - only run once when form opens
  useEffect(() => {
    if (!open) return
    if (isLoadingData) return // Don't run if already loading

    console.log('📂 [ENCOUNTER FORM] Form opened - calling loadData')
    // Ensure loading state is cleared before starting
    setLoading(false)
    setIsLoadingData(false)

    // Add a safety timeout to ensure loading state clears even if loadData hangs
    const safetyTimeout = setTimeout(() => {
      console.warn('⚠️ [ENCOUNTER FORM] Safety timeout - forcing loading state clear')
      setLoading(false)
      setIsLoadingData(false)
    }, 35000) // 35 seconds - slightly longer than loadData timeout

    loadData().finally(() => {
      clearTimeout(safetyTimeout)
    })

    const patientId = initialPatientId || form.getValues("patientId")
    const savedDraft = loadDraftFromStorage(patientId)

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
      // Clean up empty procedure entries
      if (savedDraft.procedures) {
        savedDraft.procedures = savedDraft.procedures.filter((proc: any) =>
          proc?.procedureId && proc.procedureId.trim() !== ""
        )
      }
      // Clean up empty order entries
      if (savedDraft.orders) {
        savedDraft.orders = savedDraft.orders.filter((order: any) =>
          order?.chargeId && order.chargeId.trim() !== ""
        )
      }
      form.reset(savedDraft)
      setHasUnsavedChanges(true)
    } else {
      // Get current doctor ID from form if already set, otherwise use initialDoctorId
      const currentDoctorId = form.getValues("doctorId") || initialDoctorId || ""

      form.reset({
        patientId: initialPatientId || "",
        doctorId: currentDoctorId, // Preserve existing doctor ID if set
        encounterDate: new Date(new Date().setHours(0, 0, 0, 0)), // Today's date at midnight
        visitType: "Outpatient",
        department: "",
        chiefComplaint: "",
        symptoms: "",
        historyOfPresentIllness: "",
        physicalExamination: "",
        diagnosis: "",
        treatment: "",
        outcome: "",
        notes: "",
        medications: [],
        labTests: [],
        procedures: [],
        orders: [],
      })
      setHasUnsavedChanges(false)
    }
    setError(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]) // Only depend on 'open' to prevent multiple triggers

  // Auto-save form data to localStorage - debounced to prevent excessive writes
  useEffect(() => {
    if (!open) return

    let saveTimeout: NodeJS.Timeout | null = null

    const subscription = form.watch((value) => {
      // Debounce the save operation to prevent excessive localStorage writes
      if (saveTimeout) {
        clearTimeout(saveTimeout)
      }

      saveTimeout = setTimeout(() => {
        const hasData = value.patientId || value.doctorId || value.chiefComplaint ||
                        value.symptoms || value.historyOfPresentIllness || value.physicalExamination ||
                        value.diagnosis || value.treatment || value.notes ||
                        (value.medications && value.medications.length > 0) ||
                        (value.labTests && value.labTests.length > 0) ||
                        (value.procedures && value.procedures.length > 0) ||
                        (value.orders && value.orders.length > 0)

        if (hasData) {
          saveDraftToStorage(value as any)
          setHasUnsavedChanges(true)
        } else {
          clearDraftFromStorage(value.patientId)
          setHasUnsavedChanges(false)
        }
      }, 500) // Debounce by 500ms
    })

    return () => {
      if (saveTimeout) {
        clearTimeout(saveTimeout)
      }
      subscription.unsubscribe()
    }
  }, [form, open])

  // Reset selected diagnoses when diagnosis sheet closes
  useEffect(() => {
    if (!diagnosisSheetOpen) {
      setSelectedDiagnoses([])
    }
  }, [diagnosisSheetOpen])

  // Reset tempLabTest when dialog opens for adding a new test (not editing)
  useEffect(() => {
    if (addTestDialogOpen && editingLabTestIndex === null) {
      setTempLabTest(defaultLabTest)
    }
  }, [addTestDialogOpen, editingLabTestIndex])

  // Load patient data when patient is selected
  useEffect(() => {
    if (patientId && open) {
      // Only load if patientId changed or we haven't loaded this patient yet
      if (patientId !== lastLoadedPatientId && !isLoadingPatientData) {
        loadPatientData(patientId)
        setLastLoadedPatientId(patientId)
      }
    } else {
      setPatientData(null)
      setPatientAllergies([])
      setPatientMedications([])
      setPatientLabResults([])
      setPatientHistory([])
      setPatientVitals([])
      setTodayVitals(null)
      setLastLoadedPatientId(null)
    }
  }, [patientId, open, lastLoadedPatientId, isLoadingPatientData])


  // Auto-fill doctor field when doctors are loaded and form is open
  // Only run once when doctors are first loaded
  useEffect(() => {
    if (!open || !patientId) return
    if (doctors.length === 0) return // Wait for doctors to load
    if (initialDoctorId) return // Don't override if initialDoctorId is provided

    // Check if doctor field is already filled
    const currentDoctorId = form.getValues("doctorId")
    if (currentDoctorId) return // Don't override if already set

    // Auto-fill doctor with logged-in user if they are a doctor
    if (user?.id) {
      const currentUserAsDoctor = doctors.find((doctor: any) =>
        doctor.userId?.toString() === user.id.toString() ||
        doctor.id?.toString() === user.id.toString()
      )
      if (currentUserAsDoctor) {
        const doctorId = currentUserAsDoctor.userId?.toString() || currentUserAsDoctor.id?.toString() || ""
        if (doctorId) {
          form.setValue('doctorId', doctorId, { shouldDirty: false })
          console.log('✅ Auto-filled doctor field with logged-in user:', user.name || user.username)
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctors.length, open, patientId]) // Only depend on doctors.length, not the full array

  // Reset form when switching patients (but don't reset doctor if it was auto-filled)
  // Only reset if patientId actually changed
  useEffect(() => {
    if (!open) return
    if (!patientId) return

    // Check if this is a new patient (different from last loaded)
    if (patientId === lastLoadedPatientId) return // Don't reset if same patient

    const currentDoctorId = form.getValues("doctorId") || initialDoctorId || ""

    // Reset form when switching patients
    form.reset({
      patientId,
      doctorId: currentDoctorId, // Preserve existing doctor ID
      encounterDate: new Date(new Date().setHours(0, 0, 0, 0)),
      visitType: "Outpatient",
      medications: [],
      labTests: [],
      procedures: [],
      orders: [],
    })

    setHasUnsavedChanges(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId, open, lastLoadedPatientId]) // Removed form and initialDoctorId to prevent unnecessary resets


  // Populate form with today's encounter data when patient data is loaded
// Populate form with today's encounter data when patient data is loaded
  useEffect(() => {
    if (!open || !patientId) return

    const encounterDate = form.getValues("encounterDate")
    if (!encounterDate) return

    const encounterDateStr = format(encounterDate, 'yyyy-MM-dd')

    // Check if we've already loaded data for this patient/date combination
    const currentFormState = form.getValues()
    const hasExistingData =
      currentFormState.medications?.length > 0 ||
      currentFormState.labTests?.length > 0 ||
      currentFormState.procedures?.length > 0 ||
      currentFormState.orders?.length > 0

    // Skip prepopulation if there's already data (from draft or user input)
    if (hasExistingData) {
      console.log('⏭️ Skipping prepopulation - form already has data')
      return
    }

    console.log('🔄 Prepopulating form for patient:', patientId, 'date:', encounterDateStr)

    // Get today's medical record (most recent one for this date)
    const todayRecord = patientHistory.find((record: any) => {
      const recordDateStr = format(new Date(record.visitDate), 'yyyy-MM-dd')
      return recordDateStr === encounterDateStr
    })

    // Prepopulate Symptoms & History and Diagnosis & Treatment Plan from today's record
    if (todayRecord) {
      const currentValues = form.getValues()
      const updates: any = {}

      // Only populate if fields are empty (to avoid overwriting user input)
      if (!currentValues.chiefComplaint && todayRecord.chiefComplaint) {
        updates.chiefComplaint = todayRecord.chiefComplaint
      }
      if (!currentValues.symptoms && todayRecord.symptoms) {
        updates.symptoms = todayRecord.symptoms
      }
      if (!currentValues.historyOfPresentIllness && todayRecord.historyOfPresentIllness) {
        updates.historyOfPresentIllness = todayRecord.historyOfPresentIllness
      }
      if (!currentValues.physicalExamination && todayRecord.physicalExamination) {
        updates.physicalExamination = todayRecord.physicalExamination
      }
      if (!currentValues.diagnosis && todayRecord.diagnosis) {
        updates.diagnosis = todayRecord.diagnosis
      }
      if (!currentValues.treatment && todayRecord.treatment) {
        updates.treatment = todayRecord.treatment
      }
      if (!currentValues.outcome && todayRecord.outcome) {
        updates.outcome = todayRecord.outcome
      }
      if (!currentValues.notes && todayRecord.notes) {
        updates.notes = todayRecord.notes
      }

      // Apply updates if any
      if (Object.keys(updates).length > 0) {
        setTimeout(() => {
          form.setValue("chiefComplaint", updates.chiefComplaint || currentValues.chiefComplaint || "")
          form.setValue("symptoms", updates.symptoms || currentValues.symptoms || "")
          form.setValue("historyOfPresentIllness", updates.historyOfPresentIllness || currentValues.historyOfPresentIllness || "")
          form.setValue("physicalExamination", updates.physicalExamination || currentValues.physicalExamination || "")
          form.setValue("diagnosis", updates.diagnosis || currentValues.diagnosis || "")
          form.setValue("treatment", updates.treatment || currentValues.treatment || "")
          form.setValue("notes", updates.notes || currentValues.notes || "")
        }, 0)
      }
    }

    // Prepopulate Lab Tests
    if (patientLabResults.length > 0) {
      const encounterLabOrders = patientLabResults.filter((order: any) => {
        const orderDateStr = format(new Date(order.orderDate), 'yyyy-MM-dd')
        return orderDateStr === encounterDateStr && order.items && order.items.length > 0
      })

      if (encounterLabOrders.length > 0) {
        const labTestsToAdd: any[] = []
        encounterLabOrders.forEach((order: any) => {
          order.items.forEach((item: any) => {
            labTestsToAdd.push({
              testTypeId: item.testTypeId?.toString() || item.testType?.testTypeId?.toString() || "",
              priority: order.priority || "routine",
              clinicalIndication: item.notes || item.clinicalIndication || "",
              alreadySaved: true, // Mark as already saved since it's from existing order
            })
          })
        })

        if (labTestsToAdd.length > 0) {
          console.log('✅ Prepopulating', labTestsToAdd.length, 'lab tests')
          setTimeout(() => {
            labTestsToAdd.forEach(test => appendLabTest(test))
          }, 100)
        }
      }
    }

    // Prepopulate Medications
    if (patientMedications.length > 0) {
      const encounterPrescriptions = patientMedications.filter((prescription: any) => {
        const prescriptionDateStr = format(new Date(prescription.prescriptionDate), 'yyyy-MM-dd')
        return prescriptionDateStr === encounterDateStr && prescription.items && prescription.items.length > 0
      })

      if (encounterPrescriptions.length > 0) {
        const medicationsToAdd: any[] = []
        encounterPrescriptions.forEach((prescription: any) => {
          prescription.items.forEach((item: any) => {
            medicationsToAdd.push({
              medicationId: item.medicationId?.toString() || "",
              dosage: item.dosage || "",
              frequency: item.frequency || "",
              duration: item.duration || "",
              quantity: item.quantity?.toString() || "",
              instructions: item.instructions || "",
              alreadySaved: true, // Mark as already saved since it's from existing prescription
            })
          })
        })

        if (medicationsToAdd.length > 0) {
          console.log('✅ Prepopulating', medicationsToAdd.length, 'medications')
          setTimeout(() => {
            medicationsToAdd.forEach(med => appendMedication(med))
          }, 200)
        }
      }
    }

    // Prepopulate Procedures
    if (patientProcedures.length > 0 && procedures.length > 0) {
      const encounterProcedures = patientProcedures.filter((procedure: any) => {
        const procedureDateStr = format(new Date(procedure.procedureDate), 'yyyy-MM-dd')
        return procedureDateStr === encounterDateStr && procedure.procedureId
      })

      if (encounterProcedures.length > 0) {
        const proceduresToAdd: any[] = []
        encounterProcedures.forEach((procedure: any) => {
          const existingProc = procedures.find(p => p.procedureId?.toString() === procedure.procedureId?.toString())
          if (existingProc) {
            proceduresToAdd.push({
              procedureId: procedure.procedureId?.toString() || "",
              notes: procedure.notes || "",
              complications: procedure.complications || "",
              alreadySaved: true, // Mark as already saved since it's from existing procedure
            })
          }
        })

        if (proceduresToAdd.length > 0) {
          console.log('✅ Prepopulating', proceduresToAdd.length, 'procedures')
          setTimeout(() => {
            proceduresToAdd.forEach(proc => appendProcedure(proc))
          }, 300)
        }
      }
    }

    // Prepopulate Orders/Consumables
    if (patientOrders.length > 0 && consumables.length > 0) {
      const encounterOrders = patientOrders.filter((invoice: any) => {
        const invoiceDateStr = format(new Date(invoice.invoiceDate), 'yyyy-MM-dd')
        const hasConsumablesNote = invoice.notes && invoice.notes.toLowerCase().includes('consumables ordered')
        return invoiceDateStr === encounterDateStr && hasConsumablesNote && invoice.items && invoice.items.length > 0
      })

      if (encounterOrders.length > 0) {
        const ordersToAdd: any[] = []
        encounterOrders.forEach((invoice: any) => {
          invoice.items.forEach((item: any) => {
            const consumable = consumables.find((c: any) => c.chargeId?.toString() === item.chargeId?.toString())
            if (consumable && item.chargeId) {
              ordersToAdd.push({
                chargeId: item.chargeId?.toString() || "",
                quantity: item.quantity || 1,
                notes: item.notes || "",
                alreadySaved: true, // Mark as already saved since it's from existing invoice
              })
            }
          })
        })

        if (ordersToAdd.length > 0) {
          console.log('✅ Prepopulating', ordersToAdd.length, 'orders')
          setTimeout(() => {
            ordersToAdd.forEach(order => appendOrder(order))
          }, 400)
        }
      }
    }
  }, [patientLabResults, patientMedications, patientProcedures, patientOrders, patientHistory, open, patientId, appendLabTest, appendMedication, appendProcedure, appendOrder, form, procedures, consumables])

  const loadData = async () => {
    // Prevent multiple simultaneous calls
    if (isLoadingData) {
      console.log('⏸️ [ENCOUNTER FORM] loadData already in progress, skipping...')
      return
    }

    console.log('📋 [ENCOUNTER FORM] Starting loadData...')

    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.warn('⚠️ [ENCOUNTER FORM] loadData timeout after 30s - clearing loading state')
      setLoading(false)
      setIsLoadingData(false)
      setError('Loading is taking longer than expected. Please try again.')
    }, 30000) // 30 second timeout

    try {
      setIsLoadingData(true)
      setLoading(true)
      setError(null)
      const [doctorsData, testTypesData, medicationsData, proceduresData, consumablesData] = await Promise.all([
        doctorsApi.getAll(),
        laboratoryApi.getTestTypes(),
        pharmacyApi.getMedications(undefined, 1, 1000), // Get all medications for lookup
        proceduresApi.getAll(undefined, undefined, true), // Get active procedures
        serviceChargeApi.getAll(undefined, undefined, undefined, undefined, 'Consumable'), // Get consumables
      ])

      // Clear timeout if data loads successfully
      clearTimeout(timeoutId)
      setDoctors(doctorsData)
      setTestTypes(testTypesData)
      setMedications(medicationsData)
      setProcedures(proceduresData || [])
      setConsumables(consumablesData || [])

      // Auto-fill doctor field with logged-in user if they are a doctor
      // Do this in a try-catch to prevent form.setValue from blocking loading state
      try {
        if (user?.id && doctorsData.length > 0 && !initialDoctorId) {
          const currentUserAsDoctor = doctorsData.find((doctor: any) =>
            doctor.userId?.toString() === user.id.toString() ||
            doctor.id?.toString() === user.id.toString()
          )

          if (currentUserAsDoctor) {
            const doctorId = currentUserAsDoctor.userId?.toString() || currentUserAsDoctor.id?.toString()
            if (doctorId) {
              form.setValue('doctorId', doctorId)
              console.log('✅ Auto-filled doctor field with logged-in user:', user.name || user.username)
            }
          }
        }
      } catch (formError) {
        console.error('Error auto-filling doctor field:', formError)
        // Don't block loading state if form.setValue fails
      }

      // Load inventory data in background (non-blocking)
      // Don't await it so it doesn't block the main loading indicator
      loadInventoryData().catch((error) => {
        console.error("Error loading inventory data (non-blocking):", error)
        // Don't set error state for inventory loading failures as it's not critical
      })

      console.log('✅ [ENCOUNTER FORM] loadData completed successfully')
    } catch (err: any) {
      clearTimeout(timeoutId)
      setError(err.message || 'Failed to load data')
      console.error('❌ [ENCOUNTER FORM] Error loading form data:', err)
      // Clear loading states immediately on error
      setLoading(false)
      setIsLoadingData(false)
    } finally {
      // Always clear loading state, even if there was an error
      clearTimeout(timeoutId)
      console.log('🔄 [ENCOUNTER FORM] Clearing loadData loading states')
      setLoading(false)
      setIsLoadingData(false)
    }
  }

  const loadPatientData = async (id: string) => {
    // Prevent multiple simultaneous calls
    if (isLoadingPatientData) {
      console.log('⏸️ [ENCOUNTER FORM] loadPatientData already in progress, skipping...')
      return
    }

    console.log('📋 [ENCOUNTER FORM] Starting loadPatientData for patient:', id)

    try {
      setIsLoadingPatientData(true)
      setLoadingPatientData(true)
      const [patient, allergies, prescriptions, labOrders, records, vitals, procedures, invoices] = await Promise.all([
        patientApi.getById(id).catch(() => null),
        patientApi.getAllergies(id).catch(() => []),
        pharmacyApi.getPrescriptions(id, undefined, 1, 10).catch(() => []),
        laboratoryApi.getOrders(id, undefined, 1, 10).catch(() => []),
        medicalRecordsApi.getAll(undefined, id, undefined, undefined, undefined, 1, 10).catch(() => []),
        patientApi.getVitals(id, true).catch(() => []),
        proceduresApi.getPatientProcedures(id).catch(() => []),
        billingApi.getInvoices(id).catch(() => []), // Get all invoices for the patient
      ])

      // Only fetch full order details for pending/in-progress orders that don't have items
      // Limit to first 5 to avoid excessive API calls
      const pendingLabOrders = (labOrders || []).filter((order: any) =>
        (order.status === 'pending' || order.status === 'sample_collected' || order.status === 'in_progress') &&
        (!order.items || order.items.length === 0)
      ).slice(0, 5) // Limit to 5 to prevent too many API calls

      const labOrdersWithItems = await Promise.all(
        (labOrders || []).map(async (order: any) => {
          // Only fetch details for pending/in-progress orders that need it
          if (pendingLabOrders.some(po => po.orderId === order.orderId)) {
            try {
              const fullOrder = await laboratoryApi.getOrder(order.orderId.toString())
              return fullOrder || order
            } catch (err) {
              console.error(`Error fetching order ${order.orderId} details:`, err)
              return order
            }
          }
          return order
        })
      )

      // Only fetch full prescription details for today's prescriptions or pending ones without items
      // Limit to first 5 to avoid excessive API calls
      const todayStr = format(new Date(), 'yyyy-MM-dd')
      const prescriptionsNeedingDetails = (prescriptions || []).filter((prescription: any) => {
        const prescriptionDateStr = format(new Date(prescription.prescriptionDate), 'yyyy-MM-dd')
        return ((!prescription.items || prescription.items.length === 0) || prescriptionDateStr === todayStr)
      }).slice(0, 5) // Limit to 5 to prevent too many API calls

      const prescriptionsWithItems = await Promise.all(
        (prescriptions || []).map(async (prescription: any) => {
          // Only fetch details for prescriptions that need it
          if (prescriptionsNeedingDetails.some(p => p.prescriptionId === prescription.prescriptionId)) {
            try {
              const fullPrescription = await pharmacyApi.getPrescription(prescription.prescriptionId.toString())
              return fullPrescription || prescription
            } catch (err) {
              console.error(`Error fetching prescription ${prescription.prescriptionId} details:`, err)
              return prescription
            }
          }
          return prescription
        })
      )

      // Only fetch invoice details for invoices that might contain consumables/orders
      // Limit to first 3 to avoid excessive API calls
      let consumablesInvoices: any[] = []
      if (invoices && invoices.length > 0) {
        // Filter invoices that have notes containing "Consumables ordered"
        const potentialConsumableInvoices = invoices
          .filter((invoice: any) => {
            return invoice.notes && invoice.notes.toLowerCase().includes('consumables ordered')
          })
          .slice(0, 3) // Limit to 3 to prevent too many API calls

        // Fetch full invoice details (including items) for these invoices
        if (potentialConsumableInvoices.length > 0) {
          const invoicesWithItems = await Promise.all(
            potentialConsumableInvoices.map(async (invoice: any) => {
              try {
                const fullInvoice = await billingApi.getInvoiceById(invoice.invoiceId.toString())
                return fullInvoice || invoice
              } catch (err) {
                console.error(`Error fetching invoice ${invoice.invoiceId} details:`, err)
                return invoice
              }
            })
          )

          consumablesInvoices = invoicesWithItems.filter(inv => inv && inv.items && inv.items.length > 0)
        }
      }

      setPatientData(patient)
      setPatientAllergies(allergies || [])
      setPatientMedications(prescriptionsWithItems || [])
      setPatientLabResults(labOrdersWithItems || [])
      setPatientProcedures(procedures || [])
      setPatientOrders(consumablesInvoices || [])
      setPatientHistory(records || [])
      setPatientVitals(vitals || [])
      // Get today's most recent vitals (no need to check critical vitals here)
      // Critical vitals are already checked:
      // 1. When vitals are entered (triage form)
      // 2. When lab results are received (lab results processing)
      // 3. By the global critical alerts scanner
      // We just display existing notifications in the banner - no API calls needed
      if (vitals && vitals.length > 0) {
        setTodayVitals(vitals[0])
      } else {
        setTodayVitals(null)
      }

      console.log('✅ [ENCOUNTER FORM] loadPatientData completed for patient:', id)
    } catch (err: any) {
      console.error('❌ [ENCOUNTER FORM] Error loading patient data:', err)
    } finally {
      console.log('🔄 [ENCOUNTER FORM] Clearing loadPatientData loading states for patient:', id)
      setLoadingPatientData(false)
      setIsLoadingPatientData(false)
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

      // Debug: Log form data before processing
      console.log('📋 Form submission data:', {
        medications: data.medications?.length || 0,
        labTests: data.labTests?.length || 0,
        procedures: data.procedures?.length || 0,
        orders: data.orders?.length || 0,
        medicationDetails: data.medications?.map((m: any) => ({ medicationId: m.medicationId, alreadySaved: m.alreadySaved })),
        labTestDetails: data.labTests?.map((t: any) => ({ testTypeId: t.testTypeId, alreadySaved: t.alreadySaved })),
        procedureDetails: data.procedures?.map((p: any) => ({ procedureId: p.procedureId, alreadySaved: p.alreadySaved })),
        orderDetails: data.orders?.map((o: any) => ({ chargeId: o.chargeId, alreadySaved: o.alreadySaved })),
      })

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
        outcome: data.outcome || null,
        prescription: null, // Will be handled separately
        notes: data.notes || null,
      }

      const medicalRecord = await medicalRecordsApi.create(medicalRecordData)

      // 2. Create prescription if medications exist (only unsaved ones)
      const unsavedMedications = data.medications?.filter((med: any) => !med.alreadySaved) || []
      if (unsavedMedications.length > 0) {
        const items = unsavedMedications.map((med) => {
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

        const prescriptionResult = await pharmacyApi.createPrescription(prescriptionData)
        console.log('✅ Prescription created:', prescriptionResult)
      } else {
        console.log('⏭️ Skipping prescription creation - no unsaved medications')
      }

      // 3. Create lab test orders if any (only unsaved ones)
      const unsavedLabTests = data.labTests?.filter((test: any) => !test.alreadySaved) || []
      console.log('🧪 Saving lab tests:', { total: data.labTests?.length || 0, unsaved: unsavedLabTests.length })
      if (unsavedLabTests.length > 0) {
        // Group tests by priority - create one order per priority level
        const testsByPriority = unsavedLabTests.reduce((acc: any, test: any) => {
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
          console.log('✅ Lab order created:', createdOrder)
          createdOrders.push({ order: createdOrder, tests: testList })
        }
        // Note: Invoice creation and cashier queue addition are handled automatically by the API route
        // No need to create invoice here - it's done in api/routes/laboratoryRoutes.js
      } else {
        console.log('⏭️ Skipping lab test creation - no unsaved lab tests')
      }

      // 4. Create patient procedures if any (only unsaved ones)
      const unsavedProcedures = data.procedures?.filter((proc: any) => !proc.alreadySaved) || []
      console.log('🏥 Saving procedures:', { total: data.procedures?.length || 0, unsaved: unsavedProcedures.length })
      if (unsavedProcedures.length > 0) {
        const procedurePromises = unsavedProcedures.map((procedure: any) => {
          const procedureData = {
            patientId: parseInt(data.patientId),
            procedureId: parseInt(procedure.procedureId),
            procedureDate: format(data.encounterDate, 'yyyy-MM-dd'),
            performedBy: parseInt(data.doctorId),
            notes: procedure.notes || null,
            complications: procedure.complications || null,
          }
           return proceduresApi.createPatientProcedure(procedureData)
        })
        const procedureResults = await Promise.all(procedurePromises)
        console.log('✅ Procedures created:', procedureResults.length)
        // Note: Invoice creation and cashier queue addition are handled automatically by the API route
        // No need to create invoice here - it's done in api/routes/proceduresRoutes.js
      } else {
        console.log('⏭️ Skipping procedure creation - no unsaved procedures')
      }

      // 5. Create orders/consumables invoice if any (only unsaved ones)
      const unsavedOrders = data.orders?.filter((order: any) => !order.alreadySaved) || []
      console.log('📦 Saving orders:', { total: data.orders?.length || 0, unsaved: unsavedOrders.length })
      if (unsavedOrders.length > 0) {
        const orderInvoiceItems = unsavedOrders.map((order: any) => {
          const consumable = consumables.find((c: any) => c.chargeId?.toString() === order.chargeId)
          const unitPrice = consumable?.cost ? parseFloat(consumable.cost) : 0
          const quantity = order.quantity || 1
          const totalPrice = unitPrice * quantity
          const itemName = consumable?.name || 'Consumable'

          return {
            description: itemName,
            quantity: quantity,
            unitPrice: unitPrice,
            totalPrice: totalPrice,
            chargeId: consumable?.chargeId || null,
          }
        }).filter(item => item.unitPrice > 0)

        if (orderInvoiceItems.length > 0) {
          const totalAmount = orderInvoiceItems.reduce((sum: number, item: any) => sum + item.totalPrice, 0)

          const invoiceData = {
            patientId: parseInt(data.patientId),
            invoiceDate: format(data.encounterDate, 'yyyy-MM-dd'),
            dueDate: format(new Date(data.encounterDate.getTime() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
            status: 'pending',
            items: orderInvoiceItems,
            notes: `Consumables ordered during encounter on ${format(data.encounterDate, 'PPP')}.`,
          }

          const invoiceResult = await billingApi.createInvoice(invoiceData)
          console.log('✅ Invoice created for orders:', invoiceResult)

          // Add patient to cashier queue for consumables payment (check for duplicates first)
          try {
            await queueApi.create({
              patientId: parseInt(data.patientId),
              servicePoint: 'cashier',
              priority: 'normal',
              notes: `Consumables payment - Encounter: ${format(data.encounterDate, 'PPP')}`
            })
          } catch (queueError: any) {
            // Queue API already handles duplicate checking, so if it fails it's likely a duplicate
            // Don't fail the encounter save if queue addition fails
            console.log('Queue entry for consumables:', queueError?.response?.isDuplicate ? 'Patient already in queue' : queueError.message)
          }
        }
      } else {
        console.log('⏭️ Skipping order creation - no unsaved orders')
      }

      // 6. Create next appointment if outcome is "Follow-up Scheduled" and appointment details are provided
      if (data.outcome === "Follow-up Scheduled" && data.nextAppointmentDate && data.nextAppointmentTime) {
        try {
          const appointmentData = {
            patientId: parseInt(data.patientId),
            doctorId: data.nextAppointmentDoctorId ? parseInt(data.nextAppointmentDoctorId) : (data.doctorId ? parseInt(data.doctorId) : null),
            appointmentDate: format(data.nextAppointmentDate, "yyyy-MM-dd"),
            appointmentTime: data.nextAppointmentTime,
            department: data.nextAppointmentDepartment || data.department || null,
            reason: data.nextAppointmentReason || `Follow-up from encounter on ${format(data.encounterDate, 'PPP')}`,
            status: "scheduled",
            notes: `Follow-up appointment scheduled during encounter on ${format(data.encounterDate, 'PPP')}. ${data.diagnosis ? `Diagnosis: ${data.diagnosis.substring(0, 200)}` : ''}`,
          }

          await appointmentsApi.create(appointmentData)
        } catch (error: any) {
          console.error("Error creating follow-up appointment:", error)
          // Don't fail the entire encounter save if appointment creation fails
          // Just log the error - the encounter is already saved successfully
          toast({
            title: "Warning",
            description: "Encounter saved successfully, but failed to create follow-up appointment. You may need to create it manually.",
            variant: "destructive",
          })
        }
      }

      // Clear draft after successful submission
      clearDraftFromStorage(form.getValues('patientId'))
      setHasUnsavedChanges(false)

      // Note: Critical vitals are NOT checked in this form
      // Critical alerts are checked:
      // 1. When vitals are entered (triage form)
      // 2. When lab results are received (lab results processing)
      // 3. By the global critical alerts scanner
      // We only display existing notifications here - no API calls needed

      // Show success message
      toast({
        title: "Encounter Saved",
        description: "Patient encounter has been saved successfully.",
      })

      if (onSuccess) {
        onSuccess()
      }

      // Clear loading states before closing
      setLoadingPatientData(false)
      setIsLoadingPatientData(false)
      setLoading(false)
      setIsLoadingData(false)

      onOpenChange(false)
      form.reset()
    } catch (err: any) {
      setError(err.message || 'Failed to save encounter')
      console.error('❌ Error saving encounter:', err)
      console.error('Error details:', {
        message: err.message,
        stack: err.stack,
        response: err.response,
      })

      // Clear all loading states on error
      setIsSubmitting(false)
      setLoadingPatientData(false)
      setIsLoadingPatientData(false)
      setLoading(false)
      setIsLoadingData(false)

      toast({
        title: "Error Saving Encounter",
        description: err.message || 'Failed to save encounter. Please try again.',
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
      // Ensure loading states are cleared
      setLoadingPatientData(false)
      setIsLoadingPatientData(false)
    }
  }


  const loadEncounterSideEffects = async (patientId: string) => {
  if (!patientId) return

  try {
    // 1. Prescriptions
    const prescriptions = await pharmacyApi.getPatientPrescriptions(patientId, {
      activeOnly: true,
    })

    setPrescriptions(
      prescriptions.map((p: any) => ({
        prescriptionId: p.prescriptionId,
        items: p.items,
        status: p.status,
        date: p.prescriptionDate,
      }))
    )

    // 2. Lab orders
    const labOrders = await laboratoryApi.getPatientOrders(patientId)

    setLabTests(
      labOrders.flatMap((order: any) =>
        order.items.map((item: any) => ({
          orderId: order.orderId,
          testTypeId: item.testTypeId.toString(),
          priority: order.priority,
          clinicalIndication: item.notes,
          status: order.status,
        }))
      )
    )

    // 3. Procedures
    const procedures = await proceduresApi.getPatientProcedures(patientId)

    setProcedures(
      procedures.map((proc: any) => ({
        procedureId: proc.procedureId.toString(),
        notes: proc.notes,
        complications: proc.complications,
        date: proc.procedureDate,
      }))
    )

    // 4. Consumables / Orders
    const invoices = await billingApi.getPatientInvoices(patientId, {
      type: 'consumables',
    })

    setOrders(
      invoices.flatMap((inv: any) =>
        inv.items.map((item: any) => ({
          chargeId: item.chargeId?.toString(),
          quantity: item.quantity,
          description: item.description,
        }))
      )
    )
  } catch (err) {
    console.error('Error loading encounter side-effects:', err)
  }
}

  // Draft management functions
 const saveDraftToStorage = (data) => {
  if (typeof window === 'undefined') return
  if (!data?.patientId) return

  const key = getStorageKey(data.patientId)
  if (!key) return

  try {
    const payload = {
      data: {
        ...data,
        encounterDate:
          data.encounterDate instanceof Date
            ? data.encounterDate.toISOString()
            : data.encounterDate,
      },
      savedAt: Date.now(),
    }

    localStorage.setItem(key, JSON.stringify(payload))
  } catch (error) {
    console.error('Error saving draft to localStorage:', error)
  }
}

const loadDraftFromStorage = (patientId) => {
  if (typeof window === 'undefined') return null
  if (!patientId) return null

  const key = getStorageKey(patientId)
  if (!key) return null

  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null

    const parsed = JSON.parse(raw)
    const { data, savedAt } = parsed || {}

    // Expired → delete automatically
    if (!savedAt || Date.now() - savedAt > DRAFT_TTL_MS) {
      localStorage.removeItem(key)
      return null
    }

    return data || null
  } catch (error) {
    console.error('Error loading draft from localStorage:', error)
    return null
  }
}

//let intcurrentPid=form.getValues("patientId");
const clearDraftFromStorage = (patientId:any) => {
  if (typeof window === 'undefined') return
  if (!patientId) return

  const key = getStorageKey(patientId)
  if (!key) return

  try {
    localStorage.removeItem(key)
  } catch (error) {
    console.error('Error clearing draft from localStorage:', error)
  }
}

  const handleDialogClose = (newOpenState: boolean) => {
    // If trying to close and there are unsaved changes, show confirmation but keep dialog open
    if (!newOpenState && hasUnsavedChanges) {
      setShowCloseConfirm(true)
      // Don't call onOpenChange(false) - keep the dialog open until user confirms
      return
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
    clearDraftFromStorage(form.getValues("patientId"))
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

  // Fetch missing medications when form data changes - debounced to prevent excessive calls
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

      // Only fetch if there are missing medications (limit to 10 to prevent excessive calls)
      if (missingIds.length > 0 && missingIds.length <= 10) {
        try {
          const fetchedMeds = await Promise.all(
            missingIds.slice(0, 10).map((id: string) => pharmacyApi.getMedication(id).catch(() => null))
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

    // Use a longer delay to avoid too many calls (increased from 500ms to 1000ms)
    const timer = setTimeout(fetchMissingMedications, 1000)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [medicationFields.length, open]) // Removed medications.length to prevent loop

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

    // Check if medication is already in the current form
    const currentMeds = form.watch("medications") || []
    const isInCurrentForm = currentMeds.some((med: any, index: number) =>
      med.medicationId === medicationId &&
      (editingMedicationIndex === null || index !== editingMedicationIndex)
    )

    if (isInCurrentForm) return true

    // Also check if patient has a pending prescription for this medication
    return isMedicationAlreadyPrescribed(medicationId)
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
    // Don't filter out the currently selected test in tempLabTest (when adding new test)
    // This allows the user to keep their selection even if it would normally be filtered
    const currentlySelectedId = editingLabTestIndex === null ? tempLabTest.testTypeId : null
    return testTypes.filter(test => {
      const testIdStr = test.testTypeId.toString()
      // Include the test if it's not used, OR if it's the currently selected one (when adding)
      return !usedTestTypeIds.has(testIdStr) || (currentlySelectedId && testIdStr === currentlySelectedId)
    })
  }

  const isTestTypeAlreadyAdded = (testTypeId: string) => {
    if (!testTypeId) return false

    // Check if test is already in the current form
    const currentTests = form.watch("labTests") || []
    const isInCurrentForm = currentTests.some((test: any, index: number) =>
      test.testTypeId === testTypeId &&
      (editingLabTestIndex === null || index !== editingLabTestIndex)
    )

    if (isInCurrentForm) return true

    // Check if patient has an existing order for this test type that hasn't been resulted yet
    // Only block if the test has not been completed or has no results
    if (patientId && patientLabResults.length > 0) {
      const hasUnresultedTest = patientLabResults.some((order: any) => {
        // Check if order contains this test type
        if (order.items && order.items.length > 0) {
          const testItem = order.items.find((item: any) =>
            item.testTypeId?.toString() === testTypeId ||
            item.testType?.testTypeId?.toString() === testTypeId
          )

          if (testItem) {
            // Check if test is still pending/in-progress (not resulted)
            const isNotResulted = order.status === 'pending' ||
                                 order.status === 'sample_collected' ||
                                 order.status === 'in_progress'

            // If test is completed, check if it has results
            if (order.status === 'completed') {
              // Check if test item has results
              const hasResults = testItem.results && testItem.results.length > 0
              // Only block if completed but no results yet
              return !hasResults
            }

            // Block if pending/in-progress (no results yet)
            return isNotResulted
          }
        }
        return false
      })
      return hasUnresultedTest
    }

    return false
  }

  const isMedicationAlreadyPrescribed = (medicationId: string) => {
    if (!medicationId || !patientId) return false

    // Check if patient has a pending/non-dispensed prescription for this medication
    if (patientMedications.length > 0) {
      const hasPendingPrescription = patientMedications.some((prescription: any) => {
        // Check if prescription is pending (not dispensed)
        const isPending = prescription.status === 'pending' || prescription.status === 'active'

        if (isPending && prescription.items && prescription.items.length > 0) {
          // Check if any item in this prescription matches the medication
          return prescription.items.some((item: any) => {
            const itemMedicationId = item.medicationId?.toString() || item.medication?.medicationId?.toString()
            // Also check if item is not yet dispensed
            const isNotDispensed = item.status === 'pending' || !item.dispensed
            return itemMedicationId === medicationId && isNotDispensed
          })
        }
        return false
      })
      return hasPendingPrescription
    }

    return false
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
            {patientMedications.filter((p: any) => p.items && p.items.length > 0).length > 0 ? (
              <div className="space-y-1.5">
                {patientMedications
                  .filter((prescription: any) => prescription.items && prescription.items.length > 0)
                  .slice(0, 5)
                  .map((prescription: any) => (
                  <div key={prescription.prescriptionId} className="border-l-2 border-l-primary/30 bg-muted/30 rounded-md p-2.5 text-xs">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0 space-y-0.5">
                        <div className="font-medium text-foreground truncate">
                          {prescription.items[0]?.medicationName || prescription.items[0]?.medicationNameFromCatalog || 'Medication'}
                        </div>
                        <div className="text-foreground/70 text-[11px]">
                          {prescription.items[0]?.dosage} • {prescription.items[0]?.frequency}
                          {prescription.items[0]?.duration && ` • ${prescription.items[0]?.duration}`}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <Badge variant={prescription.status === 'completed' || prescription.status === 'dispensed' ? 'default' : 'secondary'} className="text-[10px] px-1.5 py-0 h-4">
                          {prescription.status}
                        </Badge>
                        <span className="text-foreground/60 text-[10px] whitespace-nowrap">
                          {new Date(prescription.prescriptionDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
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

          {/* Recent Diagnoses & Symptoms */}
          {patientHistory.filter((r: any) => r.diagnosis).length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <FileText className="h-4 w-4 text-purple-500" />
                Recent Diagnoses
              </h3>
              <div className="space-y-1.5">
                {patientHistory
                  .filter((record: any) => record.diagnosis)
                  .slice(0, 3)
                  .map((record: any) => (
                    <div key={record.recordId} className="border-l-2 border-l-purple-500/30 bg-muted/30 rounded-md p-2.5 text-xs">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0 space-y-0.5">
                          <div className="font-medium text-foreground line-clamp-2">
                            {record.diagnosis}
                          </div>
                          {record.chiefComplaint && (
                            <div className="text-foreground/60 text-[10px] line-clamp-1">
                              CC: {record.chiefComplaint}
                            </div>
                          )}
                        </div>
                        <span className="text-foreground/60 text-[10px] whitespace-nowrap flex-shrink-0">
                          {new Date(record.visitDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Recent Lab Results */}
          <div>
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Flask className="h-4 w-4 text-blue-500" />
              Recent Lab Results
            </h3>
            {patientLabResults.length > 0 ? (
              <div className="space-y-1.5">
                {patientLabResults.slice(0, 5).map((order: any) => (
                  <div key={order.orderId} className="border-l-2 border-l-blue-500/30 bg-muted/30 rounded-md p-2.5 text-xs">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0 space-y-0.5">
                        <div className="font-medium text-foreground">
                          Order #{order.orderNumber || order.orderId}
                        </div>
                        <div className="text-foreground/70 text-[11px]">
                          {order.items?.length || 0} test(s) • Priority: <span className="font-medium">{order.priority}</span>
                          {order.items && order.items.length > 0 && (
                            <> • {order.items.slice(0, 2).map((item: any) => item.testName || item.testType?.testName || item.testTypeName).join(', ')}
                            {order.items.length > 2 && ` +${order.items.length - 2} more`}</>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <Badge variant={order.status === 'completed' ? 'default' : 'secondary'} className="text-[10px] px-1.5 py-0 h-4">
                          {order.status}
                        </Badge>
                        <span className="text-foreground/60 text-[10px] whitespace-nowrap">
                          {new Date(order.orderDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-foreground/60 bg-muted/30 rounded-md p-2.5 text-center">
                No recent lab results
              </div>
            )}
          </div>
        </div>
      </ScrollArea>
    )
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-[95vw] max-w-[95vw] h-[95vh] max-h-[95vh] overflow-hidden flex flex-col p-0">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col overflow-hidden min-h-0">
              {/* Combined Compact Header - Title, Patient Info, Visit Type/Dept, Date, Doctor */}
              <div className="px-4 py-2 border-b bg-primary/5 flex-shrink-0 sticky top-0 z-10">
                <div className="flex items-center justify-between gap-3">
                  {/* Left: Title and Patient Info */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {(() => {
                      const visitType = form.watch("visitType") || "Outpatient"
                      const encounterTitle = visitType === "Inpatient"
                        ? "Inpatient Encounter"
                        : visitType === "Emergency"
                        ? "Emergency Encounter"
                        : "Patient Encounter"
                      return (
                        <div className="font-semibold text-sm text-foreground/80 whitespace-nowrap">{encounterTitle}</div>
                      )
                    })()}
                    {patientId && patientData ? (
                      <>
                        <Separator orientation="vertical" className="h-4" />
                        <div className="rounded-full bg-primary/10 p-1 flex-shrink-0">
                          <User className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className="font-semibold text-sm truncate">{getPatientName(patientData)}</div>
                          <Separator orientation="vertical" className="h-3" />
                          <div className="text-xs text-muted-foreground flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono">{patientData.patientNumber || `ID: ${patientId}`}</span>
                            {patientData.gender && (
                              <>
                                <span className="text-muted-foreground/40">•</span>
                                <span>{patientData.gender}</span>
                              </>
                            )}
                            {patientData.dateOfBirth && (() => {
                              const dob = new Date(patientData.dateOfBirth)
                              const today = new Date()
                              const age = today.getFullYear() - dob.getFullYear() - (today.getMonth() < dob.getMonth() || (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate()) ? 1 : 0)
                              return age > 0 ? (
                                <>
                                  <span className="text-muted-foreground/40">•</span>
                                  <span>{age}y</span>
                                </>
                              ) : null
                            })()}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="flex-1">
                        <FormField
                          control={form.control}
                          name="patientId"
                          render={({ field }) => (
                            <FormItem className="mb-0">
                              <FormControl>
                                <PatientCombobox
                                  value={field.value}
                                  onValueChange={(value) => {
                                    field.onChange(value)
                                  }}
                                  placeholder="Select patient..."
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}

                    {/* Visit Type and Department Display */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <FormField
                        control={form.control}
                        name="visitType"
                        render={({ field }) => (
                          <Badge variant={field.value === "Inpatient" ? "default" : field.value === "Emergency" ? "destructive" : "secondary"} className="text-xs font-normal">
                            {field.value || "Outpatient"}
                          </Badge>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="department"
                        render={({ field }) => (
                          field.value ? (
                            <Badge variant="outline" className="text-xs font-normal">
                              {field.value}
                            </Badge>
                          ) : null
                        )}
                      />
                    </div>
                  </div>

                  {/* Right: Encounter Date and Doctor */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <FormField
                      control={form.control}
                      name="encounterDate"
                      render={({ field }) => (
                        <FormItem className="w-[140px] mb-0">
                          <FormControl>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  type="button"
                                  className="w-full justify-start text-left font-normal h-8 text-xs px-2"
                                >
                                  <CalendarIcon className="mr-1.5 h-3 w-3" />
                                  {field.value ? format(field.value, "MMM d, yyyy") : "Date"}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="end">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Separator orientation="vertical" className="h-5" />

                    <FormField
                      control={form.control}
                      name="doctorId"
                      render={({ field }) => (
                        <FormItem className="w-[160px] mb-0">
                          <FormControl>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value || ""}
                              disabled={!!initialDoctorId}
                            >
                              <SelectTrigger className="h-8 text-xs px-2">
                                <SelectValue placeholder="Doctor..." />
                              </SelectTrigger>
                              <SelectContent>
                                {doctors.map((doctor) => (
                                  <SelectItem key={doctor.userId} value={doctor.userId.toString()}>
                                    {getDoctorName(doctor)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {loadingPatientData && (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground flex-shrink-0" />
                    )}
                  </div>
                </div>
              </div>

          {/* Critical Alerts Banner for Current Patient */}
          {(() => {
            // Normalize patientId to string for comparison
            const currentPatientId = patientId ? String(patientId).trim() : null

            if (!currentPatientId) {
              return null
            }

            // Find matching notifications - compare as strings (no debug logging to prevent spam)
            const patientNotifications = notifications.filter(n => {
              const notificationPatientId = String(n.patientId).trim()
              return notificationPatientId === currentPatientId
            })

            if (patientNotifications.length === 0) {
              return null
            }

            const patientAlert = patientNotifications[0]
            const criticalAlerts = patientAlert.alerts.filter(a => a.severity === 'critical')
            const urgentAlerts = patientAlert.alerts.filter(a => a.severity === 'urgent')

            return (
              <div className="mx-6 mt-4 mb-0 border-2 border-red-500 bg-red-50 dark:bg-red-950/20 rounded-lg p-4 flex-shrink-0">
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-red-600 dark:bg-red-700 p-2 flex-shrink-0">
                    <AlertTriangle className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-red-900 dark:text-red-100 mb-1">
                      ⚠️ CRITICAL ALERTS DETECTED
                    </div>
                    <div className="text-sm text-red-800 dark:text-red-200 mb-2">
                      This patient has {criticalAlerts.length} critical and {urgentAlerts.length} urgent alert{patientAlert.alerts.length > 1 ? 's' : ''}
                    </div>
                    <div className="space-y-1.5">
                      {patientAlert.alerts.slice(0, 3).map((alert, idx) => (
                        <div key={idx} className="text-xs bg-white dark:bg-red-900/30 p-2 rounded border border-red-200 dark:border-red-800">
                          <span className="font-semibold">{alert.parameter}:</span> {alert.value} {alert.unit}
                          {alert.range && <span className="text-red-600 dark:text-red-400"> ({alert.range})</span>}
                          <Badge variant={alert.severity === 'critical' ? 'destructive' : 'secondary'} className="ml-2 text-xs">
                            {alert.severity}
                          </Badge>
                        </div>
                      ))}
                      {patientAlert.alerts.length > 3 && (
                        <div className="text-xs text-red-700 dark:text-red-300 italic">
                          +{patientAlert.alerts.length - 3} more alert{patientAlert.alerts.length - 3 > 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
            })()}

              <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                {error && (
                  <div className="mx-6 mt-4 p-3 text-sm text-red-500 bg-red-50 rounded-md flex-shrink-0">
                    {error}
                  </div>
                )}
                {(loading || isLoadingData) && (
                  <div className="flex items-center justify-center py-4 flex-shrink-0">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-sm text-muted-foreground">Loading data...</span>
                  </div>
                )}
                {/* Tabs Container - Moved to Top */}
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
                  } else if (value === "procedures") {
                    setProceduresSheetOpen(true)
                    setActiveTab("encounter") // Keep encounter tab active
                  } else if (value === "orders") {
                    setOrdersSheetOpen(true)
                    setActiveTab("encounter") // Keep encounter tab active
                  } else {
                    setActiveTab(value)
                  }
                }} className="flex-1 flex flex-col overflow-hidden min-h-0">
                  {/* Sticky Tabs Navigation - Compact */}
                  <div className="px-4 py-1.5 border-b bg-background flex-shrink-0">
                    <TabsList className="grid w-full grid-cols-8 h-auto gap-1">
                      <TabsTrigger value="encounter" className="py-1.5 h-auto text-xs">
                        <FileText className="h-3 w-3 mr-1" />
                        <span>Encounter</span>
                      </TabsTrigger>
                      <TabsTrigger value="symptoms" className="py-1.5 h-auto text-xs">
                        <Activity className="h-3 w-3 mr-1" />
                        <span>Symptoms</span>
                      </TabsTrigger>
                      <TabsTrigger value="diagnosis" className="py-1.5 h-auto text-xs">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        <span>Diagnosis</span>
                      </TabsTrigger>
                      <TabsTrigger value="lab" className="py-1.5 h-auto text-xs">
                        <Flask className="h-3 w-3 mr-1" />
                        <span>Lab Tests</span>
                      </TabsTrigger>
                      <TabsTrigger value="prescription" className="py-1.5 h-auto text-xs">
                        <Pills className="h-3 w-3 mr-1" />
                        <span>Prescription</span>
                      </TabsTrigger>
                      <TabsTrigger value="procedures" className="py-1.5 h-auto text-xs" onClick={() => {
                        setProceduresSheetOpen(true)
                        setActiveTab("encounter") // Keep encounter tab active
                      }}>
                        <Stethoscope className="h-3 w-3 mr-1" />
                        <span>Procedures</span>
                      </TabsTrigger>
                      <TabsTrigger value="orders" className="py-1.5 h-auto text-xs" onClick={() => {
                        setOrdersSheetOpen(true)
                        setActiveTab("encounter") // Keep encounter tab active
                      }}>
                        <Package className="h-3 w-3 mr-1" />
                        <span>Orders</span>
                      </TabsTrigger>
                      <TabsTrigger value="history" className="py-1.5 h-auto text-xs">
                        <History className="h-3 w-3 mr-1" />
                        <span>History</span>
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  {/* Scrollable Tab Content */}
                  {/* Encounter Details Tab - Combined with Patient Summary */}
                  <TabsContent value="encounter" className="flex-1 overflow-hidden min-h-0">
                    <ScrollArea className="h-full px-6">
                      <div className="space-y-6 mt-4 pb-4">
                        {/* Patient Summary Panel */}
                        {patientId && patientData && (
                          <Card className="border-l-4 border-l-primary">
                            <CardHeader className="pb-2 pt-3">
                              <CardTitle className="text-base">Quick Summary</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-2">
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                {/* Today's Vitals */}
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-green-600" />
                                    <span className="text-sm font-semibold">Today's Vitals</span>
                                  </div>
                                  {todayVitals ? (
                                    <div className="space-y-1.5 text-xs bg-green-50 dark:bg-green-950/30 p-2 rounded-md border border-green-200 dark:border-green-800">
                                      {todayVitals.systolicBP && todayVitals.diastolicBP && (
                                        <div className="flex justify-between">
                                          <span className="text-foreground/70">BP:</span>
                                          <span className="font-semibold text-foreground">{todayVitals.systolicBP}/{todayVitals.diastolicBP} mmHg</span>
                                        </div>
                                      )}
                                      {todayVitals.heartRate && (
                                        <div className="flex justify-between">
                                          <span className="text-foreground/70">HR:</span>
                                          <span className="font-semibold text-foreground">{todayVitals.heartRate} bpm</span>
                                        </div>
                                      )}
                                      {todayVitals.temperature && (
                                        <div className="flex justify-between">
                                          <span className="text-foreground/70">Temp:</span>
                                          <span className="font-semibold text-foreground">{todayVitals.temperature}°C</span>
                                        </div>
                                      )}
                                      {todayVitals.respiratoryRate && (
                                        <div className="flex justify-between">
                                          <span className="text-foreground/70">RR:</span>
                                          <span className="font-semibold text-foreground">{todayVitals.respiratoryRate} bpm</span>
                                        </div>
                                      )}
                                      {todayVitals.oxygenSaturation && (
                                        <div className="flex justify-between">
                                          <span className="text-foreground/70">SpO2:</span>
                                          <span className="font-semibold text-foreground">{todayVitals.oxygenSaturation}%</span>
                                        </div>
                                      )}
                                      {todayVitals.weight && (
                                        <div className="flex justify-between">
                                          <span className="text-foreground/70">Weight:</span>
                                          <span className="font-semibold text-foreground">{todayVitals.weight} kg</span>
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="text-xs text-foreground/60 bg-muted p-2 rounded-md">
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
                                    <div className="space-y-1.5 bg-red-50 dark:bg-red-950/30 p-2 rounded-md border border-red-200 dark:border-red-800">
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
                                    <div className="text-xs text-foreground/60 bg-muted p-2 rounded-md">
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
                                  {patientMedications.filter((p: any) => p.items && p.items.length > 0).length > 0 ? (
                                    <div className="space-y-1.5 bg-blue-50 dark:bg-blue-950/30 p-2 rounded-md border border-blue-200 dark:border-blue-800">
                                      {patientMedications
                                        .filter((prescription: any) => prescription.items && prescription.items.length > 0)
                                        .slice(0, 3)
                                        .map((prescription: any) => (
                                        <div key={prescription.prescriptionId} className="text-xs">
                                          <div className="font-medium truncate text-foreground">
                                            {prescription.items[0]?.medicationName || prescription.items[0]?.medicationNameFromCatalog || 'Medication'}
                                          </div>
                                          <div className="text-foreground/70 text-[10px]">
                                            {prescription.status} • {new Date(prescription.prescriptionDate).toLocaleDateString()}
                                          </div>
                                        </div>
                                      ))}
                                      {patientMedications.filter((p: any) => p.items && p.items.length > 0).length > 3 && (
                                        <div className="text-xs text-foreground/70 pt-1">
                                          +{patientMedications.filter((p: any) => p.items && p.items.length > 0).length - 3} more
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

                  <TabsContent value="procedures" className="flex-1 overflow-hidden min-h-0">
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center text-muted-foreground">
                        <Stethoscope className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="text-sm">Click "Procedures" tab to open procedure recording</p>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="orders" className="flex-1 overflow-hidden min-h-0">
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center text-muted-foreground">
                        <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="text-sm">Click "Orders" tab to open consumables ordering</p>
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
              </div>

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
        </DialogContent>
      </Dialog>

      {/* Lab Tests Sheet */}
      <Sheet open={labTestsSheetOpen} onOpenChange={setLabTestsSheetOpen}>
        <SheetContent side="right" className="w-full sm:w-[90vw] sm:max-w-5xl p-0 flex flex-col overflow-hidden">
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
        <SheetContent side="right" className="w-full sm:w-[90vw] sm:max-w-5xl p-0 flex flex-col overflow-hidden">
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
                <div className="space-y-6 mt-4 pb-4">
                  {/* Chief Complaint - Most important, placed first */}
                  <FormField
                    control={form.control}
                    name="chiefComplaint"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold">Chief Complaint *</FormLabel>
                        <FormControl>
                          <ChiefComplaintCombobox
                            value={field.value || ""}
                            onChange={field.onChange}
                            placeholder="Patient's main complaint or reason for visit. Type to search ICD-10 symptoms (e.g., R51 Headache, R50.9 Fever)..."
                            disabled={false}
                          />
                        </FormControl>
                        <FormDescription>
                          The primary reason the patient is seeking medical attention. Use ICD-10 button to search symptoms.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Separator />

                  {/* Symptoms with autocomplete */}
                  <FormField
                    control={form.control}
                    name="symptoms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold">Presenting Symptoms</FormLabel>
                        <FormControl>
                          <SymptomsAutocomplete
                            value={field.value || ""}
                            onChange={field.onChange}
                            placeholder="Type symptoms or click suggestions below to add (e.g., Fever, Headache, Nausea)"
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormDescription>
                          Select or type symptoms. You can add multiple symptoms separated by commas.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Separator />

                  {/* History of Present Illness */}
                  <FormField
                    control={form.control}
                    name="historyOfPresentIllness"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold">History of Present Illness (HOPI)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Chronological narrative: When did symptoms start? How have they progressed? What makes them better or worse? Any associated symptoms? (e.g., 'Patient reports headache started 3 days ago, initially mild, now severe. Associated with nausea and photophobia. Worse in morning, better with rest.')"
                            className="min-h-[120px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Detailed chronological account: onset, progression, aggravating/relieving factors, associated symptoms
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Separator />

                  {/* Physical Examination */}
                  <FormField
                    control={form.control}
                    name="physicalExamination"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold">Physical Examination Findings</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Document objective findings systematically:
• Vital Signs: BP, HR, RR, Temp, SpO2
• General Appearance:
• HEENT:
• Cardiovascular:
• Respiratory:
• Abdominal:
• Neurological:
• Musculoskeletal:
• Skin:"
                            className="min-h-[150px] font-mono text-sm"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Document objective findings systematically by system. Use abbreviations as appropriate.
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
        <SheetContent side="right" className="w-full sm:w-[90vw] sm:max-w-5xl p-0 flex flex-col overflow-hidden">
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
                <div className="space-y-6 mt-4 pb-4">
                  {/* Diagnosis with ICD-10 autocomplete */}
                  <FormField
                    control={form.control}
                    name="diagnosis"
                    render={({ field }) => {
                      // Sync selected diagnoses with field value
                      useEffect(() => {
                        if (selectedDiagnoses.length > 0) {
                          const diagnosisText = selectedDiagnoses
                            .map((d, idx) => {
                              const prefix = idx === 0 ? "1. Primary" : idx === 1 ? "2. Secondary" : `${idx + 1}.`;
                              return d.icd10Code
                                ? `${prefix} ${d.icd10Code} - ${d.diagnosisName}`
                                : `${prefix} ${d.diagnosisName}`;
                            })
                            .join("\n");
                          field.onChange(diagnosisText);
                        }
                      }, [selectedDiagnoses, field]);

                      return (
                        <FormItem>
                          <FormLabel className="text-base font-semibold">Diagnosis *</FormLabel>
                          <FormControl>
                            <div className="space-y-3">
                              <DiagnosisCombobox
                                value=""
                                onValueChange={(value, diagnosis) => {
                                  if (diagnosis && !selectedDiagnoses.find(d => d.diagnosisId === diagnosis.diagnosisId)) {
                                    const updated = [...selectedDiagnoses, diagnosis];
                                    setSelectedDiagnoses(updated);
                                  }
                                }}
                                placeholder="Search ICD-10 diagnosis code or name..."
                                disabled={isSubmitting}
                                allowMultiple={true}
                                selectedDiagnoses={selectedDiagnoses}
                                onRemoveDiagnosis={(diagnosisId) => {
                                  setSelectedDiagnoses(prev => prev.filter(d => d.diagnosisId !== diagnosisId));
                                }}
                              />
                              {selectedDiagnoses.length === 0 && (
                                <Textarea
                                  placeholder="Or enter diagnosis manually (e.g., '1. Primary: Migraine headache\n2. Secondary: Hypertension')"
                                  className="min-h-[100px]"
                                  value={field.value || ""}
                                  onChange={field.onChange}
                                />
                              )}
                              {selectedDiagnoses.length > 0 && (
                                <div className="rounded-md border p-3 bg-muted/30">
                                  <p className="text-sm font-medium mb-2">Selected Diagnoses:</p>
                                  <div className="space-y-1">
                                    {selectedDiagnoses.map((d, idx) => {
                                      const prefix = idx === 0 ? "1. Primary" : idx === 1 ? "2. Secondary" : `${idx + 1}.`;
                                      return (
                                        <p key={d.diagnosisId} className="text-sm">
                                          <span className="font-semibold">{prefix}:</span>{" "}
                                          {d.icd10Code && (
                                            <span className="font-mono font-semibold text-primary">{d.icd10Code}</span>
                                          )}
                                          {d.icd10Code && " - "}
                                          {d.diagnosisName}
                                        </p>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          </FormControl>
                          <FormDescription>
                            Search and select from ICD-10 diagnosis codes, or enter manually. First diagnosis will be marked as Primary.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />

                  <Separator />

                  {/* Treatment Plan */}
                  <FormField
                    control={form.control}
                    name="treatment"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold">Treatment Plan</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Detailed treatment plan:
• Medications: (prescribed via Prescription tab)
• Procedures:
• Lifestyle modifications:
• Follow-up instructions:
• Patient education:
• Referrals:"
                            className="min-h-[150px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Comprehensive treatment plan including medications, procedures, lifestyle modifications, and follow-up instructions
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Separator />

                  {/* Outcome */}
                  <FormField
                    control={form.control}
                    name="outcome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold">Outcome</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select encounter outcome" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Discharged - Recovered">Discharged - Recovered</SelectItem>
                            <SelectItem value="Discharged - Improved">Discharged - Improved</SelectItem>
                            <SelectItem value="Discharged - Stable">Discharged - Stable</SelectItem>
                            <SelectItem value="Follow-up Scheduled">Follow-up Scheduled</SelectItem>
                            <SelectItem value="Admitted">Admitted</SelectItem>
                            <SelectItem value="Referred">Referred</SelectItem>
                            <SelectItem value="No Show">No Show</SelectItem>
                            <SelectItem value="Cancelled">Cancelled</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>

                        <FormDescription>
                          Select the outcome of this encounter. If "Follow-up Scheduled" is selected, you can schedule the next appointment below.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Next Appointment Details - Show when outcome is "Follow-up Scheduled" */}
                  {outcome === "Follow-up Scheduled" && (
                    <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-md border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        <h4 className="text-base font-semibold">Schedule Next Appointment</h4>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="nextAppointmentDate"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>Appointment Date *</FormLabel>
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
                                  <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="nextAppointmentTime"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Appointment Time *</FormLabel>
                              <FormControl>
                                <Input type="time" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="nextAppointmentDoctorId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Doctor (Optional)</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value || ""}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select doctor (optional)" />
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

                        <FormField
                          control={form.control}
                          name="nextAppointmentDepartment"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Department (Optional)</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., Cardiology" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="nextAppointmentReason"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Reason for Follow-up (Optional)</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Reason for follow-up appointment, review instructions, etc."
                                className="min-h-[80px]"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  <Separator />

                  {/* Additional Notes */}
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold">Additional Clinical Notes</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Any additional clinical notes, observations, patient counseling points, or special instructions"
                            className="min-h-[100px]"
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
        <SheetContent side="right" className="w-full sm:w-[90vw] sm:max-w-5xl p-0 flex flex-col overflow-hidden">
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
                        setIsQuantityManuallyEdited(false) // Reset when adding new medication
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
                                          setIsQuantityManuallyEdited(true) // When editing, treat as manually edited
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

      {/* Procedures Sheet */}
      <Sheet open={proceduresSheetOpen} onOpenChange={setProceduresSheetOpen}>
        <SheetContent side="right" className="w-full sm:w-[90vw] sm:max-w-5xl p-0 flex flex-col overflow-hidden">
          <SheetHeader className="px-6 pt-6 pb-4 border-b flex-shrink-0">
            <SheetTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5" />
              Record Procedures
            </SheetTitle>
            <SheetDescription>
              Record medical procedures performed during this patient encounter
            </SheetDescription>
          </SheetHeader>
          <ScrollArea className="flex-1 px-6">
            <div className="space-y-4 mt-4 pb-4">
              <div className="flex items-center justify-between">
                <h3 className="text-md font-medium">Procedures</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingProcedureIndex(null)
                    setTempProcedure(defaultProcedure)
                    setAddProcedureDialogOpen(true)
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Procedure
                </Button>
              </div>
              {procedureFields.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    No procedures recorded. Click "Add Procedure" to record a procedure.
                  </CardContent>
                </Card>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Procedure</TableHead>
                        <TableHead>Notes</TableHead>
                        <TableHead>Complications</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {procedureFields.map((field, index) => {
                        const procedureId = form.watch(`procedures.${index}.procedureId`)
                        const procedure = procedures.find((p: any) => p.procedureId?.toString() === procedureId)
                        const procedureName = procedure?.procedureName || "Unknown Procedure"
                        return (
                          <TableRow key={field.id}>
                            <TableCell className="font-medium">{procedureName}</TableCell>
                            <TableCell>{form.watch(`procedures.${index}.notes`) || "-"}</TableCell>
                            <TableCell>{form.watch(`procedures.${index}.complications`) || "-"}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setEditingProcedureIndex(index)
                                    const procData = form.getValues(`procedures.${index}`)
                                    setTempProcedure(procData || defaultProcedure)
                                    setAddProcedureDialogOpen(true)
                                  }}
                                  className="h-8 w-8 p-0"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeProcedure(index)}
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
              )}
            </div>
          </ScrollArea>
          <SheetFooter className="px-6 py-4 border-t bg-background flex-shrink-0">
            <div className="flex items-center justify-between w-full">
              <Button
                type="button"
                variant="outline"
                onClick={() => setProceduresSheetOpen(false)}
              >
                Close
              </Button>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Procedures will be saved with the encounter
                </span>
                <Button
                  type="button"
                  onClick={() => {
                    setProceduresSheetOpen(false)
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
        </SheetContent>
      </Sheet>

      {/* Orders/Consumables Sheet */}
      <Sheet open={ordersSheetOpen} onOpenChange={setOrdersSheetOpen}>
        <SheetContent side="right" className="w-full sm:w-[90vw] sm:max-w-5xl p-0 flex flex-col overflow-hidden">
          <SheetHeader className="px-6 pt-6 pb-4 border-b flex-shrink-0">
            <SheetTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Order Consumables
            </SheetTitle>
            <SheetDescription>
              Order medical consumables and supplies for this patient encounter
            </SheetDescription>
          </SheetHeader>
          <ScrollArea className="flex-1 px-6">
            <div className="space-y-4 mt-4 pb-4">
              <div className="flex items-center justify-between">
                <h3 className="text-md font-medium">Orders</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingOrderIndex(null)
                    setTempOrder(defaultOrder)
                    setAddOrderDialogOpen(true)
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Order
                </Button>
              </div>
              {orderFields.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    No orders placed. Click "Add Order" to order consumables.
                  </CardContent>
                </Card>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Unit Price</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orderFields.map((field, index) => {
                        const chargeId = form.watch(`orders.${index}.chargeId`)
                        const quantity = form.watch(`orders.${index}.quantity`) || 1
                        const consumable = consumables.find((c: any) => c.chargeId?.toString() === chargeId)
                        const itemName = consumable?.name || "Unknown Item"
                        const unitPrice = consumable?.cost ? parseFloat(consumable.cost) : 0
                        const total = unitPrice * quantity
                        return (
                          <TableRow key={field.id}>
                            <TableCell className="font-medium">{itemName}</TableCell>
                            <TableCell>{quantity}</TableCell>
                            <TableCell>KES {unitPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                            <TableCell className="text-right font-medium">
                              KES {total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setEditingOrderIndex(index)
                                    const orderData = form.getValues(`orders.${index}`)
                                    setTempOrder(orderData || defaultOrder)
                                    setAddOrderDialogOpen(true)
                                  }}
                                  className="h-8 w-8 p-0"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeOrder(index)}
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
              )}
              {orderFields.length > 0 && (
                <div className="flex justify-end items-center gap-4 pt-2 border-t">
                  <div className="text-sm text-muted-foreground">Total Cost:</div>
                  <div className="text-lg font-semibold">
                    KES {orderFields.reduce((sum, field, index) => {
                      const chargeId = form.watch(`orders.${index}.chargeId`)
                      const quantity = form.watch(`orders.${index}.quantity`) || 1
                      const consumable = consumables.find((c: any) => c.chargeId?.toString() === chargeId)
                      const unitPrice = consumable?.cost ? parseFloat(consumable.cost) : 0
                      return sum + (unitPrice * quantity)
                    }, 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
          <SheetFooter className="px-6 py-4 border-t bg-background flex-shrink-0">
            <div className="flex items-center justify-between w-full">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOrdersSheetOpen(false)}
              >
                Close
              </Button>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Orders will be saved with the encounter
                </span>
                <Button
                  type="button"
                  onClick={() => {
                    setOrdersSheetOpen(false)
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
        </SheetContent>
      </Sheet>

      {/* History Sheet */}
      <Sheet open={historySheetOpen} onOpenChange={setHistorySheetOpen}>
        <SheetContent side="right" className="w-full sm:w-[90vw] sm:max-w-5xl p-0 flex flex-col overflow-hidden">
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
        <DialogContent className="sm:max-w-[600px] z-[121]" overlayClassName="z-[120]">
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
                  This medication already has a pending prescription that has not been dispensed yet. Please check existing prescriptions.
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
                  onChange={(e) => {
                    setTempMedication({ ...tempMedication, dosage: e.target.value })
                    setIsQuantityManuallyEdited(false) // Reset manual edit flag when dosage changes
                  }}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Frequency *
                </label>
                <Input
                  placeholder="3 times daily"
                  value={tempMedication.frequency || ""}
                  onChange={(e) => {
                    setTempMedication({ ...tempMedication, frequency: e.target.value })
                    setIsQuantityManuallyEdited(false) // Reset manual edit flag when frequency changes
                  }}
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
                  onChange={(e) => {
                    setTempMedication({ ...tempMedication, duration: e.target.value })
                    setIsQuantityManuallyEdited(false) // Reset manual edit flag when duration changes
                  }}
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
                  placeholder="Auto-calculated"
                  value={tempMedication.quantity || ""}
                  onChange={(e) => {
                    setTempMedication({ ...tempMedication, quantity: e.target.value })
                    setIsQuantityManuallyEdited(true) // Mark as manually edited
                  }}
                  onFocus={() => setIsQuantityManuallyEdited(true)} // Mark as manually edited when focused
                  disabled={!tempMedication.medicationId || !getInventoryStatus(parseInt(tempMedication.medicationId))?.hasStock}
                />
                <p className="text-xs text-muted-foreground">
                  {tempMedication.dosage && tempMedication.frequency && tempMedication.duration && !isQuantityManuallyEdited && (
                    <span>Auto-calculated: {extractNumber(tempMedication.dosage)} × {(() => {
                      const freq = extractNumber(tempMedication.frequency)
                      return freq > 0 ? freq : "frequency"
                    })()} × {extractNumber(tempMedication.duration)} days</span>
                  )}
                  {isQuantityManuallyEdited && <span className="text-blue-600">Manually edited</span>}
                </p>
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
                setIsQuantityManuallyEdited(false)
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
                  // Add new medication (ensure alreadySaved is not set)
                  const newMedication = { ...tempMedication, alreadySaved: false }
                  console.log('➕ Adding medication to form:', newMedication)
                  appendMedication(newMedication)
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
        <DialogContent className="sm:max-w-[500px] z-[121]" overlayClassName="z-[120]">
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
                      // Always update the state, even if it's a duplicate
                      // The validation will show a warning, but we allow the selection
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
                      This test type already exists and has not been resulted yet. Please check existing orders.
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
                      // Add new test (ensure alreadySaved is not set)
                      const newTest = { ...tempLabTest, alreadySaved: false }
                      console.log('➕ Adding lab test to form:', newTest)
                      appendLabTest(newTest)
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

      {/* Add/Edit Procedure Dialog */}
      <Dialog open={addProcedureDialogOpen} onOpenChange={setAddProcedureDialogOpen}>
        <DialogContent className="sm:max-w-[600px] z-[121]" overlayClassName="z-[120]">
          <DialogHeader>
            <DialogTitle>
              {editingProcedureIndex !== null ? "Edit Procedure" : "Add Procedure"}
            </DialogTitle>
            <DialogDescription>
              {editingProcedureIndex !== null ? "Update the procedure details" : "Record a medical procedure performed during this encounter"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Procedure *
              </label>
              <Select
                onValueChange={(value) => setTempProcedure({ ...tempProcedure, procedureId: value })}
                value={tempProcedure.procedureId || ""}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select procedure" />
                </SelectTrigger>
                <SelectContent>
                  {procedures.length > 0 ? (
                    procedures.map((procedure: any) => (
                      <SelectItem key={procedure.procedureId} value={procedure.procedureId.toString()}>
                        {procedure.procedureName}
                        {procedure.category && ` (${procedure.category})`}
                        {procedure.cost && ` - KES ${parseFloat(procedure.cost).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                        {procedure.duration && ` - ${procedure.duration} min`}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      No procedures available
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Notes
              </label>
              <Textarea
                placeholder="Procedure notes and details"
                value={tempProcedure.notes || ""}
                onChange={(e) => setTempProcedure({ ...tempProcedure, notes: e.target.value })}
              />
              <p className="text-sm text-muted-foreground">Optional</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Complications
              </label>
              <Textarea
                placeholder="Any complications or adverse events"
                value={tempProcedure.complications || ""}
                onChange={(e) => setTempProcedure({ ...tempProcedure, complications: e.target.value })}
              />
              <p className="text-sm text-muted-foreground">Optional</p>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setAddProcedureDialogOpen(false)
                setEditingProcedureIndex(null)
                setTempProcedure(defaultProcedure)
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (!tempProcedure.procedureId) {
                  return
                }
                if (editingProcedureIndex !== null) {
                  form.setValue(`procedures.${editingProcedureIndex}`, tempProcedure)
                } else {
                  // Add new procedure (ensure alreadySaved is not set)
                  const newProcedure = { ...tempProcedure, alreadySaved: false }
                  console.log('➕ Adding procedure to form:', newProcedure)
                  appendProcedure(newProcedure)
                }
                setAddProcedureDialogOpen(false)
                setEditingProcedureIndex(null)
                setTempProcedure(defaultProcedure)
              }}
              disabled={!tempProcedure.procedureId}
            >
              {editingProcedureIndex !== null ? "Update" : "Add"} Procedure
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Order Dialog */}
      <Dialog open={addOrderDialogOpen} onOpenChange={setAddOrderDialogOpen}>
        <DialogContent className="sm:max-w-[600px] z-[121]" overlayClassName="z-[120]">
          <DialogHeader>
            <DialogTitle>
              {editingOrderIndex !== null ? "Edit Order" : "Add Order"}
            </DialogTitle>
            <DialogDescription>
              {editingOrderIndex !== null ? "Update the order details" : "Order medical consumables and supplies"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Consumable/Item *
              </label>
              <Select
                onValueChange={(value) => setTempOrder({ ...tempOrder, chargeId: value })}
                value={tempOrder.chargeId || ""}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select consumable" />
                </SelectTrigger>
                <SelectContent>
                  {consumables.length > 0 ? (
                    consumables.map((consumable: any) => (
                      <SelectItem key={consumable.chargeId} value={consumable.chargeId.toString()}>
                        {consumable.name}
                        {consumable.unit && ` (${consumable.unit})`}
                        {consumable.cost && ` - KES ${parseFloat(consumable.cost).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      No consumables available
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Quantity *
              </label>
              <Input
                type="number"
                min="1"
                placeholder="Enter quantity"
                value={tempOrder.quantity || 1}
                onChange={(e) => setTempOrder({ ...tempOrder, quantity: parseInt(e.target.value) || 1 })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Notes
              </label>
              <Textarea
                placeholder="Additional notes about this order"
                value={tempOrder.notes || ""}
                onChange={(e) => setTempOrder({ ...tempOrder, notes: e.target.value })}
              />
              <p className="text-sm text-muted-foreground">Optional</p>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setAddOrderDialogOpen(false)
                setEditingOrderIndex(null)
                setTempOrder(defaultOrder)
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (!tempOrder.chargeId || !tempOrder.quantity || tempOrder.quantity < 1) {
                  return
                }
                if (editingOrderIndex !== null) {
                  form.setValue(`orders.${editingOrderIndex}`, tempOrder)
                } else {
                  // Add new order (ensure alreadySaved is not set)
                  const newOrder = { ...tempOrder, alreadySaved: false }
                  console.log('➕ Adding order to form:', newOrder)
                  appendOrder(newOrder)
                }
                setAddOrderDialogOpen(false)
                setEditingOrderIndex(null)
                setTempOrder(defaultOrder)
              }}
              disabled={!tempOrder.chargeId || !tempOrder.quantity || tempOrder.quantity < 1}
            >
              {editingOrderIndex !== null ? "Update" : "Add"} Order
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

      {/* Critical alerts are now shown in the floating component after form is saved */}
    </>
  )
}

