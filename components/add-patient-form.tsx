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
import { BirthDatePicker } from "@/components/birth-date-picker"
import { insuranceApi } from "@/lib/api"

const patientFormSchema = z.object({
  firstName: z.string().min(2, {
    message: "First name must be at least 2 characters.",
  }),
  lastName: z.string().min(2, {
    message: "Last name must be at least 2 characters.",
  }),
  dateOfBirth: z.date({
    required_error: "Date of birth is required.",
  }),
  gender: z.string({
    required_error: "Please select a gender.",
  }),
  patientType: z.enum(['paying', 'insurance'], {
    required_error: "Please select patient type.",
  }),
  idNumber: z.string().optional(),
  phone: z.string().min(10, {
    message: "Phone number must be at least 10 characters.",
  }),
  email: z.string().email().optional(),
  address: z.string().optional(),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
  bloodGroup: z.string().optional(),
  allergies: z.string().optional(),
  medicalHistory: z.string().optional(),
  insuranceCompanyId: z.string().optional(),
  insuranceNumber: z.string().optional(),
})

type PatientFormValues = z.infer<typeof patientFormSchema>

const PATIENT_STORAGE_KEY = 'patient_registration_form_draft'

const defaultValues: Partial<PatientFormValues> = {
  firstName: "",
  lastName: "",
  gender: "",
  patientType: "paying",
  idNumber: "",
  phone: "",
  email: "",
  address: "",
  emergencyContact: "",
  emergencyPhone: "",
  bloodGroup: "",
  allergies: "",
  medicalHistory: "",
  insuranceCompanyId: "",
  insuranceNumber: "",
}

