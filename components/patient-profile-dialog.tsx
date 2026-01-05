"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { hasPermission } from "@/lib/auth/permissions"
import { AlertTriangle, FileText, User } from "lucide-react"

interface PatientProfileDialogProps {
  patientId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PatientProfileDialog({ patientId, open, onOpenChange }: PatientProfileDialogProps) {
  const [loading, setLoading] = useState(false)

  // In a real app, you would fetch this data based on the patientId
  const patient = {
    id: patientId,
    name: "John Imbayi",
    age: 45,
    gender: "Male",
    dob: "1978-05-15",
    bloodType: "O+",
    contact: "+254 712 345 678",
    email: "john.imbayi@example.com",
    address: "123 Moi Avenue, Nairobi",
    emergencyContact: "Sarah Imbayi (Wife) - +254 723 456 789",
    occupation: "Teacher",
    maritalStatus: "Married",
    nationalId: "12345678",
    insuranceProvider: "SHA",
    insuranceNumber: "SHA-123456789",
    registrationDate: "2020-03-10",
    status: "Active",
    avatar: "/thoughtful-portrait.png",
    initials: "JI",
  }

  const handleFullProfileRequest = () => {
    setLoading(true)
    // Simulate API call
    setTimeout(() => {
      setLoading(false)
      alert("Your request to view the full patient profile has been sent to the supervisor.")
    }, 1000)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Patient Information</DialogTitle>
          <DialogDescription>
            {hasPermission("view_patient_full")
              ? "View complete patient information"
              : "Limited patient information based on your access level"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col space-y-4">
          {/* Patient Basic Info Card */}
          <div className="flex flex-col items-center space-y-3 pb-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={patient.avatar || "/placeholder.svg"} alt={patient.name} />
              <AvatarFallback>{patient.initials}</AvatarFallback>
            </Avatar>
            <div className="space-y-1 text-center">
              <h3 className="text-xl font-semibold">{patient.name}</h3>
              <p className="text-sm text-muted-foreground">
                #{patient.id} • {patient.age} years • {patient.gender}
              </p>
              <Badge variant={patient.status === "Active" ? "default" : "outline"}>{patient.status}</Badge>
            </div>
          </div>

          {/* Tabs for different sections */}
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">
                <User className="h-4 w-4 mr-2" />
                Basic Info
              </TabsTrigger>
              <TabsTrigger
                value="medical"
                disabled={!hasPermission("view_patient_medical")}
                title={
                  !hasPermission("view_patient_medical") ? "You don't have permission to view medical information" : ""
                }
              >
                <FileText className="h-4 w-4 mr-2" />
                Medical
              </TabsTrigger>
              <TabsTrigger
                value="alerts"
                disabled={!hasPermission("view_patient_medical")}
                title={!hasPermission("view_patient_medical") ? "You don't have permission to view alerts" : ""}
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Alerts
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Date of Birth</p>
                  <p className="text-sm font-medium">{patient.dob}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">National ID</p>
                  <p className="text-sm font-medium">{patient.nationalId}</p>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Contact</p>
                <p className="text-sm font-medium">{patient.contact}</p>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm font-medium">{patient.email}</p>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Address</p>
                <p className="text-sm font-medium">{patient.address}</p>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Insurance</p>
                <p className="text-sm font-medium">
                  {patient.insuranceProvider} - {patient.insuranceNumber}
                </p>
              </div>
            </TabsContent>

            <TabsContent value="medical" className="space-y-4 mt-4">
              {hasPermission("view_patient_medical") ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Blood Type</p>
                      <p className="text-sm font-medium">{patient.bloodType}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Last Visit</p>
                      <p className="text-sm font-medium">2023-04-15</p>
                    </div>
                  </div>
                  <Card className="p-4">
                    <p className="text-sm font-medium">Medical information would be displayed here</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      This includes diagnoses, medications, allergies, and other medical history.
                    </p>
                  </Card>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">Access Restricted</h3>
                  <p className="text-sm text-muted-foreground mt-2 max-w-md">
                    You don't have permission to view medical information. This is restricted to clinical staff.
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="alerts" className="space-y-4 mt-4">
              {hasPermission("view_patient_medical") ? (
                <div className="space-y-4">
                  <Card className="p-4 border-red-200 bg-red-50 dark:bg-red-950/20">
                    <h4 className="font-medium text-red-700 dark:text-red-400">Allergies</h4>
                    <p className="text-sm text-red-600 dark:text-red-300 mt-1">Penicillin - Severe reaction</p>
                  </Card>
                  <Card className="p-4 border-amber-200 bg-amber-50 dark:bg-amber-950/20">
                    <h4 className="font-medium text-amber-700 dark:text-amber-400">Medical Conditions</h4>
                    <p className="text-sm text-amber-600 dark:text-amber-300 mt-1">
                      Hypertension - Controlled with medication
                    </p>
                  </Card>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">Access Restricted</h3>
                  <p className="text-sm text-muted-foreground mt-2 max-w-md">
                    You don't have permission to view patient alerts. This is restricted to clinical staff.
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Action buttons */}
          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            {!hasPermission("view_patient_full") && (
              <Button onClick={handleFullProfileRequest} disabled={loading}>
                {loading ? "Requesting..." : "Request Full Access"}
              </Button>
            )}
            {hasPermission("view_patient_full") && (
              <Button asChild>
                <a href={`/patients/${patientId}`}>View Full Profile</a>
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
