"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { pharmacyApi } from "@/lib/api"
import { toast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"

const branchSchema = z.object({
  branchCode: z.string().optional(),
  branchName: z.string().min(1, "Branch name is required"),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.union([z.string().email("Invalid email address"), z.literal("")]).optional(),
  isMainBranch: z.boolean().default(false),
  isActive: z.boolean().default(true),
  notes: z.string().optional(),
})

type BranchFormValues = z.infer<typeof branchSchema>

interface BranchFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  editData?: any
}

export function BranchForm({ open, onOpenChange, onSuccess, editData }: BranchFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<BranchFormValues>({
    resolver: zodResolver(branchSchema),
    defaultValues: {
      branchCode: "",
      branchName: "",
      address: "",
      phone: "",
      email: "",
      isMainBranch: false,
      isActive: true,
      notes: "",
    },
  })

  useEffect(() => {
    if (open) {
      if (editData) {
        console.log('BranchForm: Setting edit data', editData)
        form.reset({
          branchCode: editData.branchCode || "",
          branchName: editData.branchName || "",
          address: editData.address || "",
          phone: editData.phone || "",
          email: editData.email || "",
          isMainBranch: editData.isMainBranch === 1 || editData.isMainBranch === true,
          isActive: editData.isActive !== undefined ? (editData.isActive === 1 || editData.isActive === true) : true,
          notes: editData.notes || "",
        })
      } else {
        form.reset({
          branchCode: "",
          branchName: "",
          address: "",
          phone: "",
          email: "",
          isMainBranch: false,
          isActive: true,
          notes: "",
        })
      }
    }
  }, [open, editData, form])

  async function onSubmit(data: BranchFormValues) {
    try {
      setIsSubmitting(true)

      const payload: any = {
        branchName: data.branchName,
        address: data.address || undefined,
        phone: data.phone || undefined,
        email: data.email || undefined,
        isMainBranch: data.isMainBranch,
        isActive: data.isActive,
        notes: data.notes || undefined,
      }

      if (data.branchCode) {
        payload.branchCode = data.branchCode
      }

      console.log('BranchForm: Submitting', { editData, payload, isEdit: !!editData })

      if (editData && editData.branchId) {
        console.log('BranchForm: Updating branch', editData.branchId)
        await pharmacyApi.updateBranch(editData.branchId.toString(), payload)
        toast({
          title: "Success",
          description: "Branch updated successfully",
        })
      } else {
        console.log('BranchForm: Creating new branch')
        await pharmacyApi.createBranch(payload)
        toast({
          title: "Success",
          description: "Branch created successfully",
        })
      }

      onOpenChange(false)
      form.reset()
      if (onSuccess) {
        onSuccess()
      }
    } catch (error: any) {
      console.error("Error saving branch:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to save branch",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editData ? "Edit Branch" : "Add New Branch"}</DialogTitle>
          <DialogDescription>
            {editData ? "Update branch information" : "Register a new branch/facility"}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="branchCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Branch Code</FormLabel>
                    <FormControl>
                      <Input placeholder="Auto-generated if empty" {...field} />
                    </FormControl>
                    <FormDescription>Optional - will be auto-generated if not provided</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="branchName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Branch Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Main Branch" {...field} />
                    </FormControl>
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
                    <Textarea placeholder="Branch address" {...field} rows={2} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., +254 712 345 678" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="e.g., branch@hospital.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="isMainBranch"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Main Branch</FormLabel>
                      <FormDescription>
                        Set as the main branch. Only one branch can be the main branch.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Active</FormLabel>
                      <FormDescription>
                        Set whether this branch is active or inactive.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Additional notes" {...field} rows={3} />
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
                {isSubmitting ? "Saving..." : editData ? "Update Branch" : "Create Branch"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

