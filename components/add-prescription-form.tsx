"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useFieldArray } from "react-hook-form"
import { z } from "zod"
import { CalendarIcon, Loader2, Plus, Trash2 } from "lucide-react"
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
import { patientApi, doctorsApi, pharmacyApi } from "@/lib/api"

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

const prescriptionFormSchema = z.object({
  patientId: z.string({
    required_error: "Please select a patient.",
  }),
  doctorId: z.string({
    required_error: "Please select a doctor.",
  }),
  prescriptionDate: z.date({
    required_error: "Prescription date is required.",
  }),
  diagnosis: z.string().optional(),
  medications: z.array(medicationSchema).min(1, {
    message: "At least one medication is required.",
  }),
  notes: z.string().optional(),
})

type MedicationValues = z.infer<typeof medicationSchema>
type PrescriptionFormValues = z.infer<typeof prescriptionFormSchema>

const defaultMedication: MedicationValues = {
  medicationId: "",
  dosage: "",
  frequency: "",
  duration: "",
  quantity: "",
  instructions: "",
}

const defaultValues: Partial<PrescriptionFormValues> = {
  patientId: "",
  doctorId: "",
  diagnosis: "",
  medications: [defaultMedication],
  notes: "",
}

interface AddPrescriptionFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function AddPrescriptionForm({ open, onOpenChange, onSuccess }: AddPrescriptionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [doctors, setDoctors] = useState<any[]>([])
  const [medications, setMedications] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<PrescriptionFormValues>({
    resolver: zodResolver(prescriptionFormSchema),
    defaultValues,
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "medications",
  })

  useEffect(() => {
    if (open) {
      loadData()
      form.reset({
        patientId: "",
        doctorId: "",
        diagnosis: "",
        medications: [defaultMedication],
        notes: "",
      })
      setError(null)
    }
  }, [open, form])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      const [patientsData, doctorsData, medicationsData] = await Promise.all([
        patientApi.getAll(),
        doctorsApi.getAll(),
        pharmacyApi.getMedications(),
      ])
      setPatients(patientsData)
      setDoctors(doctorsData)
      setMedications(medicationsData)
    } catch (err: any) {
      setError(err.message || 'Failed to load data')
      console.error('Error loading form data:', err)
    } finally {
      setLoading(false)
    }
  }

  async function onSubmit(data: PrescriptionFormValues) {
    try {
      setIsSubmitting(true)
      setError(null)

      // Transform medications to match API structure
      const items = data.medications.map((med) => ({
        medicationId: parseInt(med.medicationId),
        dosage: med.dosage,
        frequency: med.frequency,
        duration: med.duration,
        quantity: med.quantity ? parseInt(med.quantity) : null,
        instructions: med.instructions || null,
      }))

      const prescriptionData = {
        patientId: parseInt(data.patientId),
        doctorId: parseInt(data.doctorId),
        prescriptionDate: format(data.prescriptionDate, 'yyyy-MM-dd'),
        status: 'pending',
        notes: data.notes || data.diagnosis || null,
        items,
      }

      await pharmacyApi.createPrescription(prescriptionData)
      
      if (onSuccess) {
        onSuccess()
      }
      onOpenChange(false)
      form.reset()
    } catch (err: any) {
      setError(err.message || 'Failed to create prescription')
      console.error('Error creating prescription:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getPatientName = (patient: any) => {
    return `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || patient.patientNumber || `Patient ${patient.patientId}`
  }

  const getDoctorName = (doctor: any) => {
    return `Dr. ${doctor.firstName || ''} ${doctor.lastName || ''}`.trim() || doctor.username || `Doctor ${doctor.userId}`
  }

  const getMedicationName = (medication: any) => {
    return medication.name || medication.medicationName || medication.medicationCode || 'Unknown'
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Prescription</DialogTitle>
          <DialogDescription>Enter prescription details for the patient.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
                {error}
              </div>
            )}
            {loading && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">Loading data...</span>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
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
                    <FormLabel>Doctor</FormLabel>
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

            <FormField
              control={form.control}
              name="prescriptionDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Prescription Date</FormLabel>
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
              name="diagnosis"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Diagnosis</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Patient diagnosis" {...field} />
                  </FormControl>
                  <FormDescription>Optional</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <h3 className="text-md font-medium mb-2">Medications</h3>
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="p-4 border rounded-md">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-sm font-medium">Medication {index + 1}</h4>
                      {index > 0 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => remove(index)}
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Remove medication</span>
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name={`medications.${index}.medicationId`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Medication *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select medication" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {medications.map((medication) => (
                                  <SelectItem key={medication.medicationId} value={medication.medicationId.toString()}>
                                    {getMedicationName(medication)}
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
                        name={`medications.${index}.dosage`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Dosage *</FormLabel>
                            <FormControl>
                              <Input placeholder="1 tablet" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4 mt-4">
                      <FormField
                        control={form.control}
                        name={`medications.${index}.frequency`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Frequency *</FormLabel>
                            <FormControl>
                              <Input placeholder="3 times daily" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`medications.${index}.duration`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Duration *</FormLabel>
                            <FormControl>
                              <Input placeholder="7 days" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`medications.${index}.quantity`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Quantity</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="21" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name={`medications.${index}.instructions`}
                      render={({ field }) => (
                        <FormItem className="mt-4">
                          <FormLabel>Special Instructions</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Take with food" {...field} />
                          </FormControl>
                          <FormDescription>Optional</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => append(defaultMedication)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Medication
                </Button>
              </div>
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Any additional information" {...field} />
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
                Create Prescription
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
