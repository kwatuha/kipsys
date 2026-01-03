"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { roleApi } from "@/lib/api"
import { toast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

const formSchema = z.object({
  roleName: z.string().min(1, "Role name is required"),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  privileges: z.array(z.number()).optional(),
})

type FormValues = z.infer<typeof formSchema>

interface RoleFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  role?: any
  privileges: any[]
}

export function RoleForm({ open, onOpenChange, onSuccess, role, privileges }: RoleFormProps) {
  const [loading, setLoading] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const isEditing = !!role

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      roleName: "",
      description: "",
      isActive: true,
      privileges: [],
    },
  })

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (open && isMounted) {
      if (role) {
        form.reset({
          roleName: role.roleName ?? "",
          description: role.description ?? "",
          isActive: role.isActive ?? true,
          privileges: role.privileges
            ? role.privileges.map((p: any) => p.privilegeId)
            : [],
        })
      } else {
        form.reset({
          roleName: "",
          description: "",
          isActive: true,
          privileges: [],
        })
      }
    }
  }, [role, open, isMounted, form])

  const onSubmit = async (data: FormValues) => {
    try {
      setLoading(true)
      const payload = {
        roleName: data.roleName,
        description: data.description || null,
        isActive: data.isActive,
        privileges: data.privileges || [],
      }

      if (isEditing) {
        await roleApi.update(role.roleId.toString(), payload)
        toast({
          title: "Success",
          description: "Role updated successfully.",
        })
      } else {
        await roleApi.create(payload)
        toast({
          title: "Success",
          description: "Role created successfully.",
        })
      }
      form.reset()
      onOpenChange(false)
      if (onSuccess) onSuccess()
    } catch (error: any) {
      console.error("Error saving role:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to save role.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Group privileges by module
  const groupedPrivileges = privileges.reduce((acc, priv) => {
    const module = priv.module || "Other"
    if (!acc[module]) {
      acc[module] = []
    }
    acc[module].push(priv)
    return acc
  }, {} as Record<string, any[]>)

  if (!isMounted) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Role" : "Add New Role"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update role information and privileges." : "Create a new role and assign privileges."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="roleName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Administrator" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Role description..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Active Status</FormLabel>
                    <FormDescription>
                      Enable or disable this role
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="privileges"
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel className="text-base">Privileges</FormLabel>
                    <FormDescription>
                      Select the privileges to assign to this role
                    </FormDescription>
                  </div>
                  <ScrollArea className="h-[300px] w-full rounded-md border p-4">
                    {Object.entries(groupedPrivileges).map(([module, modulePrivileges]) => (
                      <div key={module} className="mb-4">
                        <h4 className="text-sm font-semibold mb-2">{module}</h4>
                        <div className="space-y-2">
                          {modulePrivileges.map((priv) => (
                            <FormField
                              key={priv.privilegeId}
                              control={form.control}
                              name="privileges"
                              render={({ field }) => {
                                return (
                                  <FormItem
                                    key={priv.privilegeId}
                                    className="flex flex-row items-start space-x-3 space-y-0"
                                  >
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(priv.privilegeId)}
                                        onCheckedChange={(checked) => {
                                          return field.onChange(
                                            checked
                                              ? [...(field.value || []), priv.privilegeId]
                                              : field.value?.filter(
                                                  (value) => value !== priv.privilegeId
                                                )
                                          )
                                        }}
                                      />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                      <FormLabel className="text-sm font-normal">
                                        {priv.privilegeName}
                                      </FormLabel>
                                      {priv.description && (
                                        <FormDescription className="text-xs">
                                          {priv.description}
                                        </FormDescription>
                                      )}
                                    </div>
                                  </FormItem>
                                )
                              }}
                            />
                          ))}
                        </div>
                        <Separator className="mt-4" />
                      </div>
                    ))}
                  </ScrollArea>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? "Update" : "Create"} Role
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