export function AddPatientForm({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [insuranceCompanies, setInsuranceCompanies] = useState<any[]>([])
  const [loadingCompanies, setLoadingCompanies] = useState(false)

  const form = useForm<PatientFormValues>({
    resolver: zodResolver(patientFormSchema),
    defaultValues,
  })

  // Load insurance companies when form opens
  useEffect(() => {
    if (open) {
      loadInsuranceCompanies()
    }
  }, [open])

  const loadInsuranceCompanies = async () => {
    try {
      setLoadingCompanies(true)
      const companies = await insuranceApi.getProviders('active')
      setInsuranceCompanies(companies || [])
    } catch (error) {
      console.error('Error loading insurance companies:', error)
    } finally {
      setLoadingCompanies(false)
    }
  }

  // Load saved draft when form opens
  useEffect(() => {
    if (open) {
      const savedDraft = loadDraftFromStorage()
      if (savedDraft) {
        // Normalize draft values to ensure all fields are defined (not undefined)
        // Convert date string back to Date object if present
        const normalizedDraft = {
          firstName: savedDraft.firstName ?? "",
          lastName: savedDraft.lastName ?? "",
          dateOfBirth: savedDraft.dateOfBirth
            ? (typeof savedDraft.dateOfBirth === 'string'
                ? new Date(savedDraft.dateOfBirth)
                : savedDraft.dateOfBirth)
            : undefined,
          gender: savedDraft.gender ?? "",
          patientType: savedDraft.patientType ?? "paying",
          idNumber: savedDraft.idNumber ?? "",
          phone: savedDraft.phone ?? "",
          email: savedDraft.email ?? "",
          address: savedDraft.address ?? "",
          emergencyContact: savedDraft.emergencyContact ?? "",
          emergencyPhone: savedDraft.emergencyPhone ?? "",
          bloodGroup: savedDraft.bloodGroup ?? "",
          allergies: savedDraft.allergies ?? "",
          medicalHistory: savedDraft.medicalHistory ?? "",
          insuranceCompanyId: savedDraft.insuranceCompanyId ?? "",
          insuranceNumber: savedDraft.insuranceNumber ?? "",
        }
        form.reset(normalizedDraft)
      } else {
        form.reset(defaultValues)
      }
    }
  }, [open, form])

  // Clear insurance fields when patient type changes to "paying"
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'patientType' && value.patientType === 'paying') {
        form.setValue('insuranceCompanyId', '')
        form.setValue('insuranceNumber', '')
      }
    })
    return () => subscription.unsubscribe()
  }, [form])

  // Auto-save form data to localStorage
  useEffect(() => {
    if (!open) return

    const subscription = form.watch((value) => {
      const hasData = value.firstName || value.lastName || value.phone ||
                      value.email || value.address || value.idNumber ||
                      value.emergencyContact || value.emergencyPhone ||
                      value.bloodGroup || value.allergies || value.medicalHistory ||
                      value.insuranceCompanyId || value.insuranceNumber || value.patientType

      if (hasData) {
        saveDraftToStorage(value as any)
      } else {
        clearDraftFromStorage()
      }
    })

    return () => subscription.unsubscribe()
  }, [form, open])

  async function onSubmit(data: PatientFormValues) {
    setIsSubmitting(true)
    try {
      const { patientApi } = await import('@/lib/api')

      // Format data for API
      const patientData = {
        firstName: data.firstName,
        lastName: data.lastName,
        dateOfBirth: data.dateOfBirth.toISOString().split('T')[0],
        gender: data.gender,
        patientType: data.patientType,
        phone: data.phone,
        email: data.email || null,
        address: data.address || null,
        idNumber: data.idNumber || null,
        bloodGroup: data.bloodGroup || null,
        allergies: data.allergies || null,
        medicalHistory: data.medicalHistory || null,
        nextOfKinName: data.emergencyContact || null,
        nextOfKinPhone: data.emergencyPhone || null,
        insuranceCompanyId: data.insuranceCompanyId ? parseInt(data.insuranceCompanyId) : null,
        insuranceNumber: data.insuranceNumber || null,
      }

      await patientApi.create(patientData)

      // Clear draft after successful submission
      clearDraftFromStorage()
      onOpenChange(false)
      form.reset()
    } catch (error: any) {
      console.error('Error creating patient:', error)
      alert(error.message || 'Failed to register patient. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Draft management functions
  const saveDraftToStorage = (data: Partial<PatientFormValues>) => {
    if (typeof window === 'undefined') return
    try {
      const dataToSave = {
        ...data,
        dateOfBirth: data.dateOfBirth instanceof Date
          ? data.dateOfBirth.toISOString()
          : data.dateOfBirth,
      }
      localStorage.setItem(PATIENT_STORAGE_KEY, JSON.stringify(dataToSave))
    } catch (error) {
      console.error('Error saving draft to localStorage:', error)
    }
  }

  const loadDraftFromStorage = (): Partial<PatientFormValues> | null => {
    if (typeof window === 'undefined') return null
    try {
      const saved = localStorage.getItem(PATIENT_STORAGE_KEY)
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
      localStorage.removeItem(PATIENT_STORAGE_KEY)
    } catch (error) {
      console.error('Error clearing draft from localStorage:', error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Patient</DialogTitle>
          <DialogDescription>Enter the patient's information to register them in the system.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Imbayi" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dateOfBirth"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date of Birth</FormLabel>
                    <FormControl>
                      <BirthDatePicker date={field.value} onSelect={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
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
                name="patientType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Patient Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || "paying"}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select patient type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="paying">Paying</SelectItem>
                        <SelectItem value="insurance">Insurance</SelectItem>
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
                name="idNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ID Number</FormLabel>
                    <FormControl>
                      <Input placeholder="12345678" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="+254 712 345 678" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="john.imbayi@example.com" {...field} />
                    </FormControl>
                    <FormDescription>Optional</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bloodGroup"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Blood Group</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select blood group" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="A+">A+</SelectItem>
                        <SelectItem value="A-">A-</SelectItem>
                        <SelectItem value="B+">B+</SelectItem>
                        <SelectItem value="B-">B-</SelectItem>
                        <SelectItem value="AB+">AB+</SelectItem>
                        <SelectItem value="AB-">AB-</SelectItem>
                        <SelectItem value="O+">O+</SelectItem>
                        <SelectItem value="O-">O-</SelectItem>
                        <SelectItem value="unknown">Unknown</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>Optional</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Textarea placeholder="123 Main St, Nairobi" {...field} />
                  </FormControl>
                  <FormDescription>Optional</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="emergencyContact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Emergency Contact Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Jane Imbayi" {...field} />
                    </FormControl>
                    <FormDescription>Optional</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="emergencyPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Emergency Contact Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="+254 723 456 789" {...field} />
                    </FormControl>
                    <FormDescription>Optional</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="allergies"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Allergies</FormLabel>
                  <FormControl>
                    <Textarea placeholder="List any known allergies" {...field} />
                  </FormControl>
                  <FormDescription>Optional</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="medicalHistory"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Medical History</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Brief medical history" {...field} />
                  </FormControl>
                  <FormDescription>Optional</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.watch('patientType') === 'insurance' && (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="insuranceCompanyId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Insurance Company</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || ""}
                        disabled={loadingCompanies}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={loadingCompanies ? "Loading..." : "Select insurance company"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {insuranceCompanies.map((company) => (
                            <SelectItem key={company.providerId} value={company.providerId.toString()}>
                              {company.providerName}
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
                  name="insuranceNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Insurance Number</FormLabel>
                      <FormControl>
                        <Input placeholder="INS-12345678" {...field} />
                      </FormControl>
                      <FormDescription>Optional</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Register Patient
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
