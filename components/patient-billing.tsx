import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Download, Eye } from "lucide-react"

type Invoice = {
  id: string
  date: string
  amount: number
  status: string
  dueDate: string
  items: InvoiceItem[]
  paymentMethod: string
  paymentDate: string | null
  insuranceCoverage: number
  patientResponsibility: number
}

type InvoiceItem = {
  description: string
  quantity: number
  unitPrice: number
  total: number
  category: string
}

// Mock data for demonstration
const invoices: Invoice[] = [
  {
    id: "INV-1001",
    date: "2023-04-15",
    amount: 15000,
    status: "Paid",
    dueDate: "2023-05-15",
    items: [
      { description: "Cardiology Consultation", quantity: 1, unitPrice: 3000, total: 3000, category: "Consultation" },
      { description: "ECG", quantity: 1, unitPrice: 2000, total: 2000, category: "Diagnostic" },
      { description: "Blood Tests", quantity: 1, unitPrice: 5000, total: 5000, category: "Laboratory" },
      { description: "Medication", quantity: 1, unitPrice: 5000, total: 5000, category: "Pharmacy" },
    ],
    paymentMethod: "Insurance",
    paymentDate: "2023-04-20",
    insuranceCoverage: 12000,
    patientResponsibility: 3000,
  },
  {
    id: "INV-985",
    date: "2023-03-20",
    amount: 8000,
    status: "Paid",
    dueDate: "2023-04-20",
    items: [
      { description: "General Checkup", quantity: 1, unitPrice: 2000, total: 2000, category: "Consultation" },
      { description: "Urinalysis", quantity: 1, unitPrice: 1000, total: 1000, category: "Laboratory" },
      { description: "X-Ray", quantity: 1, unitPrice: 5000, total: 5000, category: "Radiology" },
    ],
    paymentMethod: "Cash",
    paymentDate: "2023-03-20",
    insuranceCoverage: 6000,
    patientResponsibility: 2000,
  },
  {
    id: "INV-950",
    date: "2023-02-10",
    amount: 12000,
    status: "Paid",
    dueDate: "2023-03-10",
    items: [
      { description: "Neurology Consultation", quantity: 1, unitPrice: 4000, total: 4000, category: "Consultation" },
      { description: "MRI Scan", quantity: 1, unitPrice: 8000, total: 8000, category: "Radiology" },
    ],
    paymentMethod: "Insurance",
    paymentDate: "2023-02-15",
    insuranceCoverage: 9600,
    patientResponsibility: 2400,
  },
  {
    id: "INV-1050",
    date: "2023-05-10",
    amount: 7000,
    status: "Pending",
    dueDate: "2023-06-10",
    items: [
      {
        description: "Ophthalmology Consultation",
        quantity: 1,
        unitPrice: 2500,
        total: 2500,
        category: "Consultation",
      },
      { description: "Eye Examination", quantity: 1, unitPrice: 1500, total: 1500, category: "Diagnostic" },
      { description: "Prescription Glasses", quantity: 1, unitPrice: 3000, total: 3000, category: "Medical Supplies" },
    ],
    paymentMethod: "Pending",
    paymentDate: null,
    insuranceCoverage: 5000,
    patientResponsibility: 2000,
  },
]

export function PatientBilling({ patientId }: { patientId: string }) {
  // In a real application, you would fetch the billing data based on the patient ID
  // const { data: bills, isLoading, error } = usePatientBilling(patientId)

  const bills = invoices // Using mock data for demonstration
  const paidInvoices = bills.filter((bill) => bill.status === "Paid")
  const pendingInvoices = bills.filter((bill) => bill.status === "Pending")

  // Calculate totals
  const totalBilled = bills.reduce((sum, bill) => sum + bill.amount, 0)
  const totalPaid = paidInvoices.reduce((sum, bill) => sum + bill.amount, 0)
  const totalPending = pendingInvoices.reduce((sum, bill) => sum + bill.amount, 0)
  const totalInsuranceCoverage = bills.reduce((sum, bill) => sum + bill.insuranceCoverage, 0)
  const totalPatientResponsibility = bills.reduce((sum, bill) => sum + bill.patientResponsibility, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Billing & Payments</CardTitle>
        <CardDescription>Invoice history and payment information</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="text-sm font-medium text-muted-foreground">Total Billed</div>
              <div className="text-2xl font-bold">KES {totalBilled.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm font-medium text-muted-foreground">Insurance Coverage</div>
              <div className="text-2xl font-bold">KES {totalInsuranceCoverage.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm font-medium text-muted-foreground">Patient Responsibility</div>
              <div className="text-2xl font-bold">KES {totalPatientResponsibility.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All Invoices</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="paid">Paid</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Insurance</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bills.map((bill) => (
                    <TableRow key={bill.id}>
                      <TableCell className="font-medium">{bill.id}</TableCell>
                      <TableCell>{bill.date}</TableCell>
                      <TableCell>KES {bill.amount.toLocaleString()}</TableCell>
                      <TableCell>KES {bill.insuranceCoverage.toLocaleString()}</TableCell>
                      <TableCell>KES {bill.patientResponsibility.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant={bill.status === "Paid" ? "default" : "secondary"}>{bill.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-1" />
                            PDF
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="pending" className="space-y-4">
            {pendingInvoices.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Insurance</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingInvoices.map((bill) => (
                      <TableRow key={bill.id}>
                        <TableCell className="font-medium">{bill.id}</TableCell>
                        <TableCell>{bill.date}</TableCell>
                        <TableCell>{bill.dueDate}</TableCell>
                        <TableCell>KES {bill.amount.toLocaleString()}</TableCell>
                        <TableCell>KES {bill.insuranceCoverage.toLocaleString()}</TableCell>
                        <TableCell>KES {bill.patientResponsibility.toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          <Button size="sm">Pay Now</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">No pending invoices found</div>
            )}
          </TabsContent>

          <TabsContent value="paid" className="space-y-4">
            {paidInvoices.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Payment Method</TableHead>
                      <TableHead>Payment Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paidInvoices.map((bill) => (
                      <TableRow key={bill.id}>
                        <TableCell className="font-medium">{bill.id}</TableCell>
                        <TableCell>{bill.date}</TableCell>
                        <TableCell>KES {bill.amount.toLocaleString()}</TableCell>
                        <TableCell>{bill.paymentMethod}</TableCell>
                        <TableCell>{bill.paymentDate}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-1" />
                            Receipt
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">No paid invoices found</div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
