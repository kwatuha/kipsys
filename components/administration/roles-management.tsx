"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Edit, Trash2, Eye, Shield, Loader2 } from "lucide-react"
import { roleApi, privilegeApi } from "@/lib/api"
import { toast } from "@/components/ui/use-toast"
import { RoleForm } from "@/components/administration/role-form"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { formatDate } from "@/lib/date-utils"

export function RolesManagement() {
  const [roles, setRoles] = useState<any[]>([])
  const [privileges, setPrivileges] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [formOpen, setFormOpen] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState<any>(null)
  const [roleToDelete, setRoleToDelete] = useState<any>(null)

  useEffect(() => {
    loadRoles()
    loadPrivileges()
  }, [])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadRoles()
    }, 300)
    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  const loadRoles = async () => {
    try {
      setLoading(true)
      const data = await roleApi.getAll()
      setRoles(Array.isArray(data) ? data : [])
    } catch (error: any) {
      console.error("Error loading roles:", error)
      toast({
        title: "Error",
        description: "Failed to load roles.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadPrivileges = async () => {
    try {
      const data = await privilegeApi.getAll()
      setPrivileges(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Error loading privileges:", error)
    }
  }

  const handleAdd = () => {
    setSelectedRole(null)
    setFormOpen(true)
  }

  const handleEdit = async (role: any) => {
    try {
      const fullRole = await roleApi.getById(role.roleId.toString())
      setSelectedRole(fullRole)
      setFormOpen(true)
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load role details.",
        variant: "destructive",
      })
    }
  }

  const handleView = async (role: any) => {
    try {
      const fullRole = await roleApi.getById(role.roleId.toString())
      setSelectedRole(fullRole)
      setViewDialogOpen(true)
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load role details.",
        variant: "destructive",
      })
    }
  }

  const handleDelete = (role: any) => {
    setRoleToDelete(role)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!roleToDelete) return

    try {
      await roleApi.delete(roleToDelete.roleId.toString())
      toast({
        title: "Success",
        description: "Role deactivated successfully.",
      })
      setDeleteDialogOpen(false)
      setRoleToDelete(null)
      loadRoles()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete role.",
        variant: "destructive",
      })
    }
  }

  const filteredRoles = roles.filter((role) => {
    const search = searchTerm.toLowerCase()
    return (
      role.roleName?.toLowerCase().includes(search) ||
      role.description?.toLowerCase().includes(search)
    )
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Role Management</h2>
          <p className="text-sm text-muted-foreground">
            Manage system roles and their permissions
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add Role
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Roles</CardTitle>
              <CardDescription>
                All system roles ({filteredRoles.length})
              </CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search roles..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredRoles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No roles found.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead>Privileges</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRoles.map((role) => (
                  <TableRow key={role.roleId}>
                    <TableCell className="font-medium">{role.roleName}</TableCell>
                    <TableCell className="max-w-md truncate">
                      {role.description || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{role.userCount || 0}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{role.privilegeCount || 0}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={role.isActive ? "default" : "secondary"}>
                        {role.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(role.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleView(role)}
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(role)}
                          title="Edit Role"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(role)}
                          title="Delete Role"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Role Form */}
      <RoleForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) {
            setSelectedRole(null)
          }
        }}
        onSuccess={() => {
          loadRoles()
          setSelectedRole(null)
        }}
        role={selectedRole}
        privileges={privileges}
      />

      {/* View Dialog */}
      {selectedRole && (
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Role Details</DialogTitle>
              <DialogDescription>View complete role information</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Role Name</p>
                  <p className="text-sm font-semibold">{selectedRole.roleName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <Badge variant={selectedRole.isActive ? "default" : "secondary"}>
                    {selectedRole.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="col-span-2">
                  <p className="text-sm font-medium text-muted-foreground">Description</p>
                  <p className="text-sm">{selectedRole.description || "—"}</p>
                </div>
              </div>
              {selectedRole.privileges && selectedRole.privileges.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    Assigned Privileges ({selectedRole.privileges.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedRole.privileges.map((priv: any) => (
                      <Badge key={priv.privilegeId} variant="outline">
                        {priv.privilegeName}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Role</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate {roleToDelete?.roleName}?
              {roleToDelete?.userCount > 0 && (
                <span className="block mt-2 text-destructive">
                  Warning: This role is assigned to {roleToDelete.userCount} user(s).
                  Please reassign them first.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground"
            >
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

