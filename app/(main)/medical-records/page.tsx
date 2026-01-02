"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, Search, Upload } from "lucide-react"
import { AddMedicalRecordForm } from "@/components/add-medical-record-form"

export default function MedicalRecordsPage() {
  const [addRecordOpen, setAddRecordOpen] = useState(false)

  const records = [
    {
      id: "MR-3001",
      patientName: "John Imbayi",
      patientId: "P-1001",
      recordType: "Lab Results",
      date: "2023-04-15",
      doctor: "Dr. James Ndiwa",
      department: "Cardiology",
      description: "Complete blood count and lipid profile",
    },
    {
      id: "MR-3002",
      patientName: "Sarah Lwikane",
      patientId: "P-1002",
      recordType: "Imaging",
      date: "2023-04-18",
      doctor: "Dr. Sarah Isuvi",
      department: "Gynecology",
      description: "Ultrasound scan",
    },
    {
      id: "MR-3003",
      patientName: "Michael Imbunya",
      patientId: "P-1003",
      recordType: "Prescription",
      date: "2023-04-20",
      doctor: "Dr. Michael Siva",
      department: "Neurology",
      description: "Medication for migraine treatment",
    },
    {
      id: "MR-3004",
      patientName: "Emily Kimani",
      patientId: "P-1004",
      recordType: "Discharge Summary",
      date: "2023-04-10",
      doctor: "Dr. Emily Logovane",
      department: "Orthopedics",
      description: "Post-surgery recovery plan",
    },
    {
      id: "MR-3005",
      patientName: "David Kimutai",
      patientId: "P-1005",
      recordType: "Lab Results",
      date: "2023-04-12",
      doctor: "Dr. James Ndiwa",
      department: "Cardiology",
      description: "Cardiac enzyme test",
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Medical Records</h1>
          <p className="text-muted-foreground">Access and manage patient medical records</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Upload className="mr-2 h-4 w-4" />
            Import Records
          </Button>
          <Button onClick={() => setAddRecordOpen(true)}>
            <FileText className="mr-2 h-4 w-4" />
            New Record
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Medical Records Management</CardTitle>
          <CardDescription>View and manage all patient medical records in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <div className="flex items-center justify-between mb-4">
              <TabsList>
                <TabsTrigger value="all">All Records</TabsTrigger>
                <TabsTrigger value="lab">Lab Results</TabsTrigger>
                <TabsTrigger value="imaging">Imaging</TabsTrigger>
                <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
              </TabsList>
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input type="search" placeholder="Search records..." className="w-full pl-8" />
              </div>
            </div>

            <TabsContent value="all" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {records.map((record) => (
                  <Card key={record.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{record.recordType}</CardTitle>
                        <span className="text-xs text-muted-foreground">{record.date}</span>
                      </div>
                      <CardDescription>
                        {record.patientName} ({record.patientId})
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm">{record.description}</div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        {record.doctor} • {record.department}
                      </div>
                      <div className="mt-4 flex justify-end">
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Similar content for other tabs */}
          </Tabs>
        </CardContent>
      </Card>

      <AddMedicalRecordForm open={addRecordOpen} onOpenChange={setAddRecordOpen} />
    </div>
  )
}
