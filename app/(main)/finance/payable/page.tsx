"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, Download } from "lucide-react"
import { AddPayableInvoiceForm } from "@/components/add-payable-invoice-form"

export default function AccountsPayablePage() {
  const [openAddInvoiceForm, setOpenAddInvoiceForm] = useState(false)

  const invoices = [
    {
      id: "INV-5001",
      vendor: "Medical Supplies Ltd",
      amount: 250000,
      issueDate: "2023-04-05",
      dueDate: "2023-05-05",
      status: "Pending",
      category: "Medical Supplies",
      reference: "PO-2023-0045",
    },
    {
      id: "INV-5002",
      vendor: "Pharma Distributors",
      amount: 180000,
      issueDate: "2023-04-08",
      dueDate: "2023-05-08",
      status: "Paid",
      category: "Pharmaceuticals",
      reference: "PO-2023-0046",
    },
    {
      id: "INV-5003",
      vendor: "Lab Equipment Co.",
      amount: 350000,
      issueDate: "2023-04-10",
      dueDate: "2023-05-10",
      status: "Pending",
      category: "Laboratory Equipment",
      reference: "PO-2023-0047",
    },
    {
      id: "INV-5004",
      vendor: "Office Solutions",
      amount: 75000,
      issueDate: "2023-04-12",
      dueDate: "2023-05-12",
      status: "Overdue",
      category: "Office Supplies",
      reference: "PO-2023-0048",
    },
    {
      id: "INV-5005",
      vendor: "Cleaning Services Inc.",
      amount: 120000,
      issueDate: "2023-04-15",
      dueDate: "2023-05-15",
      status: "Pending",
      category: "Cleaning Services",
      reference: "PO-2023-0049",
    },
  ]

  const vendors = [
    {
      id: "V-1001",
      name: "Medical Supplies Ltd",
      contact: "John Smith",
      phone: "+254 712 345 678",
      email: "john@medicalsupplies.co.ke",
      category: "Medical Supplies",
      status: "Active",
      balance: 250000,
    },
    {
      id: "V-1002",
      name: "Pharma Distributors",
      contact: "Sarah Johnson",
      phone: "+254 723 456 789",
      email: "sarah@pharmadist.co.ke",
      category: "Pharmaceuticals",
      status: "Active",
      balance: 0,
    },
    {
      id: "V-1003",
      name: "Lab Equipment Co.",
      contact: "Michael Brown",
      phone: "+254 734 567 890",
      email: "michael@labequipment.co.ke",
      category: "Laboratory Equipment",
      status: "Active",
      balance: 350000,
    },
    {
      id: "V-1004",
      name: "Office Solutions",
      contact: "Emily Davis",
      phone: "+254 745 678 901",
      email: "emily@officesolutions.co.ke",
      category: "Office Supplies",
      status: "Active",
      balance: 75000,
    },
    {
      id: "V-1005",
      name: "Cleaning Services Inc.",
      contact: "David Wilson",
      phone: "+254 756 789 012",
      email: "david@cleaningservices.co.ke",
      category: "Cleaning Services",
      status: "Active",
      balance: 120000,
    },
  ]

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES" }).format(amount)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Accounts Payable</h1>
          <p className="text-muted-foreground">Manage vendor invoices and payments</p>
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
            <CardTitle className="text-sm font-medium">Total Payables</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(795000)}</div>
            <p className="text-xs text-muted-foreground">5 outstanding invoices</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(720000)}</div>
            <p className="text-xs text-muted-foreground">3 pending invoices</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(75000)}</div>
            <p className="text-xs text-muted-foreground">1 overdue invoice</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Paid (This Month)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(180000)}</div>
            <p className="text-xs text-muted-foreground">1 paid invoice</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="invoices" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="vendors">Vendors</TabsTrigger>
        </TabsList>

        <TabsContent value="invoices" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Vendor Invoices</CardTitle>
              <CardDescription>View and manage vendor invoices</CardDescription>
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
                      <TableHead>Vendor</TableHead>
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
                        <TableCell>{invoice.vendor}</TableCell>
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
                              {invoice.status === "Paid" ? "Receipt" : "Pay"}
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

        <TabsContent value="vendors" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Vendor Directory</CardTitle>
              <CardDescription>View and manage vendors</CardDescription>
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
                  <Input type="search" placeholder="Search vendors..." className="w-full pl-8" />
                </div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vendor ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Outstanding Balance</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vendors.map((vendor) => (
                      <TableRow key={vendor.id}>
                        <TableCell className="font-medium">{vendor.id}</TableCell>
                        <TableCell>{vendor.name}</TableCell>
                        <TableCell>
                          {vendor.contact}
                          <div className="text-xs text-muted-foreground">{vendor.email}</div>
                        </TableCell>
                        <TableCell>{vendor.category}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{vendor.status}</Badge>
                        </TableCell>
                        <TableCell>{formatCurrency(vendor.balance)}</TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm">
                            View
                          </Button>
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

      <AddPayableInvoiceForm open={openAddInvoiceForm} onOpenChange={setOpenAddInvoiceForm} />
    </div>
  )
}
