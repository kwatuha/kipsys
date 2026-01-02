"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, Download } from "lucide-react"
import { AddReceivableInvoiceForm } from "@/components/add-receivable-invoice-form"

export default function AccountsReceivablePage() {
  const [openAddInvoiceForm, setOpenAddInvoiceForm] = useState(false)

  const invoices = [
    {
      id: "INV-1001",
      patient: "John Imbayi",
      patientId: "P-1001",
      amount: 25000,
      issueDate: "2023-04-15",
      dueDate: "2023-05-15",
      status: "Paid",
      category: "Consultation",
      reference: "CONS-2023-1001",
    },
    {
      id: "INV-1002",
      patient: "Sarah Lwikane",
      patientId: "P-1002",
      amount: 35000,
      issueDate: "2023-04-18",
      dueDate: "2023-05-18",
      status: "Pending",
      category: "Laboratory",
      reference: "LAB-2023-1002",
    },
    {
      id: "INV-1003",
      patient: "Michael Imbunya",
      patientId: "P-1003",
      amount: 150000,
      issueDate: "2023-04-20",
      dueDate: "2023-05-20",
      status: "Pending",
      category: "Inpatient",
      reference: "INP-2023-1003",
    },
    {
      id: "INV-1004",
      patient: "Emily Kimani",
      patientId: "P-1004",
      amount: 45000,
      issueDate: "2023-04-10",
      dueDate: "2023-05-10",
      status: "Overdue",
      category: "Radiology",
      reference: "RAD-2023-1004",
    },
    {
      id: "INV-1005",
      patient: "David Kimutai",
      patientId: "P-1005",
      amount: 18000,
      issueDate: "2023-04-12",
      dueDate: "2023-05-12",
      status: "Paid",
      category: "Pharmacy",
      reference: "PHARM-2023-1005",
    },
  ]

  const insurances = [
    {
      id: "INS-1001",
      name: "NHIF",
      contact: "John Doe",
      phone: "+254 712 345 678",
      email: "john.doe@nhif.co.ke",
      status: "Active",
      balance: 120000,
      lastPayment: "2023-04-10",
    },
    {
      id: "INS-1002",
      name: "AAR Insurance",
      contact: "Jane Smith",
      phone: "+254 723 456 789",
      email: "jane.smith@aar.co.ke",
      status: "Active",
      balance: 85000,
      lastPayment: "2023-04-15",
    },
    {
      id: "INS-1003",
      name: "Jubilee Insurance",
      contact: "Michael Johnson",
      phone: "+254 734 567 890",
      email: "michael.johnson@jubilee.co.ke",
      status: "Active",
      balance: 65000,
      lastPayment: "2023-04-18",
    },
    {
      id: "INS-1004",
      name: "Madison Insurance",
      contact: "Emily Brown",
      phone: "+254 745 678 901",
      email: "emily.brown@madison.co.ke",
      status: "Active",
      balance: 45000,
      lastPayment: "2023-04-20",
    },
    {
      id: "INS-1005",
      name: "Britam Insurance",
      contact: "David Wilson",
      phone: "+254 756 789 012",
      email: "david.wilson@britam.co.ke",
      status: "Active",
      balance: 30000,
      lastPayment: "2023-04-22",
    },
  ]

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES" }).format(amount)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Accounts Receivable</h1>
          <p className="text-muted-foreground">Manage patient and insurance invoices</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button onClick={() => setOpenAddInvoiceForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Invoice
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Receivables</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(273000)}</div>
            <p className="text-xs text-muted-foreground">5 outstanding invoices</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(185000)}</div>
            <p className="text-xs text-muted-foreground">2 pending invoices</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(45000)}</div>
            <p className="text-xs text-muted-foreground">1 overdue invoice</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Paid (This Month)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(43000)}</div>
            <p className="text-xs text-muted-foreground">2 paid invoices</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="invoices" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="insurance">Insurance</TabsTrigger>
        </TabsList>

        <TabsContent value="invoices" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Patient Invoices</CardTitle>
              <CardDescription>View and manage patient invoices</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    All
                  </Button>
                  <Button variant="outline" size="sm">
                    Pending
                  </Button>
                  <Button variant="outline" size="sm">
                    Overdue
                  </Button>
                  <Button variant="outline" size="sm">
                    Paid
                  </Button>
                </div>
                <div className="relative w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input type="search" placeholder="Search invoices..." className="w-full pl-8" />
                </div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice ID</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Issue Date</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">{invoice.id}</TableCell>
                        <TableCell>
                          {invoice.patient}
                          <div className="text-xs text-muted-foreground">{invoice.patientId}</div>
                        </TableCell>
                        <TableCell>{formatCurrency(invoice.amount)}</TableCell>
                        <TableCell>{invoice.issueDate}</TableCell>
                        <TableCell>{invoice.dueDate}</TableCell>
                        <TableCell>{invoice.category}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              invoice.status === "Paid"
                                ? "default"
                                : invoice.status === "Overdue"
                                  ? "destructive"
                                  : "secondary"
                            }
                          >
                            {invoice.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              View
                            </Button>
                            <Button variant="outline" size="sm">
                              {invoice.status === "Paid" ? "Receipt" : "Record Payment"}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insurance" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Insurance Companies</CardTitle>
              <CardDescription>View and manage insurance claims and payments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    All
                  </Button>
                  <Button variant="outline" size="sm">
                    With Balance
                  </Button>
                  <Button variant="outline" size="sm">
                    No Balance
                  </Button>
                </div>
                <div className="relative w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input type="search" placeholder="Search insurance..." className="w-full pl-8" />
                </div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Insurance ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Outstanding Balance</TableHead>
                      <TableHead>Last Payment</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {insurances.map((insurance) => (
                      <TableRow key={insurance.id}>
                        <TableCell className="font-medium">{insurance.id}</TableCell>
                        <TableCell>{insurance.name}</TableCell>
                        <TableCell>
                          {insurance.contact}
                          <div className="text-xs text-muted-foreground">{insurance.email}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{insurance.status}</Badge>
                        </TableCell>
                        <TableCell>{formatCurrency(insurance.balance)}</TableCell>
                        <TableCell>{insurance.lastPayment}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              View
                            </Button>
                            <Button variant="outline" size="sm">
                              Claims
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AddReceivableInvoiceForm open={openAddInvoiceForm} onOpenChange={setOpenAddInvoiceForm} />
    </div>
  )
}
