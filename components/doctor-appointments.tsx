"use client"

import { useState } from "react"
import { Calendar, Check, Clock, Download, FileText, Search, X } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function DoctorAppointments({ doctorId }: { doctorId: string }) {
  const [searchTerm, setSearchTerm] = useState("")

  // Mock data - would come from API in real application
  const appointments = [
    {
      id: "A-1001",
      patientId: "P-1001",
      patientName: "John Kamau",
      date: "2023-05-25",
      time: "09:00 AM",
      type: "Follow-up",
      status: "Scheduled",
      duration: 30,
      reason: "Blood pressure check",
      notes: "Patient has been compliant with medication",
      avatar: "/vibrant-street-market.png",
      initials: "JK",
    },
    {
      id: "A-1002",
      patientId: "P-1002",
      patientName: "Jane Wangari",
      date: "2023-05-25",
      time: "10:00 AM",
      type: "Follow-up",
      status: "Scheduled",
      duration: 30,
      reason: "Medication review",
      notes: "Patient reporting improvement in symptoms",
      avatar: "/diverse-group-chatting.png",
      initials: "JW",
    },
    {
      id: "A-1003",
      patientId: "P-1003",
      patientName: "Robert Ochieng",
      date: "2023-05-25",
      time: "11:00 AM",
      type: "Emergency",
      status: "Scheduled",
      duration: 45,
      reason: "Chest pain",
      notes: "Patient experiencing increased chest pain",
      avatar: "/diverse-group-meeting.png",
      initials: "RO",
    },
    {
      id: "A-1004",
      patientId: "P-1004",
      patientName: "Mary Akinyi",
      date: "2023-05-24",
      time: "09:30 AM",
      type: "Follow-up",
      status: "Completed",
      duration: 30,
      reason: "ECG results review",
      notes: "ECG shows normal sinus rhythm",
      avatar: "/diverse-group-city.png",
      initials: "MA",
    },
    {
      id: "A-1005",
      patientId: "P-1005",
      patientName: "David Mwangi",
      date: "2023-05-24",
      time: "10:30 AM",
      type: "Initial",
      status: "Completed",
      duration: 45,
      reason: "New patient consultation",
      notes: "Patient has family history of heart disease",
      avatar: "/thoughtful-portrait.png",
      initials: "DM",
    },
    {
      id: "A-1006",
      patientId: "P-1006",
      patientName: "Sarah Njeri",
      date: "2023-05-24",
      time: "11:30 AM",
      type: "Follow-up",
      status: "Completed",
      duration: 30,
      reason: "Medication adjustment",
      notes: "Increased dosage of beta blocker",
      avatar: "/diverse-group-chatting.png",
      initials: "SN",
    },
    {
      id: "A-1007",
      patientId: "P-1007",
      patientName: "Michael Otieno",
      date: "2023-05-23",
      time: "09:00 AM",
      type: "Procedure",
      status: "Completed",
      duration: 60,
      reason: "Stress test",
      notes: "Stress test showed no significant abnormalities",
      avatar: "/diverse-group-meeting.png",
      initials: "MO",
    },
    {
      id: "A-1008",
      patientId: "P-1001",
      patientName: "John Kamau",
      date: "2023-05-23",
      time: "10:30 AM",
      type: "Follow-up",
      status: "Completed",
      duration: 30,
      reason: "Medication review",
      notes: "Patient responding well to current medication regimen",
      avatar: "/vibrant-street-market.png",
      initials: "JK",
    },
    {
      id: "A-1009",
      patientId: "P-1002",
      patientName: "Jane Wangari",
      date: "2023-05-26",
      time: "09:00 AM",
      type: "Procedure",
      status: "Scheduled",
      duration: 60,
      reason: "Echocardiogram",
      notes: "Routine follow-up echocardiogram",
      avatar: "/diverse-group-chatting.png",
      initials: "JW",
    },
    {
      id: "A-1010",
      patientId: "P-1003",
      patientName: "Robert Ochieng",
      date: "2023-05-26",
      time: "10:30 AM",
      type: "Follow-up",
      status: "Scheduled",
      duration: 30,
      reason: "Post-emergency follow-up",
      notes: "Follow-up after emergency visit for chest pain",
      avatar: "/diverse-group-meeting.png",
      initials: "RO",
    },
  ]

  // Filter appointments based on search term
  const filteredAppointments = appointments.filter(
    (appointment) =>
      appointment.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.patientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.reason.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Appointment statistics
  const totalAppointments = appointments.length
  const scheduledAppointments = appointments.filter((a) => a.status === "Scheduled").length
  const completedAppointments = appointments.filter((a) => a.status === "Completed").length
  const cancelledAppointments = appointments.filter((a) => a.status === "Cancelled").length
  const avgDuration = Math.round(
    appointments.reduce((sum, appointment) => sum + appointment.duration, 0) / appointments.length,
  )

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Appointment Management</CardTitle>
              <CardDescription>View and manage appointments for Dr. {doctorId.split("-")[1]}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Calendar className="mr-2 h-4 w-4" />
                Schedule
              </Button>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                <Calendar className="h-8 w-8 text-primary mb-2" />
                <div className="text-2xl font-bold">{totalAppointments}</div>
                <p className="text-sm text-muted-foreground">Total Appointments</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                <Check className="h-8 w-8 text-primary mb-2" />
                <div className="text-2xl font-bold">{completedAppointments}</div>
                <p className="text-sm text-muted-foreground">Completed</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                <Clock className="h-8 w-8 text-primary mb-2" />
                <div className="text-2xl font-bold">{scheduledAppointments}</div>
                <p className="text-sm text-muted-foreground">Scheduled</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                <X className="h-8 w-8 text-primary mb-2" />
                <div className="text-2xl font-bold">{cancelledAppointments}</div>
                <p className="text-sm text-muted-foreground">Cancelled</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="all">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
              <TabsList>
                <TabsTrigger value="all">All Appointments</TabsTrigger>
                <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
                <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
              </TabsList>
              <div className="flex items-center gap-2">
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search appointments..."
                    className="w-full pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select defaultValue="date-desc">
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date-desc">Date (Newest)</SelectItem>
                    <SelectItem value="date-asc">Date (Oldest)</SelectItem>
                    <SelectItem value="patient">Patient Name</SelectItem>
                    <SelectItem value="type">Appointment Type</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <TabsContent value="all" className="space-y-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Appointment ID</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAppointments.map((appointment) => (
                      <TableRow key={appointment.id}>
                        <TableCell className="font-medium">{appointment.id}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage
                                src={appointment.avatar || "/placeholder.svg"}
                                alt={appointment.patientName}
                              />
                              <AvatarFallback>{appointment.initials}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div>{appointment.patientName}</div>
                              <div className="text-xs text-muted-foreground">{appointment.patientId}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{appointment.date}</TableCell>
                        <TableCell>{appointment.time}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              appointment.type === "Emergency"
                                ? "destructive"
                                : appointment.type === "Procedure"
                                  ? "secondary"
                                  : "outline"
                            }
                          >
                            {appointment.type}
                          </Badge>
                        </TableCell>
                        <TableCell>{appointment.duration} min</TableCell>
                        <TableCell>{appointment.reason}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              appointment.status === "Completed"
                                ? "default"
                                : appointment.status === "Scheduled"
                                  ? "secondary"
                                  : "outline"
                            }
                          >
                            {appointment.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon">
                              <FileText className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Calendar className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* Similar content for other tabs */}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
