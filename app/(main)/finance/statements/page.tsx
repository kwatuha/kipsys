"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Download, Loader2, FileText, User, Users, Search, Calendar } from "lucide-react"
import { ledgerApi, patientApi } from "@/lib/api"
import { format } from "date-fns"
import { toast } from "@/components/ui/use-toast"

export default function FinancialStatementsPage() {
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("patient")

  // Patient Statement
  const [patientSearch, setPatientSearch] = useState("")
  const [patientResults, setPatientResults] = useState<any[]>([])
  const [selectedPatient, setSelectedPatient] = useState<any>(null)
  const [patientStatement, setPatientStatement] = useState<any>(null)
  const [patientStartDate, setPatientStartDate] = useState<string>("")
  const [patientEndDate, setPatientEndDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [patientAsOfDate, setPatientAsOfDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [patientDateMode, setPatientDateMode] = useState<"range" | "asof">("asof")

  // Staff Statement
  const [staffSearch, setStaffSearch] = useState("")
  const [staffResults, setStaffResults] = useState<any[]>([])
  const [selectedStaff, setSelectedStaff] = useState<any>(null)
  const [staffStatement, setStaffStatement] = useState<any>(null)
  const [staffStartDate, setStaffStartDate] = useState<string>("")
  const [staffEndDate, setStaffEndDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [staffAsOfDate, setStaffAsOfDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [staffDateMode, setStaffDateMode] = useState<"range" | "asof">("asof")

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES" }).format(amount)
  }

  const calculateAge = (dateOfBirth: string) => {
    if (!dateOfBirth) return null
    const today = new Date()
    const birth = new Date(dateOfBirth)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }

  // Search patients
  useEffect(() => {
    if (patientSearch.length >= 2) {
      const timeoutId = setTimeout(async () => {
        try {
          const results = await patientApi.getAll(patientSearch, 1, 10)
          setPatientResults(results || [])
        } catch (error) {
          console.error("Error searching patients:", error)
        }
      }, 300)
      return () => clearTimeout(timeoutId)
    } else {
      setPatientResults([])
    }
  }, [patientSearch])

  // Search staff
  useEffect(() => {
    if (staffSearch.length >= 2) {
      const timeoutId = setTimeout(async () => {
        try {
          // Search users/staff - you may need to add a staffApi or use a different endpoint
          const response = await fetch(`/api/users?search=${encodeURIComponent(staffSearch)}&limit=10`)
          if (response.ok) {
            const data = await response.json()
            setStaffResults(data || [])
          }
        } catch (error) {
          console.error("Error searching staff:", error)
        }
      }, 300)
      return () => clearTimeout(timeoutId)
    } else {
      setStaffResults([])
    }
  }, [staffSearch])

  const loadPatientStatement = async () => {
    if (!selectedPatient) {
      toast({
        title: "Error",
        description: "Please select a patient first",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)
      const data = await ledgerApi.getPatientStatement(
        selectedPatient.patientId.toString(),
        patientDateMode === "range" ? patientStartDate : undefined,
        patientDateMode === "range" ? patientEndDate : undefined,
        patientDateMode === "asof" ? patientAsOfDate : undefined
      )
      setPatientStatement(data)
    } catch (error: any) {
      console.error("Error loading patient statement:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to load patient statement",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadStaffStatement = async () => {
    if (!selectedStaff) {
      toast({
        title: "Error",
        description: "Please select a staff member first",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)
      const data = await ledgerApi.getStaffStatement(
        selectedStaff.userId.toString(),
        staffDateMode === "range" ? staffStartDate : undefined,
        staffDateMode === "range" ? staffEndDate : undefined,
        staffDateMode === "asof" ? staffAsOfDate : undefined
      )
      setStaffStatement(data)
    } catch (error: any) {
      console.error("Error loading staff statement:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to load staff statement",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const generatePatientStatementPDF = () => {
    if (!patientStatement) return

    const patient = patientStatement.patient
    const age = calculateAge(patient.dateOfBirth)

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Patient Financial Statement - ${patient.patientNumber}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .header { text-align: center; margin-bottom: 30px; }
    .header h1 { margin: 0; font-size: 24px; }
    .header h2 { margin: 5px 0; font-size: 18px; color: #666; }
    .patient-info { margin-bottom: 20px; }
    .patient-info table { width: 100%; border-collapse: collapse; }
    .patient-info td { padding: 5px 10px; }
    .summary { margin: 20px 0; padding: 15px; background: #f5f5f5; border-radius: 5px; }
    .summary table { width: 100%; }
    .summary td { padding: 5px; }
    .summary td:first-child { font-weight: bold; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; font-weight: bold; }
    .text-right { text-align: right; }
    .footer { margin-top: 30px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="header">
    <img src="${window.location.origin}/logo.png" alt="Kiplombe Medical Centre" style="max-width: 250px; height: auto; margin-bottom: 15px; display: block; margin-left: auto; margin-right: auto;" onerror="this.style.display='none';" />
    <h1>PATIENT FINANCIAL STATEMENT</h1>
    <h2>${patientStatement.statementDate ? format(new Date(patientStatement.statementDate), "dd MMMM yyyy") : ""}</h2>
  </div>

  <div class="patient-info">
    <table>
      <tr>
        <td><strong>Patient Number:</strong></td>
        <td>${patient.patientNumber || "N/A"}</td>
        <td><strong>Name:</strong></td>
        <td>${patient.firstName || ""} ${patient.lastName || ""}</td>
      </tr>
      <tr>
        <td><strong>Date of Birth:</strong></td>
        <td>${patient.dateOfBirth ? format(new Date(patient.dateOfBirth), "dd MMM yyyy") : "N/A"}</td>
        <td><strong>Age:</strong></td>
        <td>${age ? `${age} years` : "N/A"}</td>
      </tr>
      <tr>
        <td><strong>Gender:</strong></td>
        <td>${patient.gender || "N/A"}</td>
        <td><strong>Phone:</strong></td>
        <td>${patient.phone || "N/A"}</td>
      </tr>
    </table>
  </div>

  <div class="summary">
    <table>
      <tr>
        <td>Opening Balance:</td>
        <td class="text-right">${formatCurrency(patientStatement.openingBalance || 0)}</td>
      </tr>
      <tr>
        <td>Total Debits:</td>
        <td class="text-right">${formatCurrency(patientStatement.summary?.totalDebits || 0)}</td>
      </tr>
      <tr>
        <td>Total Credits:</td>
        <td class="text-right">${formatCurrency(patientStatement.summary?.totalCredits || 0)}</td>
      </tr>
      <tr>
        <td><strong>Closing Balance:</strong></td>
        <td class="text-right"><strong>${formatCurrency(patientStatement.closingBalance || 0)}</strong></td>
      </tr>
    </table>
  </div>

  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Transaction #</th>
        <th>Description</th>
        <th>Reference</th>
        <th class="text-right">Debit</th>
        <th class="text-right">Credit</th>
        <th class="text-right">Balance</th>
      </tr>
    </thead>
    <tbody>
      ${patientStatement.transactions?.map((t: any, index: number) => {
        const runningBalance = (patientStatement.openingBalance || 0) +
          patientStatement.transactions.slice(0, index + 1).reduce((sum: number, tx: any) =>
            sum + (parseFloat(tx.debit) || 0) - (parseFloat(tx.credit) || 0), 0)
        return `
        <tr>
          <td>${format(new Date(t.transactionDate), "dd MMM yyyy")}</td>
          <td>${t.transactionNumber || ""}</td>
          <td>${t.description || ""}</td>
          <td>${t.referenceNumber || ""}</td>
          <td class="text-right">${parseFloat(t.debit) > 0 ? formatCurrency(parseFloat(t.debit)) : ""}</td>
          <td class="text-right">${parseFloat(t.credit) > 0 ? formatCurrency(parseFloat(t.credit)) : ""}</td>
          <td class="text-right">${formatCurrency(runningBalance)}</td>
        </tr>
        `
      }).join("") || "<tr><td colspan='7' class='text-center'>No transactions found</td></tr>"}
    </tbody>
  </table>

  <div class="footer">
    <p>Generated on ${format(new Date(), "dd MMMM yyyy 'at' HH:mm")}</p>
  </div>
</body>
</html>
    `

    const blob = new Blob([html], { type: "text/html" })
    const url = URL.createObjectURL(blob)
    const printWindow = window.open(url, "_blank")

    if (printWindow) {
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print()
          setTimeout(() => URL.revokeObjectURL(url), 1000)
        }, 250)
      }
    }
  }

  const generateStaffStatementPDF = () => {
    if (!staffStatement) return

    const staff = staffStatement.staff

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Staff Financial Statement - ${staff.username}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .header { text-align: center; margin-bottom: 30px; }
    .header img { max-width: 250px; height: auto; margin-bottom: 15px; display: block; margin-left: auto; margin-right: auto; }
    .header h1 { margin: 0; font-size: 24px; }
    .header h2 { margin: 5px 0; font-size: 18px; color: #666; }
    .staff-info { margin-bottom: 20px; }
    .staff-info table { width: 100%; border-collapse: collapse; }
    .staff-info td { padding: 5px 10px; }
    .summary { margin: 20px 0; padding: 15px; background: #f5f5f5; border-radius: 5px; }
    .summary table { width: 100%; }
    .summary td { padding: 5px; }
    .summary td:first-child { font-weight: bold; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; font-weight: bold; }
    .text-right { text-align: right; }
    .footer { margin-top: 30px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="header">
    <img src="${window.location.origin}/logo.png" alt="Kiplombe Medical Centre" style="max-width: 250px; height: auto; margin-bottom: 15px; display: block; margin-left: auto; margin-right: auto;" onerror="this.style.display='none';" />
    <h1>STAFF FINANCIAL STATEMENT</h1>
    <h2>${staffStatement.statementDate ? format(new Date(staffStatement.statementDate), "dd MMMM yyyy") : ""}</h2>
  </div>

  <div class="staff-info">
    <table>
      <tr>
        <td><strong>Username:</strong></td>
        <td>${staff.username || "N/A"}</td>
        <td><strong>Name:</strong></td>
        <td>${staff.firstName || ""} ${staff.lastName || ""}</td>
      </tr>
      <tr>
        <td><strong>Role:</strong></td>
        <td>${staff.roleName || "N/A"}</td>
        <td><strong>Department:</strong></td>
        <td>${staff.department || "N/A"}</td>
      </tr>
      <tr>
        <td><strong>Email:</strong></td>
        <td>${staff.email || "N/A"}</td>
        <td></td>
        <td></td>
      </tr>
    </table>
  </div>

  <div class="summary">
    <table>
      <tr>
        <td>Opening Balance:</td>
        <td class="text-right">${formatCurrency(staffStatement.openingBalance || 0)}</td>
      </tr>
      <tr>
        <td>Total Debits:</td>
        <td class="text-right">${formatCurrency(staffStatement.summary?.totalDebits || 0)}</td>
      </tr>
      <tr>
        <td>Total Credits:</td>
        <td class="text-right">${formatCurrency(staffStatement.summary?.totalCredits || 0)}</td>
      </tr>
      <tr>
        <td><strong>Closing Balance:</strong></td>
        <td class="text-right"><strong>${formatCurrency(staffStatement.closingBalance || 0)}</strong></td>
      </tr>
    </table>
  </div>

  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Transaction #</th>
        <th>Description</th>
        <th>Reference</th>
        <th class="text-right">Debit</th>
        <th class="text-right">Credit</th>
        <th class="text-right">Balance</th>
      </tr>
    </thead>
    <tbody>
      ${staffStatement.transactions?.map((t: any, index: number) => {
        const runningBalance = (staffStatement.openingBalance || 0) +
          staffStatement.transactions.slice(0, index + 1).reduce((sum: number, tx: any) =>
            sum + (parseFloat(tx.debit) || 0) - (parseFloat(tx.credit) || 0), 0)
        return `
        <tr>
          <td>${format(new Date(t.transactionDate), "dd MMM yyyy")}</td>
          <td>${t.transactionNumber || ""}</td>
          <td>${t.description || ""}</td>
          <td>${t.referenceNumber || ""}</td>
          <td class="text-right">${parseFloat(t.debit) > 0 ? formatCurrency(parseFloat(t.debit)) : ""}</td>
          <td class="text-right">${parseFloat(t.credit) > 0 ? formatCurrency(parseFloat(t.credit)) : ""}</td>
          <td class="text-right">${formatCurrency(runningBalance)}</td>
        </tr>
        `
      }).join("") || "<tr><td colspan='7' class='text-center'>No transactions found</td></tr>"}
    </tbody>
  </table>

  <div class="footer">
    <p>Generated on ${format(new Date(), "dd MMMM yyyy 'at' HH:mm")}</p>
  </div>
</body>
</html>
    `

    const blob = new Blob([html], { type: "text/html" })
    const url = URL.createObjectURL(blob)
    const printWindow = window.open(url, "_blank")

    if (printWindow) {
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print()
          setTimeout(() => URL.revokeObjectURL(url), 1000)
        }, 250)
      }
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Financial Statements</h1>
          <p className="text-muted-foreground">View patient and staff financial statements with debits, credits, and balances</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="patient" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Patient Statement
          </TabsTrigger>
          <TabsTrigger value="staff" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Staff Statement
          </TabsTrigger>
        </TabsList>

        {/* Patient Statement */}
        <TabsContent value="patient" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Patient Financial Statement</CardTitle>
              <CardDescription>Search and select a patient to view their financial statement</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Search Patient</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or patient number..."
                    value={patientSearch}
                    onChange={(e) => setPatientSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                {patientResults.length > 0 && (
                  <div className="border rounded-md max-h-60 overflow-y-auto">
                    {patientResults.map((patient) => (
                      <div
                        key={patient.patientId}
                        className="p-2 hover:bg-muted cursor-pointer"
                        onClick={() => {
                          setSelectedPatient(patient)
                          setPatientSearch("")
                          setPatientResults([])
                        }}
                      >
                        <div className="font-medium">{patient.firstName} {patient.lastName}</div>
                        <div className="text-sm text-muted-foreground">{patient.patientNumber}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {selectedPatient && (
                <div className="p-4 bg-muted rounded-md">
                  <div className="font-medium">{selectedPatient.firstName} {selectedPatient.lastName}</div>
                  <div className="text-sm text-muted-foreground">Patient #: {selectedPatient.patientNumber}</div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date Range Mode</Label>
                  <Select value={patientDateMode} onValueChange={(v: "range" | "asof") => setPatientDateMode(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asof">As of Date</SelectItem>
                      <SelectItem value="range">Date Range</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {patientDateMode === "asof" ? (
                  <div className="space-y-2">
                    <Label>As of Date</Label>
                    <Input
                      type="date"
                      value={patientAsOfDate}
                      onChange={(e) => setPatientAsOfDate(e.target.value)}
                    />
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label>Start Date</Label>
                      <Input
                        type="date"
                        value={patientStartDate}
                        onChange={(e) => setPatientStartDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>End Date</Label>
                      <Input
                        type="date"
                        value={patientEndDate}
                        onChange={(e) => setPatientEndDate(e.target.value)}
                      />
                    </div>
                  </>
                )}
              </div>

              <Button onClick={loadPatientStatement} disabled={loading || !selectedPatient}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                Load Statement
              </Button>
            </CardContent>
          </Card>

          {patientStatement && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Patient Statement</CardTitle>
                    <CardDescription>
                      {patientStatement.patient.firstName} {patientStatement.patient.lastName} - {patientStatement.patient.patientNumber}
                    </CardDescription>
                  </div>
                  <Button onClick={generatePatientStatementPDF} variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div className="p-4 bg-muted rounded-md">
                    <div className="text-sm text-muted-foreground">Amount Invoiced</div>
                    <div className="text-2xl font-bold">{formatCurrency(patientStatement.summary?.totalInvoiced || patientStatement.summary?.totalDebits || 0)}</div>
                  </div>
                  <div className="p-4 bg-muted rounded-md">
                    <div className="text-sm text-muted-foreground">Amount Paid</div>
                    <div className="text-2xl font-bold">{formatCurrency(patientStatement.summary?.totalPaid || patientStatement.summary?.totalCredits || 0)}</div>
                  </div>
                  <div className="p-4 bg-muted rounded-md">
                    <div className="text-sm text-muted-foreground">Outstanding Balance</div>
                    <div className="text-2xl font-bold">{formatCurrency(patientStatement.summary?.totalOutstanding || patientStatement.closingBalance || 0)}</div>
                  </div>
                  <div className="p-4 bg-muted rounded-md">
                    <div className="text-sm text-muted-foreground">Closing Balance</div>
                    <div className="text-2xl font-bold">{formatCurrency(patientStatement.closingBalance || 0)}</div>
                  </div>
                </div>

                {patientStatement.transactions?.length > 0 ? (
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Transaction #</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Reference</TableHead>
                          <TableHead className="text-right">Debit</TableHead>
                          <TableHead className="text-right">Credit</TableHead>
                          <TableHead className="text-right">Balance</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {patientStatement.transactions.map((t: any, index: number) => {
                          const runningBalance = (patientStatement.openingBalance || 0) +
                            patientStatement.transactions.slice(0, index + 1).reduce((sum: number, tx: any) =>
                              sum + (parseFloat(tx.debit) || 0) - (parseFloat(tx.credit) || 0), 0)
                          return (
                            <TableRow key={t.transactionId}>
                              <TableCell>{format(new Date(t.transactionDate), "dd MMM yyyy")}</TableCell>
                              <TableCell>{t.transactionNumber || ""}</TableCell>
                              <TableCell>{t.description || ""}</TableCell>
                              <TableCell>{t.referenceNumber || ""}</TableCell>
                              <TableCell className="text-right">{parseFloat(t.debit) > 0 ? formatCurrency(parseFloat(t.debit)) : ""}</TableCell>
                              <TableCell className="text-right">{parseFloat(t.credit) > 0 ? formatCurrency(parseFloat(t.credit)) : ""}</TableCell>
                              <TableCell className="text-right">{formatCurrency(runningBalance)}</TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                ) : patientStatement.invoices?.length > 0 ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                      <p className="text-sm text-yellow-800">
                        <strong>Note:</strong> No transactions found for this patient's invoices.
                        Transactions are created when payments are processed. Below are the patient's invoices:
                      </p>
                    </div>
                    <div className="border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Invoice #</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Total Amount</TableHead>
                            <TableHead>Balance</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {patientStatement.invoices.map((inv: any) => (
                            <TableRow key={inv.invoiceId}>
                              <TableCell>{inv.invoiceNumber || ""}</TableCell>
                              <TableCell>{format(new Date(inv.invoiceDate), "dd MMM yyyy")}</TableCell>
                              <TableCell className="text-right">{formatCurrency(parseFloat(inv.totalAmount) || 0)}</TableCell>
                              <TableCell className="text-right">{formatCurrency(parseFloat(inv.balance) || 0)}</TableCell>
                              <TableCell>
                                <Badge variant={inv.status === 'paid' ? 'default' : inv.status === 'pending' ? 'secondary' : 'destructive'}>
                                  {inv.status || 'Unknown'}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-muted rounded-md text-center text-muted-foreground">
                    No transactions or invoices found for this patient
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Staff Statement */}
        <TabsContent value="staff" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Staff Financial Statement</CardTitle>
              <CardDescription>Search and select a staff member to view their financial statement</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Search Staff</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or username..."
                    value={staffSearch}
                    onChange={(e) => setStaffSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                {staffResults.length > 0 && (
                  <div className="border rounded-md max-h-60 overflow-y-auto">
                    {staffResults.map((staff) => (
                      <div
                        key={staff.userId}
                        className="p-2 hover:bg-muted cursor-pointer"
                        onClick={() => {
                          setSelectedStaff(staff)
                          setStaffSearch("")
                          setStaffResults([])
                        }}
                      >
                        <div className="font-medium">{staff.firstName} {staff.lastName}</div>
                        <div className="text-sm text-muted-foreground">{staff.username} - {staff.department || "N/A"}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {selectedStaff && (
                <div className="p-4 bg-muted rounded-md">
                  <div className="font-medium">{selectedStaff.firstName} {selectedStaff.lastName}</div>
                  <div className="text-sm text-muted-foreground">Username: {selectedStaff.username} | Department: {selectedStaff.department || "N/A"}</div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date Range Mode</Label>
                  <Select value={staffDateMode} onValueChange={(v: "range" | "asof") => setStaffDateMode(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asof">As of Date</SelectItem>
                      <SelectItem value="range">Date Range</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {staffDateMode === "asof" ? (
                  <div className="space-y-2">
                    <Label>As of Date</Label>
                    <Input
                      type="date"
                      value={staffAsOfDate}
                      onChange={(e) => setStaffAsOfDate(e.target.value)}
                    />
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label>Start Date</Label>
                      <Input
                        type="date"
                        value={staffStartDate}
                        onChange={(e) => setStaffStartDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>End Date</Label>
                      <Input
                        type="date"
                        value={staffEndDate}
                        onChange={(e) => setStaffEndDate(e.target.value)}
                      />
                    </div>
                  </>
                )}
              </div>

              <Button onClick={loadStaffStatement} disabled={loading || !selectedStaff}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                Load Statement
              </Button>
            </CardContent>
          </Card>

          {staffStatement && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Staff Statement</CardTitle>
                    <CardDescription>
                      {staffStatement.staff.firstName} {staffStatement.staff.lastName} - {staffStatement.staff.username}
                    </CardDescription>
                  </div>
                  <Button onClick={generateStaffStatementPDF} variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div className="p-4 bg-muted rounded-md">
                    <div className="text-sm text-muted-foreground">Opening Balance</div>
                    <div className="text-2xl font-bold">{formatCurrency(staffStatement.openingBalance || 0)}</div>
                  </div>
                  <div className="p-4 bg-muted rounded-md">
                    <div className="text-sm text-muted-foreground">Total Debits</div>
                    <div className="text-2xl font-bold">{formatCurrency(staffStatement.summary?.totalDebits || 0)}</div>
                  </div>
                  <div className="p-4 bg-muted rounded-md">
                    <div className="text-sm text-muted-foreground">Total Credits</div>
                    <div className="text-2xl font-bold">{formatCurrency(staffStatement.summary?.totalCredits || 0)}</div>
                  </div>
                  <div className="p-4 bg-muted rounded-md">
                    <div className="text-sm text-muted-foreground">Closing Balance</div>
                    <div className="text-2xl font-bold">{formatCurrency(staffStatement.closingBalance || 0)}</div>
                  </div>
                </div>

                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Transaction #</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Reference</TableHead>
                        <TableHead className="text-right">Debit</TableHead>
                        <TableHead className="text-right">Credit</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {staffStatement.transactions?.length > 0 ? (
                        staffStatement.transactions.map((t: any, index: number) => {
                          const runningBalance = (staffStatement.openingBalance || 0) +
                            staffStatement.transactions.slice(0, index + 1).reduce((sum: number, tx: any) =>
                              sum + (parseFloat(tx.debit) || 0) - (parseFloat(tx.credit) || 0), 0)
                          return (
                            <TableRow key={t.transactionId}>
                              <TableCell>{format(new Date(t.transactionDate), "dd MMM yyyy")}</TableCell>
                              <TableCell>{t.transactionNumber || ""}</TableCell>
                              <TableCell>{t.description || ""}</TableCell>
                              <TableCell>{t.referenceNumber || ""}</TableCell>
                              <TableCell className="text-right">{parseFloat(t.debit) > 0 ? formatCurrency(parseFloat(t.debit)) : ""}</TableCell>
                              <TableCell className="text-right">{parseFloat(t.credit) > 0 ? formatCurrency(parseFloat(t.credit)) : ""}</TableCell>
                              <TableCell className="text-right">{formatCurrency(runningBalance)}</TableCell>
                            </TableRow>
                          )
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground">
                            No transactions found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
