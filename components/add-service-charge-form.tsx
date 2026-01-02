"use client"
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
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

// Define the form schema
const formSchema = z.object({
  name: z.string().min(2, { message: "Service name must be at least 2 characters." }),
  category: z.string().min(1, { message: "Please select a category." }),
  department: z.string().min(1, { message: "Please select a department." }),
  cost: z.coerce.number().min(0, { message: "Cost must be a positive number." }),
  description: z.string().optional(),
  status: z.boolean().default(true),
})

type FormValues = z.infer<typeof formSchema>

// Sample data for dropdowns
const categories = [
  "Consultation",
  "Laboratory",
  "Radiology",
  "Inpatient",
  "Maternity",
  "Surgery",
  "Dental",
  "Rehabilitation",
  "Pharmacy",
  "Emergency",
  "Other",
]

const departments = [
  "Outpatient",
  "Laboratory",
  "Radiology",
  "Inpatient",
  "Maternity",
  "Surgery",
  "Dental",
  "Physiotherapy",
  "Pharmacy",
  "Emergency",
  "ICU",
  "Other",
]

interface ServiceCharge {
  id: string
  name: string
  category: string
  department: string
  cost: number
  description: string
  status: string
  lastUpdated: string
}

interface AddServiceChargeFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editData: ServiceCharge | null
}

export function AddServiceChargeForm({ open, onOpenChange, editData }: AddServiceChargeFormProps) {
  const isEditing = !!editData

  // Initialize the form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: editData?.name || "",
      category: editData?.category || "",
      department: editData?.department || "",
      cost: editData?.cost || 0,
      description: editData?.description || "",
      status: editData?.status === "Active" || true,
    },
  })

  const onSubmit = (data: FormValues) => {
    // In a real application, this would call an API to save the data
    console.log("Form submitted:", data)

    // Close the dialog
    onOpenChange(false)

    // Reset the form
    form.reset()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Service Charge" : "Add New Service Charge"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the details for this service charge."
              : "Add a new service charge to the hospital's pricing structure."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter service name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cost (KES)</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" step="100" placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
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
                    <FormLabel>Department</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a department" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {departments.map((department) => (
                          <SelectItem key={department} value={department}>
                            {department}
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
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter a description of the service" {...field} />
                  </FormControl>
                  <FormDescription>Provide a brief description of what this service includes.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Active Status</FormLabel>
                    <FormDescription>
                      Set whether this service charge is currently active and available for billing.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">{isEditing ? "Update" : "Add"} Service Charge</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
