"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Search, Download, UserPlus, Edit, Trash2, Eye, Loader2 } from "lucide-react"
import { employeeApi } from "@/lib/api"
import { toast } from "@/components/ui/use-toast"
import { EmployeeForm } from "@/components/employee-form"
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

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTab, setSelectedTab] = useState("all")
  const [formOpen, setFormOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [viewEmployee, setViewEmployee] = useState<any>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [employeeToDelete, setEmployeeToDelete] = useState<any>(null)

  useEffect(() => {
    loadEmployees()
  }, [searchTerm, selectedTab])

  const loadEmployees = async () => {
    try {
      setLoading(true)
      const departmentId = selectedTab !== "all" ? selectedTab : undefined
      const response = await employeeApi.getAll(searchTerm || undefined, departmentId)
      setEmployees(response.employees || [])
    } catch (error: any) {
      console.error("Error loading employees:", error)
      toast({
        title: "Error",
        description: "Failed to load employees.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setSelectedEmployee(null)
    setFormOpen(true)
  }

  const handleEdit = (employee: any) => {
    setSelectedEmployee(employee)
    setFormOpen(true)
  }

  const handleView = async (employee: any) => {
    try {
      const fullEmployee = await employeeApi.getById(employee.employeeId.toString())
      setViewEmployee(fullEmployee)
      setViewDialogOpen(true)
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load employee details.",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async () => {
    if (!employeeToDelete) return

    try {
      await employeeApi.delete(employeeToDelete.employeeId.toString())
      toast({
        title: "Success",
        description: "Employee terminated successfully.",
      })
      setDeleteDialogOpen(false)
      setEmployeeToDelete(null)
      loadEmployees()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to terminate employee.",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: "default" | "secondary" | "outline" | "destructive"; label: string }> = {
      active: { variant: "default", label: "Active" },
      on_leave: { variant: "secondary", label: "On Leave" },
      terminated: { variant: "destructive", label: "Terminated" },
      resigned: { variant: "outline", label: "Resigned" },
    }

    const statusInfo = statusMap[status] || { variant: "outline" as const, label: status }
    return (
      <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
    )
  }

  const filteredEmployees = employees.filter((emp) => {
    if (selectedTab === "all") return true
    // For now, we'll filter by department name (you can enhance this with departmentId)
    const deptName = emp.departmentName?.toLowerCase() || ""
    if (selectedTab === "medical") return deptName.includes("medical")
    if (selectedTab === "admin") return deptName.includes("admin") || deptName.includes("finance") || deptName.includes("hr")
    if (selectedTab === "support") return deptName.includes("support") || deptName.includes("it") || deptName.includes("maintenance")
    return true
  })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Employee Management</h1>
          <p className="text-muted-foreground">Manage hospital staff and personnel</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button onClick={handleAdd}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Employee
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Employee Directory</CardTitle>
          <CardDescription>View and manage hospital staff</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <div className="flex items-center justify-between mb-4">
              <TabsList>
                <TabsTrigger value="all">All Staff</TabsTrigger>
                <TabsTrigger value="medical">Medical</TabsTrigger>
                <TabsTrigger value="admin">Administrative</TabsTrigger>
                <TabsTrigger value="support">Support</TabsTrigger>
              </TabsList>
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search employees..."
                  className="w-full pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <TabsContent value={selectedTab} className="space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredEmployees.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <p className="text-sm text-muted-foreground">No employees found</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Position</TableHead>
                        <TableHead>Join Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEmployees.map((employee) => (
                        <TableRow key={employee.employeeId}>
                          <TableCell className="font-medium">{employee.employeeNumber}</TableCell>
                          <TableCell>{employee.fullName || `${employee.firstName} ${employee.lastName}`}</TableCell>
                          <TableCell>{employee.departmentName || "—"}</TableCell>
                          <TableCell>{employee.positionTitle || "—"}</TableCell>
                          <TableCell>
                            {employee.hireDate ? new Date(employee.hireDate).toLocaleDateString() : "—"}
                          </TableCell>
                          <TableCell>{getStatusBadge(employee.status)}</TableCell>
                          <TableCell>{employee.phone || employee.email || "—"}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleView(employee)}
                                className="h-8 w-8"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(employee)}
                                className="h-8 w-8"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setEmployeeToDelete(employee)
                                  setDeleteDialogOpen(true)
                                }}
                                className="h-8 w-8 text-destructive hover:text-destructive"
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
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <EmployeeForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSuccess={loadEmployees}
        employee={selectedEmployee}
      />

      {viewEmployee && (
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Employee Details</DialogTitle>
              <DialogDescription>View complete employee information</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Employee Number</p>
                  <p className="text-sm">{viewEmployee.employeeNumber}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Full Name</p>
                  <p className="text-sm">{viewEmployee.fullName || `${viewEmployee.firstName} ${viewEmployee.lastName}`}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Department</p>
                  <p className="text-sm">{viewEmployee.departmentName || "—"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Position</p>
                  <p className="text-sm">{viewEmployee.positionTitle || "—"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Hire Date</p>
                  <p className="text-sm">
                    {viewEmployee.hireDate ? new Date(viewEmployee.hireDate).toLocaleDateString() : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <p className="text-sm">{getStatusBadge(viewEmployee.status)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Phone</p>
                  <p className="text-sm">{viewEmployee.phone || "—"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p className="text-sm">{viewEmployee.email || "—"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Employment Type</p>
                  <p className="text-sm">{viewEmployee.employmentType || "—"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Gender</p>
                  <p className="text-sm">{viewEmployee.gender || "—"}</p>
                </div>
              </div>
              {viewEmployee.address && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Address</p>
                  <p className="text-sm">{viewEmployee.address}</p>
                </div>
              )}
              {viewEmployee.notes && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Notes</p>
                  <p className="text-sm">{viewEmployee.notes}</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Terminate Employee</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to terminate {employeeToDelete?.fullName || employeeToDelete?.firstName}? This action will mark the employee as terminated.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Terminate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
