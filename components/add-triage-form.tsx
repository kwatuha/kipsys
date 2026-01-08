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
import { triageApi, doctorsApi } from "@/lib/api"
import { toast } from "@/components/ui/use-toast"
import { useAuth } from "@/lib/auth/auth-context"

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
  const isEditing = !!triage
  const { user } = useAuth()

  const form = useForm<TriageFormValues>({
    resolver: zodResolver(triageFormSchema),
    defaultValues,
  })

  // Load doctors when form opens
  useEffect(() => {
    if (open) {
      loadDoctors()
    }
  }, [open])

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

  // Populate form when editing
  useEffect(() => {
    if (open && triage) {
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
    } else if (open && !triage) {
      form.reset(defaultValues)
    }
  }, [open, triage, form])

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
                      value={field.value}
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
                  <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
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
                  <Select onValueChange={field.onChange} defaultValue={field.value || "consultation"}>
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
      </DialogContent>
    </Dialog>
  )
}
