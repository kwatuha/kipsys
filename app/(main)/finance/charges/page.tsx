"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, Download, Edit, Trash2, Filter } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AddServiceChargeForm } from "@/components/add-service-charge-form"

export default function HospitalChargesPage() {
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingCharge, setEditingCharge] = useState<ServiceCharge | null>(null)

  // Sample data for service charges
  const serviceCharges: ServiceCharge[] = [
    {
      id: "SC001",
      name: "General Consultation",
      category: "Consultation",
      department: "Outpatient",
      cost: 5000,
      description: "General doctor consultation fee",
      status: "Active",
      lastUpdated: "2023-05-10",
    },
    {
      id: "SC002",
      name: "Specialist Consultation",
      category: "Consultation",
      department: "Outpatient",
      cost: 10000,
      description: "Specialist doctor consultation fee",
      status: "Active",
      lastUpdated: "2023-05-10",
    },
    {
      id: "SC003",
      name: "Complete Blood Count (CBC)",
      category: "Laboratory",
      department: "Laboratory",
      cost: 2500,
      description: "Complete blood count test",
      status: "Active",
      lastUpdated: "2023-05-12",
    },
    {
      id: "SC004",
      name: "Chest X-Ray",
      category: "Radiology",
      department: "Radiology",
      cost: 8000,
      description: "Standard chest X-ray",
      status: "Active",
      lastUpdated: "2023-05-15",
    },
    {
      id: "SC005",
      name: "Ultrasound - Abdominal",
      category: "Radiology",
      department: "Radiology",
      cost: 12000,
      description: "Abdominal ultrasound scan",
      status: "Active",
      lastUpdated: "2023-05-15",
    },
    {
      id: "SC006",
      name: "Ward Bed - General",
      category: "Inpatient",
      department: "Inpatient",
      cost: 5000,
      description: "General ward bed charge per day",
      status: "Active",
      lastUpdated: "2023-05-18",
    },
    {
      id: "SC007",
      name: "Ward Bed - Private",
      category: "Inpatient",
      department: "Inpatient",
      cost: 15000,
      description: "Private ward bed charge per day",
      status: "Active",
      lastUpdated: "2023-05-18",
    },
    {
      id: "SC008",
      name: "ICU Bed",
      category: "Inpatient",
      department: "ICU",
      cost: 30000,
      description: "ICU bed charge per day",
      status: "Active",
      lastUpdated: "2023-05-18",
    },
    {
      id: "SC009",
      name: "Normal Delivery",
      category: "Maternity",
      department: "Maternity",
      cost: 25000,
      description: "Normal delivery package",
      status: "Active",
      lastUpdated: "2023-05-20",
    },
    {
      id: "SC010",
      name: "Cesarean Section",
      category: "Maternity",
      department: "Maternity",
      cost: 120000,
      description: "Cesarean section delivery package",
      status: "Active",
      lastUpdated: "2023-05-20",
    },
    {
      id: "SC011",
      name: "Minor Surgery",
      category: "Surgery",
      department: "Surgery",
      cost: 35000,
      description: "Minor surgical procedure",
      status: "Active",
      lastUpdated: "2023-05-22",
    },
    {
      id: "SC012",
      name: "Major Surgery",
      category: "Surgery",
      department: "Surgery",
      cost: 150000,
      description: "Major surgical procedure",
      status: "Active",
      lastUpdated: "2023-05-22",
    },
    {
      id: "SC013",
      name: "Dental Cleaning",
      category: "Dental",
      department: "Dental",
      cost: 8000,
      description: "Dental cleaning and check-up",
      status: "Active",
      lastUpdated: "2023-05-25",
    },
    {
      id: "SC014",
      name: "Dental Filling",
      category: "Dental",
      department: "Dental",
      cost: 12000,
      description: "Dental filling procedure",
      status: "Active",
      lastUpdated: "2023-05-25",
    },
    {
      id: "SC015",
      name: "Physiotherapy Session",
      category: "Rehabilitation",
      department: "Physiotherapy",
      cost: 6000,
      description: "Physiotherapy session (1 hour)",
      status: "Active",
      lastUpdated: "2023-05-28",
    },
  ]

  const categories = Array.from(new Set(serviceCharges.map((charge) => charge.category)))
  const departments = Array.from(new Set(serviceCharges.map((charge) => charge.department)))

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES" }).format(amount)
  }

  const handleEdit = (charge: ServiceCharge) => {
    setEditingCharge(charge)
    setShowAddForm(true)
  }

  const handleDelete = (id: string) => {
    // In a real application, this would call an API to delete the charge
    console.log(`Delete charge with ID: ${id}`)
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
          <Button
            onClick={() => {
              setEditingCharge(null)
              setShowAddForm(true)
            }}
          >
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
              {formatCurrency(serviceCharges.reduce((sum, charge) => sum + charge.cost, 0) / serviceCharges.length)}
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
              {formatCurrency(Math.max(...serviceCharges.map((charge) => charge.cost)))}
            </div>
            <p className="text-xs text-muted-foreground">Major Surgery</p>
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
                <Select>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category.toLowerCase()}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments.map((department) => (
                      <SelectItem key={department} value={department.toLowerCase()}>
                        {department}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input type="search" placeholder="Search services..." className="w-full pl-8" />
              </div>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service ID</TableHead>
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
                  {serviceCharges.map((charge) => (
                    <TableRow key={charge.id}>
                      <TableCell className="font-medium">{charge.id}</TableCell>
                      <TableCell>
                        {charge.name}
                        <div className="text-xs text-muted-foreground">{charge.description}</div>
                      </TableCell>
                      <TableCell>{charge.category}</TableCell>
                      <TableCell>{charge.department}</TableCell>
                      <TableCell>{formatCurrency(charge.cost)}</TableCell>
                      <TableCell>
                        <Badge variant={charge.status === "Active" ? "default" : "secondary"}>{charge.status}</Badge>
                      </TableCell>
                      <TableCell>{charge.lastUpdated}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="icon" onClick={() => handleEdit(charge)}>
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button variant="outline" size="icon" onClick={() => handleDelete(charge.id)}>
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      <AddServiceChargeForm open={showAddForm} onOpenChange={setShowAddForm} editData={editingCharge} />
    </div>
  )
}

// Type definition for service charge
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
