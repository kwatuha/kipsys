"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Loader2 } from "lucide-react"

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
import { PatientCombobox } from "@/components/patient-combobox"
import { ChiefComplaintCombobox } from "@/components/chief-complaint-combobox"
import { triageApi, doctorsApi, patientApi } from "@/lib/api"
import { toast } from "@/components/ui/use-toast"
import { useAuth } from "@/lib/auth/auth-context"
import { useCriticalNotifications } from "@/lib/critical-notifications-context"
import { checkAndNotifyCriticalVitals } from "@/lib/critical-vitals-utils"

const triageFormSchema = z.object({
  patientId: z.string({
    required_error: "Please select a patient.",
  }),
  chiefComplaint: z.string().min(2, {
    message: "Chief complaint must be at least 2 characters.",
  }),
  temperature: z.string().optional().or(z.literal("")),
  bloodPressure: z.string().optional().or(z.literal("")),
  heartRate: z.string().optional().or(z.literal("")),
  respiratoryRate: z.string().optional().or(z.literal("")),
  oxygenSaturation: z.string().optional().or(z.literal("")),
  painLevel: z.string().optional().or(z.literal("")),
  priority: z.string({
    required_error: "Please select a priority level.",
  }),
  assignedToDoctorId: z.string({
    required_error: "Please select a doctor or service point.",
  }),
  assignedToDepartment: z.string().optional(),
  servicePoint: z.string({
    required_error: "Please select a service point.",
  }),
  notes: z.string().optional(),
})

type TriageFormValues = z.infer<typeof triageFormSchema>

const TRIAGE_STORAGE_KEY = 'triage_form_draft'

const SERVICE_POINTS = [
  { value: "consultation", label: "Consultation" },
  { value: "laboratory", label: "Laboratory" },
  { value: "radiology", label: "Radiology" },
  { value: "pharmacy", label: "Pharmacy" },
]

const defaultValues: Partial<TriageFormValues> = {
  patientId: "",
  chiefComplaint: "",
  temperature: "",
  bloodPressure: "",
  heartRate: "",
  respiratoryRate: "",
  oxygenSaturation: "",
  painLevel: "",
  priority: "",
  assignedToDoctorId: "",
  assignedToDepartment: "",
  servicePoint: "consultation",
  notes: "",
}

