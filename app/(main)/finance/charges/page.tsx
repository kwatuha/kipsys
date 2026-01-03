"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, Download, Edit, Trash2, Filter, Loader2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AddServiceChargeForm } from "@/components/add-service-charge-form"
import { serviceChargeApi } from "@/lib/api"
import { toast } from "@/components/ui/use-toast"
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

interface ServiceCharge {
  chargeId: number
  chargeCode: string
  name: string
  category: string | null
  department: string | null
  cost: number
  description: string | null
  status: string
  createdAt: string
  updatedAt: string
}

export default function HospitalChargesPage() {
  const [serviceCharges, setServiceCharges] = useState<ServiceCharge[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingCharge, setEditingCharge] = useState<ServiceCharge | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [chargeToDelete, setChargeToDelete] = useState<ServiceCharge | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [departmentFilter, setDepartmentFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  useEffect(() => {
    loadCharges()
  }, [categoryFilter, departmentFilter, statusFilter, searchTerm])

  const loadCharges = async () => {
    try {
      setLoading(true)
      const data = await serviceChargeApi.getAll(
        statusFilter !== "all" ? statusFilter : undefined,
        categoryFilter !== "all" ? categoryFilter : undefined,
        departmentFilter !== "all" ? departmentFilter : undefined,
        searchTerm || undefined
      )
      setServiceCharges(Array.isArray(data) ? data : [])
    } catch (error: any) {
      console.error("Error loading charges:", error)
      toast({
        title: "Error",
        description: "Failed to load service charges.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setEditingCharge(null)
    setShowAddForm(true)
  }

  const handleEdit = (charge: ServiceCharge) => {
    setEditingCharge(charge)
    setShowAddForm(true)
  }

  const handleDelete = (charge: ServiceCharge) => {
    setChargeToDelete(charge)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!chargeToDelete) return

    try {
      await serviceChargeApi.delete(chargeToDelete.chargeId.toString())
      toast({
        title: "Success",
        description: "Service charge deleted successfully.",
      })
      setDeleteDialogOpen(false)
      setChargeToDelete(null)
      loadCharges()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete service charge.",
        variant: "destructive",
      })
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", minimumFractionDigits: 0 }).format(amount)
  }

  const categories = Array.from(new Set(serviceCharges.map((charge) => charge.category).filter(Boolean)))
  const departments = Array.from(new Set(serviceCharges.map((charge) => charge.department).filter(Boolean)))

  const filteredCharges = serviceCharges // Already filtered by API

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Hospital Charges</h1>
          <p className="text-muted-foreground">Configure and manage service charges across all departments</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button onClick={handleAdd}>
            <Plus className="mr-2 h-4 w-4" />
            New Service Charge
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Services</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{serviceCharges.length}</div>
            <p className="text-xs text-muted-foreground">Across {categories.length} categories</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Charge</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {serviceCharges.length > 0
                ? formatCurrency(serviceCharges.reduce((sum, charge) => sum + parseFloat(charge.cost.toString()), 0) / serviceCharges.length)
                : formatCurrency(0)}
            </div>
            <p className="text-xs text-muted-foreground">Per service</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Highest Charge</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {serviceCharges.length > 0
                ? formatCurrency(Math.max(...serviceCharges.map((charge) => parseFloat(charge.cost.toString()))))
                : formatCurrency(0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {serviceCharges.length > 0
                ? serviceCharges.reduce((max, charge) => (parseFloat(charge.cost.toString()) > parseFloat(max.cost.toString()) ? charge : max), serviceCharges[0]).name
                : "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Departments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{departments.length}</div>
            <p className="text-xs text-muted-foreground">With configured charges</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Service Charges</CardTitle>
          <CardDescription>View and manage all hospital service charges</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category || ""}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments.map((department) => (
                      <SelectItem key={department} value={department || ""}>
                        {department}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search services..."
                  className="w-full pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {filteredCharges.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No service charges found.</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Charge Code</TableHead>
                      <TableHead>Service Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Cost</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Updated</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCharges.map((charge) => (
                      <TableRow key={charge.chargeId}>
                        <TableCell className="font-medium">{charge.chargeCode || "—"}</TableCell>
                        <TableCell>
                          {charge.name}
                          {charge.description && (
                            <div className="text-xs text-muted-foreground">{charge.description}</div>
                          )}
                        </TableCell>
                        <TableCell>{charge.category || "—"}</TableCell>
                        <TableCell>{charge.department || "—"}</TableCell>
                        <TableCell>{formatCurrency(parseFloat(charge.cost.toString()))}</TableCell>
                        <TableCell>
                          <Badge variant={charge.status === "Active" ? "default" : "secondary"}>
                            {charge.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(charge.updatedAt)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="outline" size="icon" onClick={() => handleEdit(charge)} title="Edit">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleDelete(charge)}
                              title="Delete"
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
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <AddServiceChargeForm
        open={showAddForm}
        onOpenChange={(open) => {
          setShowAddForm(open)
          if (!open) {
            setEditingCharge(null)
          }
        }}
        onSuccess={() => {
          loadCharges()
          setEditingCharge(null)
        }}
        editData={editingCharge}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Service Charge</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {chargeToDelete?.name}?
              {chargeToDelete && (
                <span className="block mt-2 text-sm">
                  This charge will be deactivated if it's used in any invoices, or permanently deleted if not in use.
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
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
