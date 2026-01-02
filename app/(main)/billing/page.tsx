"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, Download, FileText, Printer } from "lucide-react"

export default function BillingPage() {
  const bills = [
    {
      id: "BILL-1001",
      patient: "John Imbayi",
      patientId: "P-1001",
      date: "2023-04-15",
      amount: 25000,
      status: "Paid",
      paymentMethod: "Cash",
      items: [
        { description: "Consultation", amount: 5000 },
        { description: "Laboratory Tests", amount: 15000 },
        { description: "Medication", amount: 5000 },
      ],
    },
    {
      id: "BILL-1002",
      patient: "Sarah Lwikane",
      patientId: "P-1002",
      date: "2023-04-18",
      amount: 35000,
      status: "Pending",
      paymentMethod: "Insurance",
      items: [
        { description: "Consultation", amount: 5000 },
        { description: "Ultrasound", amount: 20000 },
        { description: "Medication", amount: 10000 },
      ],
    },
    {
      id: "BILL-1003",
      patient: "Michael Imbunya",
      patientId: "P-1003",
      date: "2023-04-20",
      amount: 150000,
      status: "Pending",
      paymentMethod: "Insurance",
      items: [
        { description: "Emergency Care", amount: 30000 },
        { description: "CT Scan", amount: 80000 },
        { description: "Medication", amount: 15000 },
        { description: "Admission (2 days)", amount: 25000 },
      ],
    },
    {
      id: "BILL-1004",
      patient: "Emily Kimani",
      patientId: "P-1004",
      date: "2023-04-10",
      amount: 45000,
      status: "Overdue",
      paymentMethod: "Credit",
      items: [
        { description: "Consultation", amount: 5000 },
        { description: "X-Ray", amount: 15000 },
        { description: "Physical Therapy", amount: 20000 },
        { description: "Medication", amount: 5000 },
      ],
    },
    {
      id: "BILL-1005",
      patient: "David Kimutai",
      patientId: "P-1005",
      date: "2023-04-12",
      amount: 18000,
      status: "Paid",
      paymentMethod: "M-Pesa",
      items: [
        { description: "Consultation", amount: 5000 },
        { description: "Blood Tests", amount: 8000 },
        { description: "Medication", amount: 5000 },
      ],
    },
  ]

  const payments = [
    {
      id: "PMT-1001",
      billId: "BILL-1001",
      patient: "John Imbayi",
      patientId: "P-1001",
      date: "2023-04-15",
      amount: 25000,
      method: "Cash",
      reference: "CASH-2023-1001",
      receivedBy: "Grace Savai",
    },
    {
      id: "PMT-1002",
      billId: "BILL-1005",
      patient: "David Kimutai",
      patientId: "P-1005",
      date: "2023-04-12",
      amount: 18000,
      method: "M-Pesa",
      reference: "MPESA-2023-1002",
      receivedBy: "Grace Savai",
    },
    {
      id: "PMT-1003",
      billId: "BILL-1002",
      patient: "Sarah Lwikane",
      patientId: "P-1002",
      date: "2023-04-18",
      amount: 15000,
      method: "Insurance",
      reference: "INS-2023-1003",
      receivedBy: "Daniel Mirenja",
    },
    {
      id: "PMT-1004",
      billId: "BILL-1003",
      patient: "Michael Imbunya",
      patientId: "P-1003",
      date: "2023-04-20",
      amount: 50000,
      method: "Insurance",
      reference: "INS-2023-1004",
      receivedBy: "Daniel Mirenja",
    },
  ]

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES" }).format(amount)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Billing & Invoicing</h1>
          <p className="text-muted-foreground">Manage patient bills, invoices, and payments</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Bill
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Billed (This Month)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(273000)}</div>
            <p className="text-xs text-muted-foreground">5 bills generated</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Payments Received</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(108000)}</div>
            <p className="text-xs text-muted-foreground">4 payments processed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(120000)}</div>
            <p className="text-xs text-muted-foreground">2 pending bills</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Overdue Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(45000)}</div>
            <p className="text-xs text-muted-foreground">1 overdue bill</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="bills" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="bills">Bills & Invoices</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
        </TabsList>

        <TabsContent value="bills" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Patient Bills</CardTitle>
              <CardDescription>View and manage patient bills and invoices</CardDescription>
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
                    Paid
                  </Button>
                  <Button variant="outline" size="sm">
                    Overdue
                  </Button>
                </div>
                <div className="relative w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input type="search" placeholder="Search bills..." className="w-full pl-8" />
                </div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bill ID</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payment Method</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bills.map((bill) => (
                      <TableRow key={bill.id}>
                        <TableCell className="font-medium">{bill.id}</TableCell>
                        <TableCell>
                          {bill.patient}
                          <div className="text-xs text-muted-foreground">{bill.patientId}</div>
                        </TableCell>
                        <TableCell>{bill.date}</TableCell>
                        <TableCell>{formatCurrency(bill.amount)}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              bill.status === "Paid"
                                ? "default"
                                : bill.status === "Overdue"
                                  ? "destructive"
                                  : "secondary"
                            }
                          >
                            {bill.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{bill.paymentMethod}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <FileText className="h-4 w-4" />
                              <span className="sr-only">View</span>
                            </Button>
                            <Button variant="outline" size="sm">
                              <Printer className="h-4 w-4" />
                              <span className="sr-only">Print</span>
                            </Button>
                            {bill.status !== "Paid" && (
                              <Button variant="outline" size="sm">
                                Record Payment
                              </Button>
                            )}
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

        <TabsContent value="payments" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment Records</CardTitle>
              <CardDescription>View and manage payment records</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    All
                  </Button>
                  <Button variant="outline" size="sm">
                    Cash
                  </Button>
                  <Button variant="outline" size="sm">
                    M-Pesa
                  </Button>
                  <Button variant="outline" size="sm">
                    Insurance
                  </Button>
                </div>
                <div className="relative w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input type="search" placeholder="Search payments..." className="w-full pl-8" />
                </div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Payment ID</TableHead>
                      <TableHead>Bill ID</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">{payment.id}</TableCell>
                        <TableCell>{payment.billId}</TableCell>
                        <TableCell>
                          {payment.patient}
                          <div className="text-xs text-muted-foreground">{payment.patientId}</div>
                        </TableCell>
                        <TableCell>{payment.date}</TableCell>
                        <TableCell>{formatCurrency(payment.amount)}</TableCell>
                        <TableCell>{payment.method}</TableCell>
                        <TableCell>{payment.reference}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              View
                            </Button>
                            <Button variant="outline" size="sm">
                              <Printer className="h-4 w-4" />
                              <span className="sr-only">Print Receipt</span>
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
    </div>
  )
}