export function AddTriageForm({ 
  open, 
  onOpenChange, 
  onSuccess,
  triage 
}: { 
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  triage?: any
}) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [doctors, setDoctors] = useState<any[]>([])
  const [loadingDoctors, setLoadingDoctors] = useState(false)
  const [patientName, setPatientName] = useState<string | undefined>(undefined)
  const isEditing = !!triage
  const { user } = useAuth()
  const { addNotification } = useCriticalNotifications()

  const form = useForm<TriageFormValues>({
    resolver: zodResolver(triageFormSchema),
    defaultValues: {
      ...defaultValues,
      // Ensure all values are explicitly set to empty strings, not undefined
      patientId: "",
      chiefComplaint: "",
      temperature: "",
      bloodPressure: "",
      heartRate: "",
      respiratoryRate: "",
      oxygenSaturation: "",
      painLevel: "",
      priority: "",
      assignedToDoctorId: "",
      assignedToDepartment: "",
      servicePoint: "consultation",
      notes: "",
    },
  })

  // Watch vital signs to check for critical values
  const watchedVitals = form.watch(['temperature', 'bloodPressure', 'heartRate', 'respiratoryRate', 'oxygenSaturation', 'patientId'])
  
  // Convert form values to vitals object for critical alert
  const getVitalsFromForm = (): any => {
    const temp = watchedVitals[0]
    const bp = watchedVitals[1]
    const hr = watchedVitals[2]
    const rr = watchedVitals[3]
    const spo2 = watchedVitals[4]
    
    const vitals: any = {}
    
    if (temp && !isNaN(parseFloat(temp))) {
      vitals.temperature = parseFloat(temp)
    }
    
    if (bp) {
      const bpMatch = bp.match(/(\d+)\s*\/\s*(\d+)/)
      if (bpMatch) {
        vitals.systolicBP = parseInt(bpMatch[1])
        vitals.diastolicBP = parseInt(bpMatch[2])
      }
    }
    
    if (hr && !isNaN(parseFloat(hr))) {
      vitals.heartRate = parseFloat(hr)
    }
    
    if (rr && !isNaN(parseFloat(rr))) {
      vitals.respiratoryRate = parseFloat(rr)
    }
    
    if (spo2 && !isNaN(parseFloat(spo2))) {
      vitals.oxygenSaturation = parseFloat(spo2)
    }
    
    return Object.keys(vitals).length > 0 ? vitals : null
  }

  // Load doctors when form opens
  useEffect(() => {
    if (open) {
      loadDoctors()
    }
  }, [open])

  // Auto-save form data to localStorage
  useEffect(() => {
    if (!open || isEditing) return

    const subscription = form.watch((value) => {
      const hasData = value.patientId || value.chiefComplaint || 
                      value.temperature || value.bloodPressure || value.heartRate ||
                      value.respiratoryRate || value.oxygenSaturation || value.painLevel ||
                      value.priority || value.assignedToDoctorId || value.notes
      
      if (hasData) {
        saveDraftToStorage(value as any)
      } else {
        clearDraftFromStorage()
      }
    })

    return () => subscription.unsubscribe()
  }, [form, open, isEditing])

  // Removed: No longer checking critical values during typing
  // Critical values are now checked only after form is saved

  // Load patient name when patientId changes
  useEffect(() => {
    const patientId = watchedVitals[5]
    if (patientId) {
      loadPatientName(patientId)
    } else {
      setPatientName(undefined)
    }
  }, [watchedVitals[5]])

  const loadPatientName = async (patientId: string) => {
    try {
      const patient = await patientApi.getById(patientId)
      if (patient) {
        const name = `${patient.firstName || ''} ${patient.lastName || ''}`.trim()
        setPatientName(name || undefined)
      }
    } catch (err) {
      console.error('Error loading patient name:', err)
      setPatientName(undefined)
    }
  }

  const loadDoctors = async () => {
    try {
      setLoadingDoctors(true)
      const doctorsData = await doctorsApi.getAll()
      setDoctors(doctorsData)
    } catch (error) {
      console.error("Error loading doctors:", error)
    } finally {
      setLoadingDoctors(false)
    }
  }

  // Draft management functions
  const saveDraftToStorage = (data: Partial<TriageFormValues>) => {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(TRIAGE_STORAGE_KEY, JSON.stringify(data))
    } catch (error) {
      console.error('Error saving draft to localStorage:', error)
    }
  }

  const loadDraftFromStorage = (): Partial<TriageFormValues> | null => {
    if (typeof window === 'undefined') return null
    try {
      const saved = localStorage.getItem(TRIAGE_STORAGE_KEY)
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
      localStorage.removeItem(TRIAGE_STORAGE_KEY)
    } catch (error) {
      console.error('Error clearing draft from localStorage:', error)
    }
  }

  // Populate form when editing or load draft
  useEffect(() => {
    if (open) {
      if (isEditing && triage) {
        // If editing, populate from triage data
        const bloodPressure = triage.systolicBP && triage.diastolicBP 
          ? `${triage.systolicBP}/${triage.diastolicBP}` 
          : ""
        form.reset({
          patientId: triage.patientId?.toString() || "",
          chiefComplaint: triage.chiefComplaint || "",
          temperature: triage.temperature?.toString() || "",
          bloodPressure: bloodPressure,
          heartRate: triage.heartRate?.toString() || "",
          respiratoryRate: triage.respiratoryRate?.toString() || "",
          oxygenSaturation: triage.oxygenSaturation?.toString() || "",
          painLevel: triage.painLevel?.toString() || "",
          priority: triage.triageCategory === 'red' ? 'Emergency' : 
                    triage.triageCategory === 'yellow' ? (triage.priorityLevel === 2 ? 'Urgent' : 'Semi-urgent') : 
                    'Non-urgent',
          notes: triage.notes || "",
        })
      } else {
        // Load saved draft if available
        const savedDraft = loadDraftFromStorage()
        if (savedDraft) {
          // Normalize draft values to ensure all fields are defined (not undefined)
          const normalizedDraft = {
            patientId: savedDraft.patientId ?? "",
            chiefComplaint: savedDraft.chiefComplaint ?? "",
            temperature: savedDraft.temperature ?? "",
            bloodPressure: savedDraft.bloodPressure ?? "",
            heartRate: savedDraft.heartRate ?? "",
            respiratoryRate: savedDraft.respiratoryRate ?? "",
            oxygenSaturation: savedDraft.oxygenSaturation ?? "",
            painLevel: savedDraft.painLevel ?? "",
            priority: savedDraft.priority ?? "",
            assignedToDoctorId: savedDraft.assignedToDoctorId ?? "",
            assignedToDepartment: savedDraft.assignedToDepartment ?? "",
            servicePoint: savedDraft.servicePoint ?? "consultation",
            notes: savedDraft.notes ?? "",
          }
          form.reset(normalizedDraft)
        } else {
          form.reset(defaultValues)
        }
      }
    }
  }, [open, isEditing, triage, form])

  async function onSubmit(data: TriageFormValues) {
    try {
      setIsSubmitting(true)
      setError(null)

      const payload = {
        patientId: parseInt(data.patientId),
        chiefComplaint: data.chiefComplaint,
        temperature: data.temperature || null,
        bloodPressure: data.bloodPressure || null,
        heartRate: data.heartRate || null,
        respiratoryRate: data.respiratoryRate || null,
        oxygenSaturation: data.oxygenSaturation || null,
        painLevel: data.painLevel || null,
        priority: data.priority,
        assignedToDoctorId: data.assignedToDoctorId ? parseInt(data.assignedToDoctorId) : null,
        assignedToDepartment: data.assignedToDepartment || null,
        servicePoint: data.servicePoint,
        notes: data.notes || null,
        triagedBy: user?.id ? parseInt(user.id) : 68, // Use current user ID or default to 68 (first doctor)
      }

      if (isEditing && triage?.triageId) {
        await triageApi.update(triage.triageId.toString(), payload)
        toast({
          title: "Triage updated",
          description: "Triage assessment has been updated successfully.",
        })
      } else {
        await triageApi.create(payload)
        toast({
          title: "Triage created",
          description: "Triage assessment has been created successfully.",
        })
      }

      // Check for critical values AFTER saving
      const vitals = getVitalsFromForm()
      if (vitals && data.patientId) {
        await checkAndNotifyCriticalVitals(
          vitals,
          data.patientId,
          patientName,
          addNotification
        )
      }

      // Clear draft after successful submission
      clearDraftFromStorage()
      form.reset()
      onOpenChange(false)
      if (onSuccess) {
        onSuccess()
      }
    } catch (err: any) {
      const errorMessage = err.message || "Failed to save triage assessment"
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Triage Assessment" : "New Triage Assessment"}</DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Update the patient's triage information."
              : "Enter the patient's triage information to assess their priority level."}
          </DialogDescription>
        </DialogHeader>
        {error && (
          <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
            {error}
          </div>
        )}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="patientId"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Patient</FormLabel>
                  <FormControl>
                    <PatientCombobox
                      value={field.value || ""}
                      onValueChange={(value) => {
                        field.onChange(value)
                      }}
                      placeholder="Search patient by name, ID, or number..."
                      disabled={isEditing}
                    />
                  </FormControl>
                  {isEditing && (
                    <p className="text-xs text-muted-foreground">Patient cannot be changed after triage</p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="chiefComplaint"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Chief Complaint</FormLabel>
                  <FormControl>
                    <ChiefComplaintCombobox
                      value={field.value || ""}
                      onChange={field.onChange}
                      placeholder="Patient's main complaint or reason for visit. Type to search ICD-10 symptoms..."
                    />
                  </FormControl>
                  <FormDescription>
                    Use the ICD-10 button to search for symptoms and complaints from the ICD-10 database
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="temperature"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Temperature (°C)</FormLabel>
                    <FormControl>
                      <Input placeholder="37.0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bloodPressure"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Blood Pressure (mmHg)</FormLabel>
                    <FormControl>
                      <Input placeholder="120/80" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="heartRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Heart Rate (bpm)</FormLabel>
                    <FormControl>
                      <Input placeholder="75" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="respiratoryRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Respiratory Rate (breaths/min)</FormLabel>
                    <FormControl>
                      <Input placeholder="16" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="oxygenSaturation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Oxygen Saturation (%)</FormLabel>
                    <FormControl>
                      <Input placeholder="98" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="painLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pain Level (0-10)</FormLabel>
                    <FormControl>
                      <Input placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority Level</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Emergency">Emergency</SelectItem>
                      <SelectItem value="Urgent">Urgent</SelectItem>
                      <SelectItem value="Semi-urgent">Semi-urgent</SelectItem>
                      <SelectItem value="Non-urgent">Non-urgent</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>Based on the patient's condition and vital signs</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="servicePoint"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service Point *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || "consultation"}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select service point" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {SERVICE_POINTS.map((sp) => (
                        <SelectItem key={sp.value} value={sp.value}>
                          {sp.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>Where the patient should be sent after triage</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="assignedToDoctorId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assigned Doctor/Service *</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value || ""}
                    disabled={loadingDoctors}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={loadingDoctors ? "Loading doctors..." : "Select doctor"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {doctors.map((doctor) => (
                        <SelectItem key={doctor.userId} value={doctor.userId.toString()}>
                          {doctor.firstName} {doctor.lastName} {doctor.department ? `(${doctor.department})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>Doctor or service the patient should see</FormDescription>
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
                    <Textarea placeholder="Any additional observations or notes" {...field} />
                  </FormControl>
                  <FormDescription>Optional</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? "Saving..." : isEditing ? "Update Triage" : "Submit Triage"}
              </Button>
            </DialogFooter>
          </form>
        </Form>

        {/* Critical alerts are now shown in the floating component after form is saved */}
      </DialogContent>
    </Dialog>
  )
}
