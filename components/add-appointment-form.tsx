"use client"

import { useState, useEffect, useCallback } from "react"
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
import { appointmentsApi, doctorsApi, departmentApi } from "@/lib/api"
import { Loader2 } from "lucide-react"

const appointmentSchema = z.object({
  patientId: z.string().min(1, { message: "Patient is required" }),
  patientName: z.string().optional(),
  doctorId: z.string().optional(), // Doctor is optional in the database schema
  department: z.string().optional(), // Department is optional
  appointmentDate: z.string().min(1, { message: "Appointment date is required" }),
  appointmentTime: z.string().min(1, { message: "Appointment time is required" }),
  reason: z.string().optional(),
  status: z.string().min(1, { message: "Status is required" }),
  notes: z.string().optional(),
})

interface AddAppointmentFormProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSuccess?: () => void
  appointment?: any
}

export function AddAppointmentForm({ open, onOpenChange, onSuccess, appointment }: AddAppointmentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(false)
  const [doctors, setDoctors] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const isEditing = !!appointment

  const form = useForm({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      patientId: "",
      patientName: "",
      doctorId: "",
      department: "",
      appointmentDate: "",
      appointmentTime: "",
      reason: "",
      status: "scheduled",
      notes: "",
    },
  })

  // Watch for patientId changes
  const patientId = form.watch("patientId")

  // Define load functions with useCallback to keep them stable
  const loadDoctors = useCallback(async () => {
    try {
      setLoading(true)
      const data = await doctorsApi.getAll()
      setDoctors(data || [])
    } catch (error: any) {
      console.error("Error loading doctors:", error)
      toast({
        title: "Error loading doctors",
        description: error.message || "Failed to load doctors",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [])

  const loadDepartments = useCallback(async () => {
    try {
      const data = await departmentApi.getAll()
      setDepartments(data || [])
    } catch (error: any) {
      console.error("Error loading departments:", error)
    }
  }, [])

  // Set mounted state to avoid hydration mismatch
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Load doctors and departments when dialog opens, and set dates client-side only
  useEffect(() => {
    if (open && isMounted) {
      // Set dates client-side only to avoid hydration mismatch
      const now = new Date()
      form.reset({
        patientId: "",
        patientName: "",
        doctorId: "",
        department: "",
        appointmentDate: now.toISOString().split("T")[0],
        appointmentTime: now.toTimeString().split(" ")[0].substring(0, 5),
        reason: "",
        status: "scheduled",
        notes: "",
      })
      loadDoctors()
      loadDepartments()
    } else if (!open) {
      // Reset form when dialog closes
      form.reset({
        patientId: "",
        patientName: "",
        doctorId: "",
        department: "",
        appointmentDate: "",
        appointmentTime: "",
        reason: "",
        status: "scheduled",
        notes: "",
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isMounted])

  // Set form values when editing
  useEffect(() => {
    if (appointment && !loading && doctors.length > 0 && departments.length > 0 && open && isMounted) {
      const appointmentDate = new Date(appointment.appointmentDate)
      const doctorId = appointment.doctorId?.toString() || ""
      const department = appointment.department || ""
      
      form.reset({
        patientId: appointment.patientId?.toString() || "",
        patientName: appointment.patientFirstName && appointment.patientLastName
          ? `${appointment.patientFirstName} ${appointment.patientLastName}`
          : "",
        doctorId,
        department,
        appointmentDate: appointmentDate.toISOString().split("T")[0],
        appointmentTime: appointment.appointmentTime || "",
        reason: appointment.reason || "",
        status: appointment.status || "scheduled",
        notes: appointment.notes || "",
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointment, loading, doctors.length, departments.length, open, isMounted])

  const onSubmit = async (values: z.infer<typeof appointmentSchema>) => {
    try {
      setIsSubmitting(true)
      setError(null)

      // Ensure all values are explicitly set (no undefined values)
      const payload: any = {
        patientId: parseInt(values.patientId),
        appointmentDate: values.appointmentDate,
        appointmentTime: values.appointmentTime,
        status: values.status || 'scheduled',
      }

      // Only include optional fields if they have values (check for "none" which means no selection)
      if (values.doctorId && values.doctorId !== "none") {
        payload.doctorId = parseInt(values.doctorId)
      } else {
        payload.doctorId = null
      }

      if (values.department && values.department !== "none") {
        payload.department = values.department
      } else {
        payload.department = null
      }

      if (values.reason) {
        payload.reason = values.reason
      } else {
        payload.reason = null
      }

      if (values.notes) {
        payload.notes = values.notes
      } else {
        payload.notes = null
      }

      if (isEditing) {
        await appointmentsApi.update(appointment.appointmentId.toString(), payload)
        toast({
          title: "Appointment updated",
          description: "The appointment has been updated successfully.",
        })
      } else {
        await appointmentsApi.create(payload)
        toast({
          title: "Appointment scheduled",
          description: "The appointment has been scheduled successfully.",
        })
      }

      form.reset()
      onOpenChange?.(false)
      onSuccess?.()
    } catch (error: any) {
      console.error("Error saving appointment:", error)
      const errorMessage = error.message || error.response?.message || "Failed to save appointment"
      setError(errorMessage)
      toast({
        title: isEditing ? "Error updating appointment" : "Error scheduling appointment",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle patient selection from combobox
  const handlePatientChange = (value: string) => {
    form.setValue("patientId", value)
    // Optionally fetch and set patient name
    if (value) {
      const patientIdNum = parseInt(value)
      // You could fetch patient details here if needed
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Appointment" : "Schedule New Appointment"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the appointment details below."
              : "Create a new appointment for a patient with a doctor."}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
            {error}
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="patientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Patient</FormLabel>
                  <FormControl>
                    <PatientCombobox
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value)
                        handlePatientChange(value)
                      }}
                      placeholder="Search patient by name, ID, or number..."
                      disabled={isEditing}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="doctorId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Doctor (Optional)</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value === "none" ? "" : value)
                      }}
                      value={field.value || undefined}
                      disabled={loading || isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select doctor (optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {doctors.map((doctor) => (
                          <SelectItem key={doctor.userId} value={doctor.userId.toString()}>
                            {doctor.firstName} {doctor.lastName}
                            {doctor.specialization && ` - ${doctor.specialization}`}
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
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department (Optional)</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value === "none" ? "" : value)
                      }}
                      value={field.value || undefined}
                      disabled={loading || isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select department (optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {departments.map((dept) => (
                          <SelectItem key={dept.departmentId} value={dept.departmentName}>
                            {dept.departmentName}
                          </SelectItem>
                        ))}
                        {departments.length === 0 && (
                          <>
                            <SelectItem value="Cardiology">Cardiology</SelectItem>
                            <SelectItem value="Neurology">Neurology</SelectItem>
                            <SelectItem value="Internal Medicine">Internal Medicine</SelectItem>
                            <SelectItem value="Ophthalmology">Ophthalmology</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="appointmentDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="appointmentTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                        <SelectItem value="no_show">No Show</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Appointment reason"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any special instructions or notes"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset()
                  onOpenChange?.(false)
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || loading}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isEditing ? "Updating..." : "Scheduling..."}
                  </>
                ) : (
                  isEditing ? "Update Appointment" : "Schedule Appointment"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
