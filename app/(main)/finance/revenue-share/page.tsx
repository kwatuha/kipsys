"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Download, Search, ArrowUpDown, CheckCircle2, AlertCircle } from "lucide-react"
import { DoctorRevenueAnalytics } from "@/components/doctor-revenue-analytics"
import { DoctorPaymentForm } from "@/components/doctor-payment-form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function DoctorRevenueSharePage() {
  const [openPaymentForm, setOpenPaymentForm] = useState(false)
  const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null)
  const [timeframe, setTimeframe] = useState("month")

  // Mock data for doctors revenue
  const doctorsRevenue = [
    {
      id: "D-1001",
      name: "Dr. James Ndiwa",
      specialty: "Cardiology",
      totalRevenue: 1250000,
      hospitalShare: 375000, // 30%
      kraShare: 62500, // 5%
      doctorShare: 875000, // 70%
      paidAmount: 750000,
      pendingAmount: 125000,
      patientCount: 78,
      completedTreatments: 65,
      lastPaymentDate: "2023-06-15",
      status: "Partially Paid",
    },
    {
      id: "D-1002",
      name: "Dr. Sarah Wangui",
      specialty: "Pediatrics",
      totalRevenue: 980000,
      hospitalShare: 294000,
      kraShare: 49000,
      doctorShare: 686000,
      paidAmount: 686000,
      pendingAmount: 0,
      patientCount: 120,
      completedTreatments: 110,
      lastPaymentDate: "2023-06-20",
      status: "Fully Paid",
    },
    {
      id: "D-1003",
      name: "Dr. Michael Omondi",
      specialty: "Orthopedics",
      totalRevenue: 1450000,
      hospitalShare: 435000,
      kraShare: 72500,
      doctorShare: 1015000,
      paidAmount: 800000,
      pendingAmount: 215000,
      patientCount: 65,
      completedTreatments: 58,
      lastPaymentDate: "2023-06-10",
      status: "Partially Paid",
    },
    {
      id: "D-1004",
      name: "Dr. Emily Achieng",
      specialty: "Gynecology",
      totalRevenue: 1120000,
      hospitalShare: 336000,
      kraShare: 56000,
      doctorShare: 784000,
      paidAmount: 0,
      pendingAmount: 784000,
      patientCount: 92,
      completedTreatments: 85,
      lastPaymentDate: "-",
      status: "Pending",
    },
    {
      id: "D-1005",
      name: "Dr. David Kiprop",
      specialty: "Neurology",
      totalRevenue: 1680000,
      hospitalShare: 504000,
      kraShare: 84000,
      doctorShare: 1176000,
      paidAmount: 1176000,
      pendingAmount: 0,
      patientCount: 45,
      completedTreatments: 42,
      lastPaymentDate: "2023-06-18",
      status: "Fully Paid",
    },
  ]

  // Mock data for recent payments
  const recentPayments = [
    {
      id: "PAY-1001",
      doctorId: "D-1001",
      doctorName: "Dr. James Ndiwa",
      amount: 350000,
      date: "2023-06-15",
      method: "Bank Transfer",
      reference: "BT-20230615-001",
      status: "Completed",
    },
    {
      id: "PAY-1002",
      doctorId: "D-1002",
      doctorName: "Dr. Sarah Wangui",
      amount: 686000,
      date: "2023-06-20",
      method: "Bank Transfer",
      reference: "BT-20230620-001",
      status: "Completed",
    },
    {
      id: "PAY-1003",
      doctorId: "D-1003",
      doctorName: "Dr. Michael Omondi",
      amount: 500000,
      date: "2023-06-05",
      method: "Bank Transfer",
      reference: "BT-20230605-001",
      status: "Completed",
    },
    {
      id: "PAY-1004",
      doctorId: "D-1003",
      doctorName: "Dr. Michael Omondi",
      amount: 300000,
      date: "2023-06-10",
      method: "Bank Transfer",
      reference: "BT-20230610-001",
      status: "Completed",
    },
    {
      id: "PAY-1005",
      doctorId: "D-1005",
      doctorName: "Dr. David Kiprop",
      amount: 1176000,
      date: "2023-06-18",
      method: "Bank Transfer",
      reference: "BT-20230618-001",
      status: "Completed",
    },
  ]

  // Calculate totals
  const totalRevenue = doctorsRevenue.reduce((sum, doctor) => sum + doctor.totalRevenue, 0)
  const totalHospitalShare = doctorsRevenue.reduce((sum, doctor) => sum + doctor.hospitalShare, 0)
  const totalKraShare = doctorsRevenue.reduce((sum, doctor) => sum + doctor.kraShare, 0)
  const totalDoctorShare = doctorsRevenue.reduce((sum, doctor) => sum + doctor.doctorShare, 0)
  const totalPaid = doctorsRevenue.reduce((sum, doctor) => sum + doctor.paidAmount, 0)
  const totalPending = doctorsRevenue.reduce((sum, doctor) => sum + doctor.pendingAmount, 0)

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Handle payment button click
  const handlePaymentClick = (doctorId: string) => {
    setSelectedDoctor(doctorId)
    setOpenPaymentForm(true)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Doctors Revenue Share</h1>
          <p className="text-muted-foreground">Manage revenue allocation and payments to doctors</p>
        </div>
        <div className="flex gap-2">
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">From all doctors</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Hospital Share (30%)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalHospitalShare)}</div>
            <p className="text-xs text-muted-foreground">KRA Share: {formatCurrency(totalKraShare)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Doctors Share (70%)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalDoctorShare)}</div>
            <p className="text-xs text-muted-foreground">Across all doctors</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Payment Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalPaid)}</div>
            <div className="flex items-center text-xs text-amber-500 mt-1">
              <AlertCircle className="h-3 w-3 mr-1" />
              {formatCurrency(totalPending)} pending
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Revenue Overview</TabsTrigger>
          <TabsTrigger value="doctors">Doctors Revenue</TabsTrigger>
          <TabsTrigger value="payments">Payment History</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Distribution</CardTitle>
              <CardDescription>Overview of revenue allocation between hospital, KRA, and doctors</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="font-medium">Hospital Share (30%)</div>
                    <div>{formatCurrency(totalHospitalShare)}</div>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: "30%" }}></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="font-medium">KRA Share (5%)</div>
                    <div>{formatCurrency(totalKraShare)}</div>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: "5%" }}></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="font-medium">Doctors Share (70%)</div>
                    <div>{formatCurrency(totalDoctorShare)}</div>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: "70%" }}></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Payment Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                            <span>Paid</span>
                          </div>
                          <div>{formatCurrency(totalPaid)}</div>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <AlertCircle className="h-4 w-4 mr-2 text-amber-500" />
                            <span>Pending</span>
                          </div>
                          <div>{formatCurrency(totalPending)}</div>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden mt-2">
                          <div
                            className="h-full bg-green-500 rounded-full"
                            style={{ width: `${(totalPaid / totalDoctorShare) * 100}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-muted-foreground text-right mt-1">
                          {Math.round((totalPaid / totalDoctorShare) * 100)}% paid
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Top Performing Doctors</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {doctorsRevenue
                          .sort((a, b) => b.totalRevenue - a.totalRevenue)
                          .slice(0, 3)
                          .map((doctor, index) => (
                            <div key={doctor.id} className="flex justify-between items-center">
                              <div className="flex items-center">
                                <div className="bg-primary text-primary-foreground w-5 h-5 rounded-full flex items-center justify-center text-xs mr-2">
                                  {index + 1}
                                </div>
                                <span>{doctor.name}</span>
                              </div>
                              <div>{formatCurrency(doctor.totalRevenue)}</div>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="doctors" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Doctors Revenue</CardTitle>
              <CardDescription>Revenue generated and payment status for each doctor</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    All
                  </Button>
                  <Button variant="outline" size="sm">
                    Fully Paid
                  </Button>
                  <Button variant="outline" size="sm">
                    Partially Paid
                  </Button>
                  <Button variant="outline" size="sm">
                    Pending
                  </Button>
                </div>
                <div className="relative w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input type="search" placeholder="Search doctors..." className="w-full pl-8" />
                </div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Doctor</TableHead>
                      <TableHead>Specialty</TableHead>
                      <TableHead>
                        <div className="flex items-center">
                          Total Revenue
                          <ArrowUpDown className="ml-1 h-3 w-3" />
                        </div>
                      </TableHead>
                      <TableHead>Hospital Share</TableHead>
                      <TableHead>KRA Share</TableHead>
                      <TableHead>Doctor Share</TableHead>
                      <TableHead>Paid Amount</TableHead>
                      <TableHead>Pending</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {doctorsRevenue.map((doctor) => (
                      <TableRow key={doctor.id}>
                        <TableCell>
                          <div className="font-medium">{doctor.name}</div>
                          <div className="text-xs text-muted-foreground">{doctor.id}</div>
                        </TableCell>
                        <TableCell>{doctor.specialty}</TableCell>
                        <TableCell>{formatCurrency(doctor.totalRevenue)}</TableCell>
                        <TableCell>{formatCurrency(doctor.hospitalShare)}</TableCell>
                        <TableCell>{formatCurrency(doctor.kraShare)}</TableCell>
                        <TableCell>{formatCurrency(doctor.doctorShare)}</TableCell>
                        <TableCell>{formatCurrency(doctor.paidAmount)}</TableCell>
                        <TableCell>{formatCurrency(doctor.pendingAmount)}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              doctor.status === "Fully Paid"
                                ? "default"
                                : doctor.status === "Pending"
                                  ? "secondary"
                                  : "outline"
                            }
                          >
                            {doctor.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePaymentClick(doctor.id)}
                              disabled={doctor.pendingAmount === 0}
                            >
                              {doctor.pendingAmount > 0 ? "Pay" : "Paid"}
                            </Button>
                            <Button variant="outline" size="sm">
                              Details
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

        <TabsContent value="payments" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>Record of payments made to doctors</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    All
                  </Button>
                  <Button variant="outline" size="sm">
                    This Month
                  </Button>
                  <Button variant="outline" size="sm">
                    Last Month
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
                      <TableHead>Doctor</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>
                        <div className="flex items-center">
                          Date
                          <ArrowUpDown className="ml-1 h-3 w-3" />
                        </div>
                      </TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentPayments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">{payment.id}</TableCell>
                        <TableCell>
                          <div>{payment.doctorName}</div>
                          <div className="text-xs text-muted-foreground">{payment.doctorId}</div>
                        </TableCell>
                        <TableCell>{formatCurrency(payment.amount)}</TableCell>
                        <TableCell>{payment.date}</TableCell>
                        <TableCell>{payment.method}</TableCell>
                        <TableCell>{payment.reference}</TableCell>
                        <TableCell>
                          <Badge variant="default">{payment.status}</Badge>
                        </TableCell>
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

        <TabsContent value="analytics" className="space-y-4 mt-4">
          <DoctorRevenueAnalytics />
        </TabsContent>
      </Tabs>

      <DoctorPaymentForm
        open={openPaymentForm}
        onOpenChange={setOpenPaymentForm}
        doctorId={selectedDoctor}
        doctors={doctorsRevenue}
      />
    </div>
  )
}
