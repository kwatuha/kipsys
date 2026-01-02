"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { PatientCombobox } from "@/components/patient-combobox"
import { patientApi, icuApi, doctorsApi } from "@/lib/api"
import { Loader2 } from "lucide-react"

// Create a dynamic schema that makes doctorId optional when editing
const createFormSchema = (isEditing: boolean) => z.object({
  patientId: z.string().min(1, { message: "Patient is required" }),
  patientName: z.string().optional(),
  admissionDate: z.string().min(1, { message: "Admission date is required" }),
  admissionTime: z.string().min(1, { message: "Admission time is required" }),
  diagnosis: z.string().min(1, { message: "Diagnosis is required" }),
  doctorId: isEditing 
    ? z.string().optional() // Optional when editing since it can't be changed
    : z.string().min(1, { message: "Doctor is required" }),
  icuBedId: z.string().min(1, { message: "ICU Bed is required" }),
  admissionNotes: z.string().optional(),
  admissionType: z.string().min(1, { message: "Admission type is required" }),
  requiresVentilator: z.string().min(1, { message: "Please specify if ventilator is required" }),
})

export function AddAdmissionForm({ open, onOpenChange, onSuccess, admission }) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(false)
  const [doctors, setDoctors] = useState<any[]>([])
  const [icuBeds, setIcuBeds] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const isEditing = !!admission

  const form = useForm({
    resolver: zodResolver(createFormSchema(isEditing)),
    defaultValues: {
      patientId: "",
      patientName: "",
      admissionDate: "",
      admissionTime: "",
      diagnosis: "",
      doctorId: "",
      icuBedId: "",
      admissionNotes: "",
      admissionType: "",
      requiresVentilator: "",
    },
  })

  // Set mounted state to avoid hydration mismatch
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Watch for patientId changes
  const patientId = form.watch("patientId")

  // Set form values when editing and data is loaded
  useEffect(() => {
    if (admission && !loading && doctors.length > 0 && icuBeds.length > 0 && open && isMounted) {
      const admissionDate = new Date(admission.admissionDate)
      const doctorId = admission.admittingDoctorId?.toString() || admission.doctorUserId?.toString() || ""
      const icuBedId = admission.icuBedId?.toString() || ""
      
      console.log("Setting form values - data loaded:", {
        doctorId,
        icuBedId,
        doctorsAvailable: doctors.length,
        bedsAvailable: icuBeds.length,
        admission,
      })
      
      // Use form.reset to set all values at once
      form.reset({
        patientId: admission.patientId?.toString() || "",
        patientName: admission.firstName && admission.lastName 
          ? `${admission.firstName} ${admission.lastName}` 
          : "",
        admissionDate: admissionDate.toISOString().split("T")[0],
        admissionTime: admissionDate.toTimeString().split(" ")[0].substring(0, 5),
        diagnosis: admission.admissionReason || "",
        doctorId: doctorId,
        icuBedId: icuBedId,
        admissionNotes: admission.notes || "",
        admissionType: admission.initialCondition || "",
        requiresVentilator: admission.ventilator || "no",
      })
      
      // Also explicitly set the Select values to ensure they're selected
      if (doctorId) {
        setTimeout(() => form.setValue("doctorId", doctorId), 0)
      }
      if (icuBedId) {
        setTimeout(() => form.setValue("icuBedId", icuBedId), 0)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [admission, loading, doctors.length, icuBeds.length, open, isMounted])

  // Load patient name when patientId changes
  useEffect(() => {
    const loadPatientName = async () => {
      if (patientId) {
        try {
          const patient = await patientApi.getById(patientId)
          if (patient) {
            const fullName = `${patient.firstName || ""} ${patient.lastName || ""}`.trim()
            form.setValue("patientName", fullName)
          }
        } catch (error) {
          console.error("Error loading patient:", error)
        }
      } else {
        form.setValue("patientName", "")
      }
    }

    loadPatientName()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId])

  // Load doctors and ICU beds when dialog opens, and set dates client-side only
  useEffect(() => {
    if (open && isMounted) {
      loadFormData()
      if (!admission) {
        // New admission mode - set dates client-side only to avoid hydration mismatch
        const now = new Date()
        form.reset({
          patientId: "",
          patientName: "",
          admissionDate: now.toISOString().split("T")[0],
          admissionTime: now.toTimeString().split(" ")[0].substring(0, 5),
          diagnosis: "",
          doctorId: "",
          icuBedId: "",
          admissionNotes: "",
          admissionType: "",
          requiresVentilator: "",
        })
      }
    } else if (!open) {
      // Reset form when dialog closes
      form.reset({
        patientId: "",
        patientName: "",
        admissionDate: "",
        admissionTime: "",
        diagnosis: "",
        doctorId: "",
        icuBedId: "",
        admissionNotes: "",
        admissionType: "",
        requiresVentilator: "",
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isMounted])

  const loadFormData = async () => {
    try {
      setLoading(true)
      setError(null)

      // When editing, load all beds; when creating, load only available beds
      const bedsStatus = isEditing ? undefined : "available"
      const [doctorsResult, bedsResult] = await Promise.allSettled([
        doctorsApi.getAll(),
        icuApi.getBeds(bedsStatus, 1, 100),
      ])

      if (doctorsResult.status === "fulfilled") {
        setDoctors(doctorsResult.value || [])
      } else {
        console.error("Error loading doctors:", doctorsResult.reason)
        toast({
          title: "Error loading doctors",
          description: doctorsResult.reason?.message || "Failed to load doctors",
          variant: "destructive",
        })
      }

      if (bedsResult.status === "fulfilled") {
        setIcuBeds(bedsResult.value || [])
      } else {
        console.error("Error loading ICU beds:", bedsResult.reason)
        toast({
          title: "Error loading ICU beds",
          description: bedsResult.reason?.message || "Failed to load ICU beds",
          variant: "destructive",
        })
      }

      // Form values will be set by the useEffect hook after data loads
    } catch (err: any) {
      setError(err.message || "Failed to load form data")
      console.error("Error loading form data:", err)
    } finally {
      setLoading(false)
    }
  }

  async function onSubmit(values) {
    try {
      setIsSubmitting(true)
      setError(null)

      // Validate required fields
      if (!values.patientId || !values.icuBedId) {
        throw new Error("Please fill in all required fields")
      }

      // Doctor ID is only required when creating, not when editing (since it can't be changed)
      if (!isEditing && !values.doctorId) {
        throw new Error("Please select a doctor")
      }

      // Parse and validate IDs
      const patientId = parseInt(values.patientId)
      const icuBedId = parseInt(values.icuBedId)
      
      // When editing, doctorId is optional since it can't be changed
      // We'll use the existing doctorId from the admission
      let admittingDoctorId: number | undefined
      if (isEditing) {
        // Use the existing doctor ID from admission
        admittingDoctorId = admission?.admittingDoctorId || admission?.doctorUserId
      } else {
        // When creating, doctorId is required
        if (!values.doctorId) {
          throw new Error("Please select a doctor")
        }
        admittingDoctorId = parseInt(values.doctorId)
      }

      if (isNaN(patientId) || isNaN(icuBedId)) {
        throw new Error("Invalid patient or bed ID")
      }
      
      if (admittingDoctorId && isNaN(admittingDoctorId)) {
        throw new Error("Invalid doctor ID")
      }

      // Helper function to convert empty strings to null
      const toNullIfEmpty = (value: string | undefined | null) => {
        if (value === undefined || value === null || (typeof value === "string" && value.trim() === "")) {
          return null
        }
        return typeof value === "string" ? value.trim() : value
      }

      // Ensure date is in DATETIME format (YYYY-MM-DD HH:MM:SS) for MySQL
      // The admissions table expects DATETIME, not just DATE
      let admissionDate = values.admissionDate
      let admissionTime = values.admissionTime || "00:00"
      
      if (!admissionDate) {
        const now = new Date()
        admissionDate = now.toISOString().split("T")[0]
        admissionTime = now.toTimeString().split(" ")[0].substring(0, 5)
      } else if (admissionDate instanceof Date) {
        admissionDate = admissionDate.toISOString().split("T")[0]
      } else if (typeof admissionDate === "string") {
        // Validate and normalize date format
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/
        if (!dateRegex.test(admissionDate)) {
          throw new Error("Invalid date format. Please use YYYY-MM-DD format.")
        }
      }
      
      // Combine date and time into DATETIME format (YYYY-MM-DD HH:MM:SS)
      // Ensure time is in HH:MM format, then add :00 for seconds
      const timeParts = admissionTime.split(":")
      const normalizedTime = `${timeParts[0]}:${timeParts[1] || "00"}:00`
      const admissionDateTime = `${admissionDate} ${normalizedTime}`

      // Prepare API payload - ensure all values are properly typed
      // Backend expects: patientId, icuBedId, admissionDate (DATETIME), admittingDoctorId, admissionReason, initialCondition, status, notes
      const payload = {
        patientId: Number(patientId),
        icuBedId: Number(icuBedId),
        admissionDate: admissionDateTime, // DATETIME format: YYYY-MM-DD HH:MM:SS
        admittingDoctorId: admittingDoctorId ? Number(admittingDoctorId) : undefined,
        admissionReason: toNullIfEmpty(values.diagnosis),
        initialCondition: toNullIfEmpty(values.admissionType),
        status: "critical", // Default status
        notes: toNullIfEmpty(values.admissionNotes),
      }

      // Validate all required numeric fields
      if (!Number.isInteger(payload.patientId) || payload.patientId <= 0) {
        throw new Error("Invalid patient ID")
      }
      if (!Number.isInteger(payload.icuBedId) || payload.icuBedId <= 0) {
        throw new Error("Invalid ICU bed ID")
      }
      // Doctor ID validation only when creating (not editing)
      if (!isEditing && (!payload.admittingDoctorId || !Number.isInteger(payload.admittingDoctorId) || payload.admittingDoctorId <= 0)) {
        throw new Error("Invalid doctor ID")
      }

      console.log("Submitting ICU admission payload:", JSON.stringify(payload, null, 2))
      console.log("Payload types:", {
        patientId: typeof payload.patientId,
        icuBedId: typeof payload.icuBedId,
        admissionDate: typeof payload.admissionDate,
        admittingDoctorId: typeof payload.admittingDoctorId,
        admissionReason: typeof payload.admissionReason,
        initialCondition: typeof payload.initialCondition,
        status: typeof payload.status,
        notes: typeof payload.notes,
      })

      try {
        if (isEditing && admission?.icuAdmissionId) {
          // For updates, only send fields that can be updated (not patientId, admissionDate, admittingDoctorId)
          const updatePayload = {
            icuBedId: Number(icuBedId),
            admissionReason: toNullIfEmpty(values.diagnosis),
            initialCondition: toNullIfEmpty(values.admissionType),
            status: "critical", // Default status
            notes: toNullIfEmpty(values.admissionNotes),
          }
          await icuApi.updateAdmission(admission.icuAdmissionId.toString(), updatePayload)
          toast({
            title: "Admission updated",
            description: `ICU admission has been updated successfully.`,
          })
        } else {
          await icuApi.createAdmission(payload)
          toast({
            title: "Admission created",
            description: `Patient ${values.patientName || "selected patient"} has been admitted to ICU.`,
          })
        }
      } catch (apiError: any) {
        console.error("API Error caught:", apiError)
        console.error("API Error response:", apiError?.response)
        console.error("API Error message:", apiError?.message)
        throw apiError // Re-throw to be caught by outer catch
      }

      form.reset()
      onOpenChange(false)

      if (onSuccess) {
        onSuccess()
      }
    } catch (err: any) {
      // Extract error message from API response
      // Check for nested error object from backend
      let errorMessage = "Failed to create ICU admission"
      
      if (err?.response?.error) {
        // Backend returned { message: "...", error: "..." }
        errorMessage = err.response.error
      } else if (err?.response?.message) {
        errorMessage = err.response.message
      } else if (err?.message) {
        errorMessage = err.message
      } else if (err?.error) {
        errorMessage = err.error
      }
      
      setError(errorMessage)
      toast({
        title: isEditing ? "Error updating admission" : "Error creating admission",
        description: errorMessage,
        variant: "destructive",
      })
      console.error("Error creating ICU admission:", err)
      console.error("Error details:", {
        message: err?.message,
        error: err?.error,
        response: err?.response,
        status: err?.status,
        stack: err?.stack,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit ICU Admission" : "New ICU Admission"}</DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Update the details for this ICU admission. Click save when you're done."
              : "Enter the details for a new ICU admission. Click save when you're done."}
          </DialogDescription>
        </DialogHeader>
        {error && (
          <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
            {error}
          </div>
        )}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Loading form data...</span>
          </div>
        ) : (
          <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                    <p className="text-xs text-muted-foreground">Patient cannot be changed after admission</p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="admissionDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Admission Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} disabled={isEditing} />
                    </FormControl>
                    {isEditing && (
                      <p className="text-xs text-muted-foreground">Date cannot be changed after admission</p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="admissionTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Admission Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} disabled={isEditing} />
                    </FormControl>
                    {isEditing && (
                      <p className="text-xs text-muted-foreground">Time cannot be changed after admission</p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="diagnosis"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Diagnosis</FormLabel>
                  <FormControl>
                    <Input placeholder="Primary diagnosis" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="doctorId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Attending Physician {isEditing && <span className="text-muted-foreground font-normal">(Read-only)</span>}
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""} disabled={isEditing}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select doctor" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {doctors.map((doctor) => (
                          <SelectItem key={doctor.userId} value={doctor.userId.toString()}>
                            {doctor.firstName} {doctor.lastName}
                            {doctor.specialization && ` - ${doctor.specialization}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {isEditing && (
                      <p className="text-xs text-muted-foreground">Doctor cannot be changed after admission. This field is for display only.</p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="icuBedId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ICU Bed</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select bed" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {icuBeds.map((bed) => (
                          <SelectItem key={bed.icuBedId} value={bed.icuBedId.toString()}>
                            {bed.bedNumber} ({bed.status === "available" ? "Available" : bed.status})
                            {bed.equipmentList && ` - ${bed.equipmentList}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="admissionType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Admission Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="emergency">Emergency</SelectItem>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="transfer">Transfer from Ward</SelectItem>
                        <SelectItem value="post-op">Post-Operative</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="requiresVentilator"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Requires Ventilator</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select option" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="admissionNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Admission Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter any additional notes about the patient's condition or special requirements"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : isEditing ? "Update Admission" : "Save Admission"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
        )}
      </DialogContent>
    </Dialog>
  )
}
